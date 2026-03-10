import { useState, useEffect } from 'react';
import { useCustomer } from '../../contexts/CustomerContext';
import { supabase } from '../../lib/supabase';
import type { Table, CartItem, MenuItem } from '../../lib/types';
import { CustomerLogin } from './CustomerLogin';
import { TableBooking } from './TableBooking';
import { MenuBrowser } from './MenuBrowser';
import { Cart } from './Cart';
import { OrderTracking } from './OrderTracking';
import { BillingPayment } from './BillingPayment';
import { LogOut, ShoppingCart, ClipboardList } from 'lucide-react';

type CustomerView = 'booking' | 'menu' | 'cart' | 'orders' | 'billing';

export function CustomerPortal() {
  const { customer, loading, logout } = useCustomer();
  const [currentView, setCurrentView] = useState<CustomerView>('booking');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTable, setCurrentTable] = useState<Table | null>(null);

  useEffect(() => {
    if (customer?.current_table_id) {
      loadCurrentTable();
    }
  }, [customer]);

  useEffect(() => {
    if (!currentTable && currentView !== 'booking') {
      setCurrentView('booking');
    }
  }, [currentTable, currentView]);

  const loadCurrentTable = async () => {
    if (!customer?.current_table_id) return;

    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('id', customer.current_table_id)
      .maybeSingle();

    if (data) {
      setCurrentTable(data);
      setCurrentView('menu');
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map(ci =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.menuItem.id === item.id);
      if (existing && existing.quantity > 1) {
        return prev.map(ci =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity - 1 }
            : ci
        );
      }
      return prev.filter(ci => ci.menuItem.id !== item.id);
    });
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      setCart([]);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      setCart([]);
      setCurrentTable(null);
      setCurrentView('booking');
    }
  };

  const handlePaymentComplete = () => {
    setCart([]);
    setCurrentTable(null);
    logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!customer) {
    return <CustomerLogin />;
  }



  return (
    <div className="min-h-screen bg-gray-50">
      {currentView !== 'booking' && currentTable && (
        <div className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-800">{customer.name}</h2>
              <p className="text-sm text-gray-600">Table {currentTable.table_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('menu')}
                className={`p-2 rounded-lg transition ${currentView === 'menu' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentView('orders')}
                className={`p-2 rounded-lg transition ${currentView === 'orders' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ClipboardList className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'booking' && (
        <TableBooking onTableBooked={() => setCurrentView('menu')} />
      )}

      {currentView === 'menu' && currentTable && (
        <MenuBrowser
          cart={cart}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onViewCart={() => setCurrentView('cart')}
        />
      )}

      {currentView === 'cart' && currentTable && (
        <Cart
          cart={cart}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onBack={() => setCurrentView('menu')}
          onOrderPlaced={() => setCurrentView('orders')}
          table={currentTable}
        />
      )}

      {currentView === 'orders' && currentTable && (
        <OrderTracking
          onRequestBill={() => setCurrentView('billing')}
          table={currentTable}
        />
      )}

      {currentView === 'billing' && currentTable && (
        <BillingPayment
          table={currentTable}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
