import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StatusBar, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/atoms/Button';
import { IconButton } from '../src/components/atoms/IconButton';
import { ThemedText } from '../src/components/atoms/ThemedText';
import { KeyboardAwareBottomDrawer } from '../src/components/organisms/KeyboardAwareBottomDrawer';
import { useRequestCode, useVerifyCode } from '../src/hooks/useCustomerAuth';
import { formatPhone, isIndianMobile, toInternationalPhone } from '../src/lib/phone';
import { describeError } from '../src/services/errorMapper';
import { useTheme } from '../src/theme';
import { BackIcon } from '../src/icons/appIcons';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { phone: typedPhone } = useLocalSearchParams<{ phone?: string }>();
  const digits = typeof typedPhone === 'string' ? typedPhone : '';
  const phone = toInternationalPhone(digits);
  const inputRef = useRef<TextInput>(null);
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resent, setResent] = useState(false);
  const verify = useVerifyCode();
  const resend = useRequestCode();
  const canContinue = otp.length === CODE_LENGTH;

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // Opened without a number (a deep link or a restored screen): there is nothing to verify, so start again.
  useEffect(() => {
    if (!isIndianMobile(digits)) router.replace('/sign-in');
  }, [digits]);

  const submit = () => verify.mutate({ phone, code: otp }, { onSuccess: ({ customer }) => router.replace(customer.needsProfile ? { pathname: '/edit-profile', params: { first: '1' } } : '/location') });
  const sendAgain = () => resend.mutate(phone, { onSuccess: () => { setSecondsLeft(RESEND_SECONDS); setResent(true); setOtp(''); verify.reset(); } });
  const error = verify.error ?? resend.error;

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
    <StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, padding: theme.spacing.lg }}>
      <IconButton icon={BackIcon} label={t('commonActions.back')} onPress={() => router.back()} />
      <View style={{ flex: 1, paddingTop: theme.spacing.xl, gap: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.sm }}><ThemedText variant="h1">{t('verify.title')}</ThemedText><ThemedText variant="body" style={{ color: theme.colors.colorTextSecondary }}>{t('verify.description', { phone: formatPhone(phone) })}</ThemedText></View>
        <View style={{ gap: theme.spacing.sm }}>
          <ThemedText variant="bodySmall">{t('verify.code')}</ThemedText>
          <Pressable accessibilityRole="button" accessibilityLabel={t('verify.enterCode')} onPress={() => inputRef.current?.focus()}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>{Array.from({ length: CODE_LENGTH }, (_unused, index) => { const digit = otp[index]; const selected = index === otp.length && otp.length < CODE_LENGTH; return <View key={index} style={{ flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radii.lg, borderWidth: selected ? theme.borderWidths.medium : theme.borderWidths.hairline, borderColor: error ? theme.colors.colorDanger : selected ? theme.colors.colorPrimary : theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface }}>{digit ? <ThemedText variant="h2" style={{ color: theme.colors.colorTextPrimary }}>{digit}</ThemedText> : <ThemedText variant="h2" style={{ color: theme.colors.colorTextSecondary }}>•</ThemedText>}</View>; })}</View>
          </Pressable>
          <TextInput ref={inputRef} accessibilityLabel={t('verify.code')} autoComplete="sms-otp" autoFocus keyboardType="number-pad" maxLength={CODE_LENGTH} onChangeText={(value) => { setOtp(value.replace(/\D/g, '')); if (verify.isError) verify.reset(); }} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} textContentType="oneTimeCode" value={otp} />
          {error ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>{describeError(error)}</ThemedText> : resent ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorPrimary }}>{t('verify.codeSent')}</ThemedText> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: secondsLeft > 0 || resend.isPending }} disabled={secondsLeft > 0 || resend.isPending} hitSlop={theme.spacing.sm} onPress={sendAgain}>
          <ThemedText variant="bodySmall" weight="semibold" style={{ color: secondsLeft > 0 ? theme.colors.colorTextSecondary : theme.colors.colorPrimary }}>{secondsLeft > 0 ? t('verify.resendIn', { seconds: secondsLeft }) : t('verify.resend')}</ThemedText>
        </Pressable>
      </View>
      <KeyboardAwareBottomDrawer style={{ position: 'absolute', right: theme.spacing.lg, bottom: theme.spacing.md, left: theme.spacing.lg, gap: theme.spacing.md, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.sm, backgroundColor: theme.colors.colorBackground }}>
        <Button disabled={!canContinue} loading={verify.isPending} onPress={submit}>{t('verify.continue')}</Button>
      </KeyboardAwareBottomDrawer>
    </View>
  </SafeAreaView>;
}
