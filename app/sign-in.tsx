import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBar, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppInput } from '../src/components/atoms/AppInput';
import { Button } from '../src/components/atoms/Button';
import { IconButton } from '../src/components/atoms/IconButton';
import { ThemedText } from '../src/components/atoms/ThemedText';
import { KeyboardAwareBottomDrawer } from '../src/components/organisms/KeyboardAwareBottomDrawer';
import { useRequestCode } from '../src/hooks/useCustomerAuth';
import { isIndianMobile, toInternationalPhone } from '../src/lib/phone';
import { describeError } from '../src/services/errorMapper';
import { useTheme } from '../src/theme';
import { BackIcon } from '../src/icons/appIcons';

export default function SignInScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const requestCode = useRequestCode();
  const canContinue = isIndianMobile(phone);
  const send = () => requestCode.mutate(toInternationalPhone(phone), { onSuccess: () => router.push({ pathname: '/verify', params: { phone } }) });
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
    <StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingTop: theme.spacing.lg, paddingBottom: 88 }}
        keyboardShouldPersistTaps="handled"
        mode="layout"
      >
      <IconButton icon={BackIcon} label={t('commonActions.back')} onPress={() => router.back()} />
      <View style={{ flex: 1, paddingTop: theme.spacing.xl, gap: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.sm }}><ThemedText variant="caption" style={{ color: theme.colors.colorPrimary }}>{t('signIn.eyebrow')}</ThemedText><ThemedText variant="h1">{t('signIn.title')}</ThemedText><ThemedText variant="body" style={{ color: theme.colors.colorTextSecondary }}>{t('signIn.description')}</ThemedText></View>
        <View style={{ gap: theme.spacing.sm }}><ThemedText variant="bodySmall">{t('signIn.phone')}</ThemedText><View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurface }}><ThemedText style={{ paddingLeft: theme.spacing.md, paddingRight: theme.spacing.sm }}>🇮🇳 +91</ThemedText><AppInput accessibilityLabel={t('signIn.phone')} keyboardType="phone-pad" maxLength={10} onChangeText={(value) => { setPhone(value.replace(/\D/g, '')); if (requestCode.isError) requestCode.reset(); }} placeholder={t('signIn.phonePlaceholder')} style={{ flex: 1, borderWidth: 0 }} value={phone} /></View>{phone.length === 10 && !canContinue ? <ThemedText variant="caption" style={{ color: theme.colors.colorDanger }}>{t('signIn.invalidPhone')}</ThemedText> : null}{requestCode.error ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>{describeError(requestCode.error)}</ThemedText> : null}</View>
      </View>
      </KeyboardAwareScrollView>
      <KeyboardAwareBottomDrawer openedOffset={theme.spacing.md} style={{ position: 'absolute', right: theme.spacing.lg, bottom: theme.spacing.md, left: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.sm, backgroundColor: theme.colors.colorBackground }}><Button disabled={!canContinue} loading={requestCode.isPending} onPress={send}>{t('signIn.continue')}</Button></KeyboardAwareBottomDrawer>
    </View>
  </SafeAreaView>;
}
