import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Bill, Order, OrderItem, Table, RestaurantSettings } from '../../lib/types';
import { useCustomer } from '../../contexts/CustomerContext';
import { CreditCard, Banknote, Download, Star } from 'lucide-react';

interface BillingPaymentProps {
  table: Table;
  onPaymentComplete: () => void;
}

export function BillingPayment({ table, onPaymentComplete }: BillingPaymentProps) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [orders, setOrders] = useState<(Order & { items: OrderItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { customer } = useCustomer();

  useEffect(() => {
    if (customer && table) {
      loadBillData();
    }
  }, [customer, table]);

  const loadBillData = async () => {
    if (!customer) return;

    try {
      const [settingsResult, ordersResult] = await Promise.all([
        supabase.from('restaurant_settings').select('*').single(),
        supabase
          .from('orders')
          .select('*')
          .eq('customer_id', customer.id)
          .eq('table_id', table.id)
          .eq('status', 'served')
      ]);

      if (settingsResult.data) setSettings(settingsResult.data);

      if (ordersResult.data) {
        const ordersWithItems = await Promise.all(
          ordersResult.data.map(async (order) => {
            const { data: items } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);
            return { ...order, items: items || [] };
          })
        );
        setOrders(ordersWithItems);
      }

      const { data: existingBill } = await supabase
        .from('bills')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('table_id', table.id)
        .eq('payment_status', 'pending')
        .maybeSingle();

      if (existingBill) {
        setBill(existingBill);
      } else {
        await generateBill(ordersResult.data || [], settingsResult.data);
      }
    } catch (error) {
      console.error('Error loading bill data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBill = async (servedOrders: Order[], restaurantSettings: RestaurantSettings | null) => {
    if (!customer || !restaurantSettings || servedOrders.length === 0) return;

    const subtotal = servedOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const gstAmount = (subtotal * restaurantSettings.gst_percentage) / 100;
    const totalAmount = subtotal + gstAmount;

    const allItems = orders.flatMap(o => o.items);

    const billData = {
      restaurantName: restaurantSettings.name,
      restaurantAddress: restaurantSettings.address,
      customerName: customer.name,
      customerMobile: customer.mobile,
      tableNumber: table.table_number,
      items: allItems.map(item => ({
        name: item.item_name,
        quantity: item.quantity,
        price: item.item_price,
        subtotal: item.subtotal
      })),
      subtotal,
      gstPercentage: restaurantSettings.gst_percentage,
      gstAmount,
      totalAmount,
      paymentMethod: '',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    const billNumber = `BILL${Date.now()}`;

    const { data: newBill, error } = await supabase
      .from('bills')
      .insert({
        bill_number: billNumber,
        customer_id: customer.id,
        table_id: table.id,
        customer_name: customer.name,
        customer_mobile: customer.mobile,
        subtotal,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        payment_status: 'pending',
        bill_data: billData
      })
      .select()
      .single();

    if (error) throw error;
    setBill(newBill);
  };

  const makePayment = async (method: 'online' | 'cash') => {
    if (!bill || !customer) return;

    setPaying(true);
    try {
      const updatedBillData = {
        ...bill.bill_data,
        paymentMethod: method === 'online' ? 'Online Payment' : 'Cash Payment'
      };

      await supabase
        .from('bills')
        .update({
          payment_method: method,
          payment_status: method === 'online' ? 'completed' : 'approved',
          bill_data: updatedBillData,
          paid_at: new Date().toISOString()
        })
        .eq('id', bill.id);

      if (method === 'online') {
        await supabase
          .from('tables')
          .update({ status: 'available', occupied_by: null })
          .eq('id', table.id);

        await supabase
          .from('customers')
          .update({ current_table_id: null })
          .eq('id', customer.id);

        setShowFeedback(true);
      } else {
        alert('Payment pending manager confirmation. Please wait.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const submitFeedback = async () => {
    if (!customer || rating === 0) return;

    try {
      await supabase.from('feedback').insert({
        customer_id: customer.id,
        customer_name: customer.name,
        rating,
        comment
      });

      alert('Thank you for your feedback!');
      onPaymentComplete();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const downloadBill = () => {
    if (!bill || !bill.bill_data) return;

    const data = bill.bill_data;
    let billText = `
${data.restaurantName}
${data.restaurantAddress}
${'='.repeat(50)}

Bill No: ${bill.bill_number}
Date: ${data.date}
Time: ${data.time}

Customer: ${data.customerName}
Mobile: ${data.customerMobile}
Table: ${data.tableNumber}

${'='.repeat(50)}

ITEMS:
${data.items.map(item => `${item.quantity}x ${item.name} - ₹${item.price} = ₹${item.subtotal}`).join('\n')}

${'='.repeat(50)}

Subtotal: ₹${data.subtotal.toFixed(2)}
GST (${data.gstPercentage}%): ₹${data.gstAmount.toFixed(2)}
${'='.repeat(50)}
TOTAL: ₹${data.totalAmount.toFixed(2)}
${'='.repeat(50)}

Payment Method: ${data.paymentMethod}

Thank you for dining with us!
Visit again soon.
    `;

    const blob = new Blob([billText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bill.bill_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading bill...</div>;
  }

  if (showFeedback) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">How was your experience?</h2>
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your feedback (optional)"
            className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-24 resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <button
            onClick={submitFeedback}
            disabled={rating === 0}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
          >
            Submit Feedback
          </button>
          <button
            onClick={onPaymentComplete}
            className="w-full mt-2 text-gray-600 hover:text-gray-800 py-2"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  if (!bill || !settings) {
    return <div className="flex items-center justify-center min-h-screen">No bill available</div>;
  }

  const isPaid = bill.payment_status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-32">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{settings.name}</h2>
          <p className="text-center text-gray-600 text-sm mb-6">{settings.address}</p>

          <div className="border-t border-b border-gray-200 py-4 mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Bill No:</span>
              <span className="font-semibold">{bill.bill_number}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Customer:</span>
              <span className="font-semibold">{bill.customer_name}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Mobile:</span>
              <span className="font-semibold">{bill.customer_mobile}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Table:</span>
              <span className="font-semibold">{table.table_number}</span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {bill.bill_data?.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-semibold">₹{item.subtotal}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">₹{bill.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST ({settings.gst_percentage}%)</span>
              <span className="font-semibold">₹{bill.gst_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span>Total</span>
              <span>₹{bill.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {isPaid && (
            <button
              onClick={downloadBill}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              <Download className="w-5 h-5" />
              Download Bill
            </button>
          )}
        </div>

        {!isPaid && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Select Payment Method</h3>
            <button
              onClick={() => makePayment('online')}
              disabled={paying}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition transform hover:scale-105 disabled:transform-none disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              Pay Online (UPI / Card / Net Banking)
            </button>
            <button
              onClick={() => makePayment('cash')}
              disabled={paying}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition transform hover:scale-105 disabled:transform-none disabled:opacity-50"
            >
              <Banknote className="w-5 h-5" />
              Pay with Cash
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
