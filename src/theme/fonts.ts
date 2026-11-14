import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import {
  NotoSansGujarati_400Regular,
  NotoSansGujarati_500Medium,
  NotoSansGujarati_600SemiBold,
  NotoSansGujarati_700Bold,
} from '@expo-google-fonts/noto-sans-gujarati';

// Gujarati uses one file per weight: Android ignores fontWeight on a single variable font, which made every weight look the same.
export const fontAssets = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  NotoSansGujarati_400Regular,
  NotoSansGujarati_500Medium,
  NotoSansGujarati_600SemiBold,
  NotoSansGujarati_700Bold,
  // Headlines only (display, h1, h2) in English. Two weights, to keep the app small.
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
};

export function useAppFonts() {
  return useFonts(fontAssets);
}

export type AppLocale = 'en' | 'gu';
export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

/** The headline face for English titles. Gujarati titles keep Noto Sans Gujarati, which has the Gujarati letters. */
export function displayFontFamily(weight: FontWeightName = 'semibold') {
  return weight === 'bold' || weight === 'extrabold' ? 'BricolageGrotesque_700Bold' : 'BricolageGrotesque_600SemiBold';
}

export function fontFamilyForLocale(locale: AppLocale, weight: FontWeightName = 'regular') {
  if (locale === 'gu') {
    if (weight === 'bold' || weight === 'extrabold') return 'NotoSansGujarati_700Bold';
    if (weight === 'semibold') return 'NotoSansGujarati_600SemiBold';
    if (weight === 'medium') return 'NotoSansGujarati_500Medium';
    return 'NotoSansGujarati_400Regular';
  }
  if (weight === 'extrabold') return 'PlusJakartaSans_800ExtraBold';
  if (weight === 'bold') return 'PlusJakartaSans_700Bold';
  if (weight === 'semibold') return 'PlusJakartaSans_600SemiBold';
  if (weight === 'medium') return 'PlusJakartaSans_500Medium';
  return 'PlusJakartaSans_400Regular';
}
