import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem } from '../../lib/types';
import { CheckCircle, XCircle, Clock, ChefHat, UtensilsCrossed } from 'lucide-react';

export function OrderManagement() {
  const [orders, setOrders] = useState<(Order & { items: OrderItem[]; table_number?: number; customer_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Order['status']>('all');

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
        .order('created_at', { ascending: false });

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
      .channel('manager_orders')
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

  const approveOrder = async (orderId: string) => {
    try {
      await supabase
        .from('orders')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      await loadOrders();
    } catch (error) {
      console.error('Error approving order:', error);
    }
  };

  const rejectOrder = async (orderId: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

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
      console.error('Error rejecting order:', error);
    }
  };

  const markServed = async (orderId: string) => {
    try {
      await supabase
        .from('orders')
        .update({
          status: 'served',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      await loadOrders();
    } catch (error) {
      console.error('Error marking order as served:', error);
    }
  };

  const getStatusInfo = (status: Order['status']) => {
    const statusMap = {
      pending_manager: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
      approved: { label: 'Approved', icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
      preparing: { label: 'Preparing', icon: ChefHat, color: 'text-purple-600 bg-purple-100' },
      ready: { label: 'Ready', icon: UtensilsCrossed, color: 'text-green-600 bg-green-100' },
      served: { label: 'Served', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
      cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-100' }
    };
    return statusMap[status];
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading orders...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending_manager', 'approved', 'preparing', 'ready', 'served', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : getStatusInfo(status as Order['status']).label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No orders found</div>
        ) : (
          filteredOrders.map(order => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{order.order_number}</h3>
                    <p className="text-sm text-gray-600">
                      Table {order.table_number} • {order.customer_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{statusInfo.label}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.quantity}x {item.item_name}</span>
                      <span className="font-semibold">₹{item.subtotal}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="font-bold text-lg">Total: ₹{order.total_amount}</span>
                  <div className="flex gap-2">
                    {order.status === 'pending_manager' && (
                      <>
                        <button
                          onClick={() => rejectOrder(order.id)}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => approveOrder(order.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                        >
                          Approve
                        </button>
                      </>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => markServed(order.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                      >
                        Mark as Served
                      </button>
                    )}
                  </div>
                </div>

                {order.cancellation_reason && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      <span className="font-semibold">Cancellation reason:</span> {order.cancellation_reason}
                    </p>
                  </div>
                )}

                {order.estimated_time && order.status === 'preparing' && (
                  <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-sm text-purple-800">
                      <span className="font-semibold">Estimated time:</span> {order.estimated_time} minutes
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
