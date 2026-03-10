import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Table } from '../../lib/types';
import { useCustomer } from '../../contexts/CustomerContext';
import { Armchair, CheckCircle } from 'lucide-react';

interface TableBookingProps {
  onTableBooked: () => void;
}

export function TableBooking({ onTableBooked }: TableBookingProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const { customer, refreshCustomer } = useCustomer();

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const bookTable = async (tableId: string) => {
    if (!customer) return;

    try {
      await supabase
        .from('tables')
        .update({
          status: 'occupied',
          occupied_by: customer.id
        })
        .eq('id', tableId);

      await supabase
        .from('customers')
        .update({ current_table_id: tableId })
        .eq('id', customer.id);

      await refreshCustomer();
      onTableBooked();
    } catch (error) {
      console.error('Error booking table:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading tables...</div>
      </div>
    );
  }

  const availableTables = tables.filter(t => t.status === 'available');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Your Table</h2>
          <p className="text-gray-600">Choose an available table to continue</p>
        </div>

        {availableTables.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 font-medium">No tables available at the moment</p>
            <p className="text-yellow-600 text-sm mt-2">Please wait for a table to become free</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tables.map((table) => {
              const isAvailable = table.status === 'available';
              const isSelected = selectedTable === table.id;

              return (
                <button
                  key={table.id}
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedTable(table.id);
                      bookTable(table.id);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`
                    relative p-6 rounded-xl border-2 transition transform hover:scale-105
                    ${isAvailable
                      ? 'bg-white border-green-300 hover:border-green-500 cursor-pointer'
                      : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                    }
                    ${isSelected ? 'border-green-500 bg-green-50' : ''}
                  `}
                >
                  <div className="flex flex-col items-center">
                    <Armchair className={`w-8 h-8 mb-2 ${isAvailable ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="font-bold text-lg text-gray-800">Table {table.table_number}</span>
                    <span className={`text-xs mt-1 font-medium ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                      {isAvailable ? 'Available' : 'Occupied'}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
