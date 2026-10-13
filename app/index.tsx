import { Redirect } from 'expo-router';

import { useAppStore } from '../src/store/useAppStore';
import { useSessionStore } from '../src/store/useSessionStore';

/** Signed-in customers skip onboarding and sign-in; they go straight on (to Home once a delivery PIN is chosen). */
export default function AppIndex() {
  const signedIn = useSessionStore((state) => state.status === 'signedIn');
  const hasPin = useAppStore((state) => state.deliveryPin.length > 0);
  return <Redirect href={signedIn ? (hasPin ? '/home' : '/location') : '/onboarding'} />;
}
