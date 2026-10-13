import { create } from 'zustand';

import { clearSession, loadSession, saveSession } from '../lib/sessionVault';
import { ApiRequestError, configureAuth } from '../services/apiClient';
import { fetchMyProfile, signOutOnServer } from '../services/customerService';
import type { CustomerProfile } from '../types/customer';

type SessionStatus = 'restoring' | 'signedOut' | 'signedIn';

interface SessionState {
  status: SessionStatus;
  token: string | null;
  customer: CustomerProfile | null;
  /** Reads the saved session when the app opens and checks it with the server. Offline, the saved one is kept. */
  restore: () => Promise<void>;
  startSession: (token: string, customer: CustomerProfile) => void;
  setCustomer: (customer: CustomerProfile) => void;
  /** Signs out: tells the server (best effort) and always clears the phone. */
  signOut: () => Promise<void>;
  /** The phone side only: the server already ended the session (it was refused, or the account was deleted). */
  endSessionLocally: () => void;
}

const signedOut = { status: 'signedOut', token: null, customer: null } as const;

export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'restoring',
  token: null,
  customer: null,
  restore: async () => {
    const saved = await loadSession();
    if (!saved) { set(signedOut); return; }
    set({ status: 'signedIn', token: saved.token, customer: saved.customer });
    try {
      const customer = await fetchMyProfile();
      set({ customer });
      void saveSession({ token: saved.token, customer });
    } catch (error) {
      // A refused token already signed us out through the auth hook. Any other failure (no connection) keeps the saved session.
      if (error instanceof ApiRequestError && error.code === 'UNAUTHENTICATED') get().endSessionLocally();
    }
  },
  startSession: (token, customer) => {
    set({ status: 'signedIn', token, customer });
    void saveSession({ token, customer });
  },
  setCustomer: (customer) => {
    const { token } = get();
    set({ customer });
    if (token) void saveSession({ token, customer });
  },
  signOut: async () => {
    try {
      await signOutOnServer();
    } catch {
      // The phone is signed out either way; an unreachable server drops the session when it expires.
    }
    get().endSessionLocally();
  },
  endSessionLocally: () => {
    set(signedOut);
    void clearSession();
  },
}));

configureAuth({ getToken: () => useSessionStore.getState().token, onUnauthorized: () => useSessionStore.getState().endSessionLocally() });
