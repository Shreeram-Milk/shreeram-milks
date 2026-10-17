import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
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
};

export function useAppFonts() {
  return useFonts(fontAssets);
}

export type AppLocale = 'en' | 'gu';
export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

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
