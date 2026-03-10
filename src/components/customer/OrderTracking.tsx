import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem, Table } from '../../lib/types';
import { useCustomer } from '../../contexts/CustomerContext';
import { Clock, ChefHat, CheckCircle, XCircle, Receipt, UtensilsCrossed } from 'lucide-react';

interface OrderTrackingProps {
  onRequestBill: () => void;
  table: Table;
}

export function OrderTracking({ onRequestBill, table }: OrderTrackingProps) {
  const [orders, setOrders] = useState<(Order & { items: OrderItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { customer } = useCustomer();

  useEffect(() => {
    if (customer && table) {
      loadOrders();
      const cleanup = subscribeToOrders();
      return cleanup;
    }
  }, [customer, table]);

  const loadOrders = async () => {
    if (!customer) return;

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('table_id', table.id)
        .in('status', ['pending_manager', 'approved', 'preparing', 'ready', 'served'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData) {
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            const { data: items } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);
            return { ...order, items: items || [] };
          })
        );
        setOrders(ordersWithItems);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('orders_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    setCancelling(orderId);
    try {
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      await loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    } finally {
      setCancelling(null);
    }
  };

  const handleCancelClick = (orderId: string) => {
    const reasons = [
      'Ordered by mistake',
      'Taking too long',
      'Changed my mind'
    ];

    const reason = prompt(`Why do you want to cancel?\n\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nEnter 1, 2, or 3:`);

    if (reason && ['1', '2', '3'].includes(reason)) {
      cancelOrder(orderId, reasons[parseInt(reason) - 1]);
    }
  };

  const getStatusInfo = (status: Order['status']) => {
    const statusMap = {
      pending_manager: {
        label: 'Pending Manager Approval',
        icon: Clock,
        color: 'text-yellow-600 bg-yellow-100',
        canCancel: true
      },
      approved: {
        label: 'Approved by Manager',
        icon: CheckCircle,
        color: 'text-blue-600 bg-blue-100',
        canCancel: true
      },
      preparing: {
        label: 'Chef is Preparing',
        icon: ChefHat,
        color: 'text-purple-600 bg-purple-100',
        canCancel: false
      },
      ready: {
        label: 'Order Ready',
        icon: UtensilsCrossed,
        color: 'text-green-600 bg-green-100',
        canCancel: false
      },
      served: {
        label: 'Served',
        icon: CheckCircle,
        color: 'text-green-600 bg-green-100',
        canCancel: false
      },
      cancelled: {
        label: 'Cancelled',
        icon: XCircle,
        color: 'text-red-600 bg-red-100',
        canCancel: false
      }
    };
    return statusMap[status];
  };

  const hasServedOrders = orders.some(o => o.status === 'served');

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h2>
          <p className="text-gray-600">Your orders will appear here once placed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h2 className="text-2xl font-bold text-gray-800">Your Orders</h2>
          <p className="text-gray-600">Table {table.table_number}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {orders.map(order => {
          const statusInfo = getStatusInfo(order.status);
          const StatusIcon = statusInfo.icon;

          return (
            <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Order {order.order_number}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{statusInfo.label}</span>
                  </div>
                </div>

                {order.estimated_time && order.status === 'preparing' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                    <p className="text-purple-800 text-sm font-medium">
                      Estimated time: {order.estimated_time} minutes
                    </p>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {item.quantity}x {item.item_name}
                      </span>
                      <span className="font-semibold text-gray-900">₹{item.subtotal}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="font-bold text-lg text-gray-900">₹{order.total_amount}</span>
                </div>

                {statusInfo.canCancel && (
                  <button
                    onClick={() => handleCancelClick(order.id)}
                    disabled={cancelling === order.id}
                    className="mt-4 w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {cancelling === order.id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasServedOrders && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={onRequestBill}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              <Receipt className="w-5 h-5" />
              Request Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
