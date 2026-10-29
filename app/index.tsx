import { Redirect } from 'expo-router';

import { useAppStore } from '../src/store/useAppStore';
import { useSessionStore } from '../src/store/useSessionStore';

/**
 * Signed-in customers skip onboarding and sign-in; they go straight on (to Home once a delivery PIN is chosen). A fresh install
 * first asks for the language, before any other words are shown. Customers already signed in are never interrupted by it.
 */
export default function AppIndex() {
  const signedIn = useSessionStore((state) => state.status === 'signedIn');
  const hasPin = useAppStore((state) => state.deliveryPin.length > 0);
  const languageChosen = useAppStore((state) => state.languageChosen);
  if (signedIn) return <Redirect href={hasPin ? '/home' : '/location'} />;
  return <Redirect href={languageChosen ? '/onboarding' : '/choose-language'} />;
}
