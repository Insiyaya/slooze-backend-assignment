import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import ApolloWrapper from '@/components/ApolloWrapper';
import { AuthProvider } from '@/context/AuthContext';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Slooze — Food Ordering',
  description: 'Role-based food ordering application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-gray-950 text-gray-100 antialiased">
        <ApolloWrapper>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
