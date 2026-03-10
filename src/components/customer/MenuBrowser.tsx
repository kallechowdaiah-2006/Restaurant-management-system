import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { MenuItem, MenuCategory, CartItem } from '../../lib/types';
import { Plus, Minus, ShoppingCart } from 'lucide-react';

interface MenuBrowserProps {
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (item: MenuItem) => void;
  onViewCart: () => void;
}

export function MenuBrowser({ cart, onAddToCart, onRemoveFromCart, onViewCart }: MenuBrowserProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const [categoriesResult, itemsResult] = await Promise.all([
        supabase.from('menu_categories').select('*').order('display_order'),
        supabase.from('menu_items').select('*').eq('is_available', true)
      ]);

      if (categoriesResult.data) setCategories(categoriesResult.data);
      if (itemsResult.data) setItems(itemsResult.data);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.find(ci => ci.menuItem.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const filteredItems = selectedCategory
    ? items.filter(item => item.category_id === selectedCategory)
    : items;

  const cartTotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading menu...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Menu</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition ${
                selectedCategory === null
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition ${
                  selectedCategory === category.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const quantity = getCartQuantity(item.id);
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-orange-600">₹{item.price}</span>
                    {quantity === 0 ? (
                      <button
                        onClick={() => onAddToCart(item)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition"
                      >
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-orange-100 rounded-lg px-2 py-1">
                        <button
                          onClick={() => onRemoveFromCart(item)}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-full hover:bg-gray-100 transition"
                        >
                          <Minus className="w-4 h-4 text-orange-600" />
                        </button>
                        <span className="font-bold text-orange-600 w-8 text-center">{quantity}</span>
                        <button
                          onClick={() => onAddToCart(item)}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-full hover:bg-gray-100 transition"
                        >
                          <Plus className="w-4 h-4 text-orange-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <button
              onClick={onViewCart}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold flex items-center justify-between transition"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span>{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</span>
              </div>
              <span>View Cart • ₹{cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
