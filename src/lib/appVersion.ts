import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

/** The version in app.json, so the screens never show a made-up number. */
export const APP_VERSION: string = Constants.expoConfig?.version ?? '';

/**
 * Which over-the-air update is running, e.g. "1a2b3c4d · preview", so a tester can say exactly what they are looking at.
 * Empty in development and when the phone still runs the code that came inside the APK.
 */
export const APP_UPDATE_LABEL: string =
  Updates.isEnabled && Updates.updateId && !Updates.isEmbeddedLaunch ? `${Updates.updateId.slice(0, 8)} · ${Updates.channel ?? ''}` : '';
