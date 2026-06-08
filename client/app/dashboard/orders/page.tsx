'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { getClient } from '@/lib/apollo-client';
import { GET_MY_ORDERS, GET_PAYMENT_METHODS, PLACE_ORDER, CANCEL_ORDER } from '@/lib/graphql';

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'bg-yellow-900 text-yellow-300',
  PLACED:    'bg-blue-900 text-blue-300',
  CANCELLED: 'bg-red-900 text-red-400',
  DELIVERED: 'bg-green-900 text-green-300',
};

export default function OrdersPage() {
  const { user, can } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [selectedPm, setSelectedPm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const notify = (msg: string, isErr = false) => {
    isErr ? setError(msg) : setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [o, p]: any = await Promise.all([
        getClient().request(GET_MY_ORDERS),
        getClient().request(GET_PAYMENT_METHODS),
      ]);
      setOrders(o.myOrders);
      setPaymentMethods(p.myPaymentMethods);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePlace = async (orderId: string) => {
    if (!selectedPm) { notify('Select a payment method', true); return; }
    try {
      await getClient().request(PLACE_ORDER, { orderId, paymentMethodId: selectedPm });
      notify('Order placed!'); setPlacingId(null); fetchData();
    } catch (e: any) { notify(e?.response?.errors?.[0]?.message || 'Failed', true); }
  };

  const handleCancel = async (orderId: string) => {
    try {
      await getClient().request(CANCEL_ORDER, { orderId });
      notify('Order cancelled'); fetchData();
    } catch (e: any) { notify(e?.response?.errors?.[0]?.message || 'Failed', true); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-white mb-2">My Orders</h1>

        {user?.role === 'MEMBER' && (
          <div className="bg-yellow-950 border border-yellow-800 rounded-lg px-4 py-3 mb-6 text-yellow-300 text-sm">
            ⚠️ Members can create orders but <strong>cannot place or cancel</strong> them — contact a Manager or Admin to checkout.
          </div>
        )}

        {success && <div className="bg-green-950 border border-green-800 rounded-lg px-4 py-3 mb-4 text-green-300 text-sm">{success}</div>}
        {error   && <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 mb-4 text-red-300 text-sm">{error}</div>}

        {loading && <p className="text-gray-400">Loading...</p>}
        {!loading && orders.length === 0 && <p className="text-gray-500">No orders yet. Go to Restaurants to create one.</p>}

        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-medium font-mono text-sm">#{order.id.slice(0, 8)}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[order.status]}`}>{order.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-green-400 font-semibold">${order.totalAmount}</p>
                <p className="text-gray-400 text-sm">{order.items.length} item(s)</p>
              </div>

              {can('placeOrder') && order.status === 'PENDING' && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  {placingId === order.id ? (
                    <div className="flex gap-2 items-center">
                      <select value={selectedPm} onChange={e => setSelectedPm(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                        <option value="">— Select payment method —</option>
                        {paymentMethods.map((pm: any) => (
                          <option key={pm.id} value={pm.id}>{pm.type} · {pm.provider}{pm.last4 ? ` ···${pm.last4}` : ''}</option>
                        ))}
                      </select>
                      <button onClick={() => handlePlace(order.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg">Confirm</button>
                      <button onClick={() => setPlacingId(null)} className="text-gray-500 text-sm px-2">✕</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setPlacingId(order.id); setSelectedPm(''); }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg">
                        Checkout & Pay
                      </button>
                      <button onClick={() => handleCancel(order.id)}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {can('cancelOrder') && order.status === 'PLACED' && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <button onClick={() => handleCancel(order.id)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg">
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
