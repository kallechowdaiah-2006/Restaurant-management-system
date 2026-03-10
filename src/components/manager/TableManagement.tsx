import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Table } from '../../lib/types';
import { Plus, Trash2, Unlock } from 'lucide-react';

export function TableManagement() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTableNumber, setNewTableNumber] = useState('');

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

  const addTable = async () => {
    if (!newTableNumber) return;

    try {
      const { error } = await supabase.from('tables').insert({
        table_number: parseInt(newTableNumber),
        status: 'available'
      });

      if (error) throw error;

      setNewTableNumber('');
      await loadTables();
    } catch (error) {
      console.error('Error adding table:', error);
      alert('Failed to add table. Table number may already exist.');
    }
  };

  const deleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;
      await loadTables();
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  };

  const unlockTable = async (tableId: string) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({
          status: 'available',
          occupied_by: null
        })
        .eq('id', tableId);

      if (error) throw error;

      const table = tables.find(t => t.id === tableId);
      if (table?.occupied_by) {
        await supabase
          .from('customers')
          .update({ current_table_id: null })
          .eq('id', table.occupied_by);
      }

      await loadTables();
    } catch (error) {
      console.error('Error unlocking table:', error);
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'occupied':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading tables...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Table Management</h2>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="font-bold text-lg mb-4">Add New Table</h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            placeholder="Table number"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTable}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map(table => (
          <div key={table.id} className={`bg-white rounded-xl shadow-md p-4 border-2 ${getStatusColor(table.status)}`}>
            <div className="mb-4">
              <h3 className="font-bold text-2xl">Table {table.table_number}</h3>
              <p className="text-sm font-medium capitalize">{table.status}</p>
            </div>
            <div className="flex gap-2">
              {table.status !== 'available' && (
                <button
                  onClick={() => unlockTable(table.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm"
                >
                  <Unlock className="w-4 h-4" />
                  Unlock
                </button>
              )}
              <button
                onClick={() => deleteTable(table.id)}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
