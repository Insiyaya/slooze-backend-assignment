import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@apollo/client', 'ts-invariant'],
};

export default nextConfig;
