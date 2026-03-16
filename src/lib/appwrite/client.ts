import { Client, Account, Databases, ID, Query } from 'node-appwrite';

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT   || 'http://localhost:9080/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'myproject';
const API_KEY    = process.env.APPWRITE_API_KEY                || '';

/** Server-side client with full API key (for server components / API routes) */
export function getServerClient(): Client {
  const client = new Client();
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  return client;
}

/** Browser-side client (no API key – uses session cookie) */
export function getBrowserClient(): Client {
  const client = new Client();
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);
  return client;
}

export const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'archplanner';

export { ID, Query, Account, Databases };
