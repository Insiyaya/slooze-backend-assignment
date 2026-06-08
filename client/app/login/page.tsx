'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getClient } from '@/lib/apollo-client';
import { LOGIN } from '@/lib/graphql';

const DEMO_USERS = [
  { name: 'Nick Fury',       email: 'nick@slooze.com',    role: 'Admin',   country: '—' },
  { name: 'Captain Marvel',  email: 'marvel@slooze.com',  role: 'Manager', country: 'India' },
  { name: 'Captain America', email: 'america@slooze.com', role: 'Manager', country: 'America' },
  { name: 'Thanos',          email: 'thanos@slooze.com',  role: 'Member',  country: 'India' },
  { name: 'Thor',            email: 'thor@slooze.com',    role: 'Member',  country: 'India' },
  { name: 'Travis',          email: 'travis@slooze.com',  role: 'Member',  country: 'America' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data: any = await getClient().request(LOGIN, { email, password });
      const { accessToken, id, name, role, country } = data.login;
      login({ id, name, email, role, country, token: accessToken });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.errors?.[0]?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">🍽 Slooze</h1>
            <p className="text-gray-400 text-sm">Food ordering — role-based access</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                placeholder="you@slooze.com" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                placeholder="••••••••" />
            </div>
            {error && <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Demo Users</h2>
          <div className="space-y-2">
            {DEMO_USERS.map(u => (
              <button key={u.email} onClick={() => { setEmail(u.email); setPassword('Password@123'); }}
                className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-600 rounded-lg px-4 py-3 transition-all">
                <div className="text-left">
                  <p className="text-white text-sm font-medium">{u.name}</p>
                  <p className="text-gray-500 text-xs">{u.email}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    u.role === 'Admin' ? 'bg-purple-900 text-purple-300' :
                    u.role === 'Manager' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'
                  }`}>{u.role}</span>
                  <span className="text-xs text-gray-500">{u.country}</span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-4">Click a user to auto-fill, then Sign in</p>
        </div>
      </div>
    </div>
  );
}
