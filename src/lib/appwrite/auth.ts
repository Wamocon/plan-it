/**
 * Appwrite auth helper – SERVER-ONLY.
 * Do NOT import this in Client Components or middleware.
 * Browser auth goes through /api/auth/session (route handler).
 */
import 'server-only';
import { Client, Account, ID } from 'node-appwrite';

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT   || 'http://localhost:9080/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'myproject';

export function getAccount(): Account {
  const client = new Client();
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);
  return new Account(client);
}

export { ID };
