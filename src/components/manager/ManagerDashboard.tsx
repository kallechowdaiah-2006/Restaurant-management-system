import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, CheckCircle, XCircle, DollarSign, Star, AlertCircle } from 'lucide-react';

interface Stats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  dailyRevenue: number;
  averageRating: number;
  pendingApprovals: number;
}

export function ManagerDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    dailyRevenue: 0,
    averageRating: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [ordersResult, billsResult, feedbackResult, pendingResult] = await Promise.all([
        supabase.from('orders').select('status').gte('created_at', today.toISOString()),
        supabase
          .from('bills')
          .select('total_amount')
          .eq('payment_status', 'completed')
          .gte('created_at', today.toISOString()),
        supabase.from('feedback').select('rating'),
        supabase.from('orders').select('id').eq('status', 'pending_manager')
      ]);

      const orders = ordersResult.data || [];
      const bills = billsResult.data || [];
      const feedback = feedbackResult.data || [];
      const pending = pendingResult.data || [];

      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === 'served').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      const dailyRevenue = bills.reduce((sum, b) => sum + b.total_amount, 0);
      const averageRating = feedback.length > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        : 0;
      const pendingApprovals = pending.length;

      setStats({
        totalOrders,
        completedOrders,
        cancelledOrders,
        dailyRevenue,
        averageRating,
        pendingApprovals
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Orders Today',
      value: stats.totalOrders,
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      label: 'Completed Orders',
      value: stats.completedOrders,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100'
    },
    {
      label: 'Cancelled Orders',
      value: stats.cancelledOrders,
      icon: XCircle,
      color: 'text-red-600 bg-red-100'
    },
    {
      label: 'Daily Revenue',
      value: `₹${stats.dailyRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600 bg-green-100'
    },
    {
      label: 'Average Rating',
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A',
      icon: Star,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: AlertCircle,
      color: 'text-orange-600 bg-orange-100'
    }
  ];

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading statistics...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
