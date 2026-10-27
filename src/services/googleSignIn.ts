import { Platform } from 'react-native';

import { appConfig } from '../config/appConfig';
import { ApiRequestError } from './apiClient';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let cached: GoogleSigninModule | null | undefined;
let configured = false;

/**
 * The Google sign-in library is part of the phone app itself. A build made before it was added does not have it, and loading it
 * there fails. This loads it once and returns null when it is not there, so "Continue with Google" is simply not offered instead of
 * crashing the app (an over-the-air update can reach such a build).
 */
function loadGoogle(): GoogleSigninModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
  } catch {
    cached = null;
  }
  return cached;
}

/** Whether "Continue with Google" can be offered: Android only, with the app's Google client id set and the library in this build. */
export function googleSignInAvailable(): boolean {
  return Platform.OS === 'android' && appConfig.googleWebClientId !== '' && loadGoogle() !== null;
}

/**
 * Opens Google's account chooser and returns the ID token the server then checks. Null when the customer closes the chooser.
 * Anything else that goes wrong is one plain error; the reason stays out of the screen.
 */
export async function getGoogleIdToken(): Promise<string | null> {
  const google = loadGoogle();
  if (!google || !googleSignInAvailable()) throw new ApiRequestError('GOOGLE_SIGN_IN_UNAVAILABLE', 0);
  try {
    if (!configured) {
      google.GoogleSignin.configure({ webClientId: appConfig.googleWebClientId });
      configured = true;
    }
    await google.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await google.GoogleSignin.signIn();
    if (response.type !== 'success') return null;
    const idToken = response.data.idToken;
    if (!idToken) throw new ApiRequestError('GOOGLE_SIGN_IN_FAILED', 0);
    return idToken;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
    // Closing the chooser or tapping twice is not a failure worth a message.
    if (code === google.statusCodes.SIGN_IN_CANCELLED || code === google.statusCodes.IN_PROGRESS) return null;
    throw new ApiRequestError('GOOGLE_SIGN_IN_FAILED', 0);
  }
}

/** Forgets the Google account on this phone, so the next sign-in shows the chooser again. Never throws. */
export async function forgetGoogleAccount(): Promise<void> {
  const google = loadGoogle();
  if (!google || !configured) return;
  try {
    await google.GoogleSignin.signOut();
  } catch {
    // Nothing to forget, or already forgotten.
  }
}
