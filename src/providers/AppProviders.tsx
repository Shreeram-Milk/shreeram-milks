import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../lib/i18n';
import { ThemeProvider } from '../theme';
import { ToastProvider } from './ToastProvider';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// On a phone there is no browser window to focus, so returning to the app is the "focus" that lets a query refresh.
// Only queries that opt in (and are past their stale time) actually refetch.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
  return () => subscription.remove();
});

export function AppProviders({ children }: PropsWithChildren) {
  return <KeyboardProvider><SafeAreaProvider><ThemeProvider><QueryClientProvider client={queryClient}><ToastProvider>{children}</ToastProvider></QueryClientProvider></ThemeProvider></SafeAreaProvider></KeyboardProvider>;
}
