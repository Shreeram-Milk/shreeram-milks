import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, focusManager, type Query } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../lib/i18n';
import { APP_VERSION } from '../lib/appVersion';
import { useAppStore } from '../store/useAppStore';
import { useSessionStore } from '../store/useSessionStore';
import { ThemeProvider } from '../theme';
import { ToastProvider } from './ToastProvider';

const SAVED_FOR_MS = 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
  // Kept in memory as long as it is kept on the phone, so a saved answer is still there to show on the next start.
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, gcTime: SAVED_FOR_MS } },
});

// On a phone there is no browser window to focus, so returning to the app is the "focus" that lets a query refresh.
// Only queries that opt in (and are past their stale time) actually refetch.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
  return () => subscription.remove();
});

/**
 * Answers worth showing instantly on the next app start, then refreshing quietly. Never saved: prices and quotes, credit,
 * delivery cut-offs and PIN checks, which must always come fresh from the server.
 */
const SAVED_QUERIES = new Set(['catalog-categories', 'catalog-products', 'catalog-product', 'banners', 'app-config', 'onboarding-slides', 'help', 'policies', 'subscriptions', 'orders', 'deliveries', 'addresses']);
const shouldSave = (query: Query) => query.state.status === 'success' && SAVED_QUERIES.has(String(query.queryKey[0]));

const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'shreeram-saved-data', throttleTime: 2000 });

// A signed-out phone must not keep the previous customer's orders, addresses or cart.
useSessionStore.subscribe((state, previous) => {
  if (previous.status === 'signedIn' && state.status === 'signedOut') {
    queryClient.clear();
    useAppStore.getState().resetCheckout();
  }
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <ThemeProvider>
          <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: SAVED_FOR_MS, buster: APP_VERSION, dehydrateOptions: { shouldDehydrateQuery: shouldSave } }}>
            <ToastProvider>{children}</ToastProvider>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}
