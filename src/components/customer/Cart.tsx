import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { CartItem, Table } from '../../lib/types';
import { useCustomer } from '../../contexts/CustomerContext';
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';

interface CartProps {
  cart: CartItem[];
  onAddToCart: (item: CartItem['menuItem']) => void;
  onRemoveFromCart: (item: CartItem['menuItem']) => void;
  onClearCart: () => void;
  onBack: () => void;
  onOrderPlaced: () => void;
  table: Table;
}

export function Cart({ cart, onAddToCart, onRemoveFromCart, onClearCart, onBack, onOrderPlaced, table }: CartProps) {
  const [placing, setPlacing] = useState(false);
  const { customer } = useCustomer();

  const subtotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

  const placeOrder = async () => {
    if (!customer || cart.length === 0) return;

    setPlacing(true);
    try {
      const orderNumber = `ORD${Date.now()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customer.id,
          table_id: table.id,
          status: 'pending_manager',
          total_amount: subtotal
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        item_name: item.menuItem.name,
        item_price: item.menuItem.price,
        quantity: item.quantity,
        subtotal: item.menuItem.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      onClearCart();
      onOrderPlaced();
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add items from the menu to get started</p>
          <button
            onClick={onBack}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Menu
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
              <p className="text-gray-600">Table {table.table_number}</p>
            </div>
            <button
              onClick={onClearCart}
              className="text-red-600 hover:text-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4 mb-6">
          {cart.map(item => (
            <div key={item.menuItem.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">{item.menuItem.name}</h3>
                  <p className="text-orange-600 font-semibold">₹{item.menuItem.price}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-orange-100 rounded-lg px-2 py-1">
                  <button
                    onClick={() => onRemoveFromCart(item.menuItem)}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-full hover:bg-gray-100 transition"
                  >
                    <Minus className="w-4 h-4 text-orange-600" />
                  </button>
                  <span className="font-bold text-orange-600 w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onAddToCart(item.menuItem)}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-full hover:bg-gray-100 transition"
                  >
                    <Plus className="w-4 h-4 text-orange-600" />
                  </button>
                </div>
                <span className="text-lg font-bold text-gray-800">
                  ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between text-lg font-semibold mb-4">
            <span className="text-gray-700">Subtotal</span>
            <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            GST and other charges will be calculated at the time of billing
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={placeOrder}
            disabled={placing}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
          >
            {placing ? 'Placing Order...' : `Place Order • ₹${subtotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
