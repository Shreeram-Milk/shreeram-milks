import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

export const fontAssets = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  NotoSansGujarati: require('../../assets/fonts/NotoSansGujarati-VariableFont_wdth,wght.ttf'),
};

export function useAppFonts() {
  return useFonts(fontAssets);
}

export type AppLocale = 'en' | 'gu';
export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

export function fontFamilyForLocale(locale: AppLocale, weight: FontWeightName = 'regular') {
  if (locale === 'gu') return 'NotoSansGujarati';
  if (weight === 'extrabold') return 'PlusJakartaSans_800ExtraBold';
  if (weight === 'bold') return 'PlusJakartaSans_700Bold';
  if (weight === 'semibold') return 'PlusJakartaSans_600SemiBold';
  if (weight === 'medium') return 'PlusJakartaSans_500Medium';
  return 'PlusJakartaSans_400Regular';
}
