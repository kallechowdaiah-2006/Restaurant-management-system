import { useState } from 'react';
import { useManager } from '../../contexts/ManagerContext';
import { ManagerLogin } from './ManagerLogin';
import { ManagerDashboard } from './ManagerDashboard';
import { OrderManagement } from './OrderManagement';
import { MenuManagement } from './MenuManagement';
import { TableManagement } from './TableManagement';
import { LayoutDashboard, UtensilsCrossed, ListOrdered, Armchair, LogOut, Settings } from 'lucide-react';

type ManagerView = 'dashboard' | 'orders' | 'menu' | 'tables' | 'settings';

export function ManagerPortal() {
  const { manager, loading, logout } = useManager();
  const [currentView, setCurrentView] = useState<ManagerView>('dashboard');

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!manager) {
    return <ManagerLogin />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Manager Portal</h1>
          <p className="text-sm text-gray-600">Welcome, {manager.username}</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavButton
            icon={LayoutDashboard}
            label="Dashboard"
            active={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
          />
          <NavButton
            icon={ListOrdered}
            label="Orders"
            active={currentView === 'orders'}
            onClick={() => setCurrentView('orders')}
          />
          <NavButton
            icon={UtensilsCrossed}
            label="Menu"
            active={currentView === 'menu'}
            onClick={() => setCurrentView('menu')}
          />
          <NavButton
            icon={Armchair}
            label="Tables"
            active={currentView === 'tables'}
            onClick={() => setCurrentView('tables')}
          />
          <NavButton
            icon={Settings}
            label="Settings"
            active={currentView === 'settings'}
            onClick={() => setCurrentView('settings')}
          />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {currentView === 'dashboard' && <ManagerDashboard />}
        {currentView === 'orders' && <OrderManagement />}
        {currentView === 'menu' && <MenuManagement />}
        {currentView === 'tables' && <TableManagement />}
        {currentView === 'settings' && <SettingsView />}
      </div>
    </div>
  );
}

interface NavButtonProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavButton({ icon: Icon, label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function SettingsView() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Settings</h2>
        <p className="text-gray-600">Settings management coming soon</p>
      </div>
    </div>
  );
}
