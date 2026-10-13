import Constants from 'expo-constants';

/** The version in app.json, so the screens never show a made-up number. */
export const APP_VERSION: string = Constants.expoConfig?.version ?? '';
