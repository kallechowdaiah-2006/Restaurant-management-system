import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem } from '../../lib/types';
import { CheckCircle, Clock } from 'lucide-react';

export function ChefOrderQueue() {
  const [orders, setOrders] = useState<(Order & { items: OrderItem[]; table_number?: number; customer_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [cookingTime, setCookingTime] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOrders();
    const cleanup = subscribeToOrders();
    return cleanup;
  }, []);

  const loadOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables!orders_table_id_fkey(table_number),
          customers!orders_customer_id_fkey(name)
        `)
        .in('status', ['approved', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order: any) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          return {
            ...order,
            items: items || [],
            table_number: order.tables?.table_number,
            customer_name: order.customers?.name
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('chef_orders')
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

  const startCooking = async (orderId: string) => {
    const time = cookingTime[orderId] || '20';

    try {
      await supabase
        .from('orders')
        .update({
          status: 'preparing',
          estimated_time: parseInt(time),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      setCookingTime(prev => ({ ...prev, [orderId]: '' }));
      await loadOrders();
    } catch (error) {
      console.error('Error starting cooking:', error);
    }
  };

  const markReady = async (orderId: string) => {
    try {
      await supabase
        .from('orders')
        .update({
          status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      await loadOrders();
    } catch (error) {
      console.error('Error marking order ready:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading orders...</div>;
  }

  const approvedOrders = orders.filter(o => o.status === 'approved');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Kitchen Order Queue</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OrderColumn
          title="Approved Orders"
          orders={approvedOrders}
          onStartCooking={startCooking}
          cookingTime={cookingTime}
          setCookingTime={setCookingTime}
          bgColor="bg-blue-50"
          borderColor="border-blue-300"
        />
        <OrderColumn
          title="Preparing"
          orders={preparingOrders}
          onMarkReady={markReady}
          bgColor="bg-yellow-50"
          borderColor="border-yellow-300"
        />
        <OrderColumn
          title="Ready for Pickup"
          orders={readyOrders}
          bgColor="bg-green-50"
          borderColor="border-green-300"
        />
      </div>
    </div>
  );
}

interface OrderColumnProps {
  title: string;
  orders: (Order & { items: OrderItem[]; table_number?: number; customer_name?: string })[];
  onStartCooking?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  cookingTime?: Record<string, string>;
  setCookingTime?: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  bgColor: string;
  borderColor: string;
}

function OrderColumn({
  title,
  orders,
  onStartCooking,
  onMarkReady,
  cookingTime = {},
  setCookingTime,
  bgColor,
  borderColor
}: OrderColumnProps) {
  return (
    <div className={`${bgColor} border-2 ${borderColor} rounded-xl p-4`}>
      <h3 className="font-bold text-lg mb-4">{title} ({orders.length})</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders</p>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-gray-300">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-lg">{order.order_number}</h4>
                <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Table {order.table_number}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map(item => (
                  <div key={item.id} className="text-sm">
                    <span className="font-semibold">{item.quantity}x</span> {item.item_name}
                  </div>
                ))}
              </div>

              {order.status === 'approved' && onStartCooking && setCookingTime && (
                <div className="space-y-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={cookingTime[order.id] || '20'}
                    onChange={(e) => setCookingTime(prev => ({ ...prev, [order.id]: e.target.value }))}
                    placeholder="Minutes"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={() => onStartCooking(order.id)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Start Cooking
                  </button>
                </div>
              )}

              {order.status === 'preparing' && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Est. time: {order.estimated_time} min
                  </p>
                  <button
                    onClick={() => onMarkReady?.(order.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Ready
                  </button>
                </div>
              )}

              {order.status === 'ready' && (
                <div className="bg-green-100 border border-green-300 rounded p-2 text-center">
                  <p className="text-green-800 font-semibold">Ready for Pickup</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
