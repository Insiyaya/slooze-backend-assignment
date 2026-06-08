'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { getClient } from '@/lib/apollo-client';
import { GET_PAYMENT_METHODS, ADD_PAYMENT_METHOD, UPDATE_PAYMENT_METHOD, DELETE_PAYMENT_METHOD } from '@/lib/graphql';

const PAYMENT_TYPES = ['CARD', 'UPI', 'NETBANKING', 'WALLET'];
const TYPE_ICON: Record<string, string> = { CARD: '💳', UPI: '📲', NETBANKING: '🏦', WALLET: '👜' };

export default function PaymentPage() {
  const { can } = useAuth();
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'CARD', provider: '', last4: '', isDefault: false });
  const [saving, setSaving] = useState(false);

  const notify = (msg: string, isErr = false) => {
    isErr ? setError(msg) : setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const fetchMethods = useCallback(async () => {
    try {
      const data: any = await getClient().request(GET_PAYMENT_METHODS);
      setMethods(data.myPaymentMethods);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMethods(); }, [fetchMethods]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await getClient().request(ADD_PAYMENT_METHOD, {
        type: form.type,
        provider: form.provider,
        last4: form.last4 || undefined,
        isDefault: form.isDefault,
      });
      notify('Payment method added');
      setShowForm(false);
      setForm({ type: 'CARD', provider: '', last4: '', isDefault: false });
      fetchMethods();
    } catch (e: any) { notify(e?.response?.errors?.[0]?.message || 'Failed', true); }
    finally { setSaving(false); }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await getClient().request(UPDATE_PAYMENT_METHOD, { id, isDefault: true });
      notify('Default updated'); fetchMethods();
    } catch (e: any) { notify(e?.response?.errors?.[0]?.message || 'Failed', true); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment method?')) return;
    try {
      await getClient().request(DELETE_PAYMENT_METHOD, { id });
      notify('Deleted'); fetchMethods();
    } catch (e: any) { notify(e?.response?.errors?.[0]?.message || 'Failed', true); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Payment Methods</h1>
          <button onClick={() => setShowForm(v => !v)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg">
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {success && <div className="bg-green-950 border border-green-800 rounded-lg px-4 py-3 mb-4 text-green-300 text-sm">{success}</div>}
        {error   && <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 mb-4 text-red-300 text-sm">{error}</div>}

        {showForm && (
          <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-4">
            <h2 className="text-white font-semibold">New Payment Method</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Provider</label>
                <input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} required
                  placeholder="Visa, Razorpay, GPay…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600" />
              </div>
            </div>
            {form.type === 'CARD' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Last 4 digits (optional)</label>
                <input value={form.last4} onChange={e => setForm(f => ({ ...f, last4: e.target.value }))}
                  maxLength={4} placeholder="1234"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600" />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                className="accent-indigo-500" />
              <span className="text-gray-300 text-sm">Set as default</span>
            </label>
            <button type="submit" disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-6 py-2 rounded-lg">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        )}

        {loading && <p className="text-gray-400">Loading...</p>}
        {!loading && methods.length === 0 && <p className="text-gray-500">No payment methods saved.</p>}

        <div className="space-y-3">
          {methods.map(pm => (
            <div key={pm.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{TYPE_ICON[pm.type] ?? '💰'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium">{pm.provider}{pm.last4 ? ` ···${pm.last4}` : ''}</p>
                    {pm.isDefault && <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                  <p className="text-gray-500 text-xs">{pm.type}</p>
                </div>
              </div>
              {can('updatePayment') && (
                <div className="flex gap-2">
                  {!pm.isDefault && (
                    <button onClick={() => handleSetDefault(pm.id)}
                      className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg">
                      Set default
                    </button>
                  )}
                  <button onClick={() => handleDelete(pm.id)}
                    className="text-xs text-red-400 hover:text-red-300 bg-red-950 hover:bg-red-900 px-3 py-1.5 rounded-lg">
                    Delete
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
