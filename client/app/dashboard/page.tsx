'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { getClient } from '@/lib/apollo-client';
import { GET_RESTAURANTS, CREATE_ORDER } from '@/lib/graphql';

interface MenuItem { id: string; name: string; description: string; price: number; category: string; available: boolean; }
interface Restaurant { id: string; name: string; cuisine: string; address: string; country: string; rating: number; menuItems: MenuItem[]; }
interface CartItem { menuItemId: string; name: string; price: number; quantity: number; }

const FLAG: Record<string, string> = { INDIA: '🇮🇳', AMERICA: '🇺🇸' };

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (!user) router.push('/login'); }, [user, router]);

  const fetchRestaurants = useCallback(async () => {
    try {
      const data: any = await getClient().request(GET_RESTAURANTS);
      setRestaurants(data.restaurants);
    } catch { /* redirect handled by auth */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  const addToCart = (item: MenuItem) => setCart(prev => {
    const ex = prev.find(c => c.menuItemId === item.id);
    if (ex) return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
    return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
  });

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.menuItemId !== id));

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const handleCreateOrder = async () => {
    if (!selected || cart.length === 0) return;
    setOrdering(true); setError('');
    try {
      const data: any = await getClient().request(CREATE_ORDER, {
        restaurantId: selected.id,
        items: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
      });
      setSuccess(`Order #${data.createOrder.id.slice(0, 8)} created! Total: ${selected.country === 'AMERICA' ? '$' : '₹'}${data.createOrder.totalAmount}`);
      setCart([]);
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e?.response?.errors?.[0]?.message || 'Failed to create order');
    } finally { setOrdering(false); }
  };

  const grouped = selected
    ? selected.menuItems.reduce<Record<string, MenuItem[]>>((a, i) => { (a[i.category] = a[i.category] || []).push(i); return a; }, {})
    : {};

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Restaurants</h1>
          <p className="text-gray-400 text-sm mt-1">
            {user.country ? `Showing ${user.country} only · Re-BAC active` : 'Global view · Admin'}
          </p>
        </div>

        {loading ? <p className="text-gray-400">Loading...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map(r => (
              <button key={r.id} onClick={() => { setSelected(r); setCart([]); setError(''); }}
                className={`text-left bg-gray-900 border rounded-xl p-5 hover:border-indigo-500 transition-all ${selected?.id === r.id ? 'border-indigo-500' : 'border-gray-800'}`}>
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-white font-semibold">{r.name}</h2>
                  <span className="text-xl">{FLAG[r.country]}</span>
                </div>
                <p className="text-gray-400 text-sm">{r.cuisine}</p>
                <p className="text-gray-500 text-xs mt-1 truncate">{r.address}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-yellow-400 text-sm">★ {r.rating}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-400 text-xs">{r.menuItems.length} items</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-1">{selected.name}</h2>
              <p className="text-gray-400 text-sm mb-5">{selected.cuisine} · {FLAG[selected.country]} {selected.country}</p>
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} className="mb-5">
                  <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">{cat}</h3>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="text-white text-sm font-medium">{item.name}</p>
                          <p className="text-gray-500 text-xs truncate">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-green-400 text-sm font-medium">
                            {selected.country === 'AMERICA' ? '$' : '₹'}{item.price}
                          </span>
                          <button onClick={() => addToCart(item)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-fit sticky top-6">
              <h3 className="text-white font-semibold mb-4">Your Order</h3>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm">Add items from the menu</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map(item => (
                      <div key={item.menuItemId} className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm">{item.name}</p>
                          <p className="text-gray-400 text-xs">×{item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 text-sm">{selected.country === 'AMERICA' ? '$' : '₹'}{(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeFromCart(item.menuItemId)} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-700 pt-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Total</span>
                      <span className="text-white font-semibold">{selected.country === 'AMERICA' ? '$' : '₹'}{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  {success && <p className="text-green-400 text-xs bg-green-950 border border-green-800 rounded-lg px-3 py-2 mb-3">{success}</p>}
                  {error   && <p className="text-red-400 text-xs bg-red-950 border border-red-800 rounded-lg px-3 py-2 mb-3">{error}</p>}
                  <button onClick={handleCreateOrder} disabled={ordering}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
                    {ordering ? 'Creating...' : 'Create Order'}
                  </button>
                  <p className="text-gray-600 text-xs mt-2 text-center">Go to My Orders to checkout</p>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
