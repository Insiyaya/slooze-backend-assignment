import { GraphQLClient } from 'graphql-request';

export function getClient() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return new GraphQLClient('http://localhost:3000/graphql', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}
