'use client';
// Thin wrapper kept for layout compatibility — graphql-request needs no provider
export default function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
