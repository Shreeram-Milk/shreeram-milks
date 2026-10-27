const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';

// A store build must never fall back to the bundled sample products or talk to a laptop over plain http.
// Failing at start-up turns a wrong build setting into an obvious crash in testing instead of fake data for customers.
if (!__DEV__ && !apiUrl.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL must be an https:// address in a release build.');
}

/** The Google web client id of the app (a public identifier, not a secret). Without it, "Continue with Google" is not offered. */
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const appConfig = { apiUrl, googleWebClientId } as const;
