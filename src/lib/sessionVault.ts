import * as SecureStore from 'expo-secure-store';

import type { CustomerProfile } from '../types/customer';

const KEY = 'sr_customer_session';

export interface StoredSession {
  token: string;
  customer: CustomerProfile;
}

/**
 * Keeps the sign-in token in the phone's secure storage (Android Keystore, iPhone Keychain), not in ordinary storage.
 * The profile is kept beside it so the app can open offline. Every call is safe: a storage failure means "signed out".
 */
export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession> | null;
    return parsed && typeof parsed.token === 'string' && parsed.token && parsed.customer ? (parsed as StoredSession) : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(session));
  } catch {
    // The customer stays signed in for this run; they will be asked again next time.
  }
}

export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Nothing more to do: the in-memory session is already cleared.
  }
}
