import { useChef } from '../../contexts/ChefContext';
import { ChefLogin } from './ChefLogin';
import { ChefOrderQueue } from './ChefOrderQueue';
import { LogOut, ChefHat } from 'lucide-react';

export function ChefPortal() {
  const { chef, loading, logout } = useChef();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!chef) {
    return <ChefLogin />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Chef Portal</h1>
              <p className="text-sm text-gray-600">Welcome, {chef.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      <ChefOrderQueue />
    </div>
  );
}
