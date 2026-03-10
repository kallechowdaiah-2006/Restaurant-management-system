import { useState } from 'react';
import { CustomerProvider } from './contexts/CustomerContext';
import { ManagerProvider } from './contexts/ManagerContext';
import { ChefProvider } from './contexts/ChefContext';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { ManagerPortal } from './components/manager/ManagerPortal';
import { ChefPortal } from './components/chef/ChefPortal';
import { UtensilsCrossed, ShieldCheck, ChefHat } from 'lucide-react';

function App() {
  const [portal, setPortal] = useState<'select' | 'customer' | 'manager' | 'chef'>('select');

  if (portal === 'customer') {
    return (
      <CustomerProvider>
        <CustomerPortal />
      </CustomerProvider>
    );
  }

  if (portal === 'manager') {
    return (
      <ManagerProvider>
        <ManagerPortal />
      </ManagerProvider>
    );
  }

  if (portal === 'chef') {
    return (
      <ChefProvider>
        <ChefPortal />
      </ChefProvider>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Restaurant Management System</h1>
          <p className="text-xl text-gray-600">Select your portal to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PortalCard
            icon={UtensilsCrossed}
            title="Customer Portal"
            description="Book tables, order food, track orders and pay"
            onClick={() => setPortal('customer')}
            color="from-orange-500 to-red-600"
          />
          <PortalCard
            icon={ShieldCheck}
            title="Manager Portal"
            description="Manage orders, menu, tables and view analytics"
            onClick={() => setPortal('manager')}
            color="from-blue-500 to-blue-600"
          />
          <PortalCard
            icon={ChefHat}
            title="Chef Portal"
            description="View approved orders and manage kitchen"
            onClick={() => setPortal('chef')}
            color="from-purple-500 to-pink-600"
          />
        </div>
      </div>
    </div>
  );
}

interface PortalCardProps {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}

function PortalCard({ icon: Icon, title, description, onClick, color }: PortalCardProps) {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition transform hover:scale-105 p-8 text-left"
    >
      <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${color} rounded-full mb-4 group-hover:scale-110 transition`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </button>
  );
}

export default App;
