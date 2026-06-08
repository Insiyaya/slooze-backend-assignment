'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ROLE_COLORS: Record<string, string> = {
  ADMIN:   'bg-purple-600',
  MANAGER: 'bg-blue-600',
  MEMBER:  'bg-green-600',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="text-white font-bold text-lg tracking-tight">🍽 Slooze</span>
        <Link href="/dashboard" className="text-gray-300 hover:text-white text-sm">
          Restaurants
        </Link>
        <Link href="/dashboard/orders" className="text-gray-300 hover:text-white text-sm">
          My Orders
        </Link>
        <Link href="/dashboard/payment" className="text-gray-300 hover:text-white text-sm">
          Payment Methods
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">{user.name}</span>
        <span className={`${ROLE_COLORS[user.role]} text-white text-xs font-semibold px-2 py-0.5 rounded`}>
          {user.role}
        </span>
        {user.country && (
          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
            {user.country}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-red-400 text-sm ml-2"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
