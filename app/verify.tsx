import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StatusBar, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/atoms/Button';
import { IconButton } from '../src/components/atoms/IconButton';
import { ThemedText } from '../src/components/atoms/ThemedText';
import { OtpBoxes } from '../src/components/molecules/OtpBoxes';
import { KeyboardAwareBottomDrawer } from '../src/components/organisms/KeyboardAwareBottomDrawer';
import { pickDefaultAddress } from '../src/hooks/useAddresses';
import { useRequestCode, useVerifyCode } from '../src/hooks/useCustomerAuth';
import { isEmail } from '../src/lib/phone';
import { fetchAddresses } from '../src/services/addressService';
import { describeError } from '../src/services/errorMapper';
import { queryKeys } from '../src/services/queryKeys';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme';
import { BackIcon } from '../src/icons/appIcons';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { email: typedEmail } = useLocalSearchParams<{ email?: string }>();
  const email = typeof typedEmail === 'string' ? typedEmail : '';
  const inputRef = useRef<TextInput>(null);
  const [otp, setOtp] = useState('');
  const [focused, setFocused] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resent, setResent] = useState(false);
  const client = useQueryClient();
  const [routing, setRouting] = useState(false);
  const verify = useVerifyCode();
  const resend = useRequestCode();
  const canContinue = otp.length === CODE_LENGTH;

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // Opened without an email (a deep link or a restored screen): there is nothing to verify, so start again.
  useEffect(() => {
    if (!isEmail(email)) router.replace('/sign-in');
  }, [email]);

  // A customer who has already set up a delivery address does not repeat the location step: their default address becomes the delivery PIN and they go to Home.
  const continueAfterSignIn = async (customerId: string) => {
    setRouting(true);
    try {
      const address = pickDefaultAddress(await client.fetchQuery({ queryKey: queryKeys.addresses(customerId), queryFn: fetchAddresses, staleTime: 15_000 }));
      if (address) {
        useAppStore.getState().setDeliveryPin(address.pincode);
        router.replace('/home');
        return;
      }
    } catch {
      // The address list could not be loaded; the location step still works, so carry on there.
    }
    router.replace('/location');
  };
  const submit = () => verify.mutate({ email, code: otp }, { onSuccess: ({ customer }) => { if (customer.needsProfile) router.replace({ pathname: '/edit-profile', params: { first: '1' } }); else void continueAfterSignIn(customer.id); } });
  const sendAgain = () => resend.mutate(email, { onSuccess: () => { setSecondsLeft(RESEND_SECONDS); setResent(true); setOtp(''); verify.reset(); } });
  const error = verify.error ?? resend.error;

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
    <StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, padding: theme.spacing.lg }}>
      <IconButton icon={BackIcon} label={t('commonActions.back')} onPress={() => router.back()} />
      <View style={{ flex: 1, paddingTop: theme.spacing.xl, gap: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.sm }}><ThemedText variant="h1">{t('verify.title')}</ThemedText><ThemedText variant="body" style={{ color: theme.colors.colorTextSecondary }}>{t('verify.description', { email })}</ThemedText></View>
        <View style={{ gap: theme.spacing.sm }}>
          <ThemedText variant="bodySmall">{t('verify.code')}</ThemedText>
          <View>
            <OtpBoxes value={otp} length={CODE_LENGTH} invalid={Boolean(error)} focused={focused} />
            {/* The real input lies invisibly over the boxes, so a tap or a long-press (paste) lands on it directly and always opens the keyboard. */}
            <TextInput ref={inputRef} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} accessibilityLabel={t('verify.code')} autoComplete="sms-otp" autoFocus caretHidden contextMenuHidden={false} keyboardType="number-pad" maxLength={CODE_LENGTH} onChangeText={(value) => { setOtp(value.replace(/\D/g, '')); if (verify.isError) verify.reset(); }} showSoftInputOnFocus style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.02, color: 'transparent' }} textContentType="oneTimeCode" value={otp} />
          </View>
          {error ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>{describeError(error)}</ThemedText> : resent ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorPrimary }}>{t('verify.codeSent')}</ThemedText> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: secondsLeft > 0 || resend.isPending }} disabled={secondsLeft > 0 || resend.isPending} hitSlop={theme.spacing.sm} onPress={sendAgain}>
          <ThemedText variant="bodySmall" weight="semibold" style={{ color: secondsLeft > 0 ? theme.colors.colorTextSecondary : theme.colors.colorPrimary }}>{secondsLeft > 0 ? t('verify.resendIn', { seconds: secondsLeft }) : t('verify.resend')}</ThemedText>
        </Pressable>
      </View>
      <KeyboardAwareBottomDrawer style={{ position: 'absolute', right: theme.spacing.lg, bottom: theme.spacing.md, left: theme.spacing.lg, gap: theme.spacing.md, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.sm, backgroundColor: theme.colors.colorBackground }}>
        <Button disabled={!canContinue || routing} loading={verify.isPending || routing} onPress={submit}>{t('verify.continue')}</Button>
      </KeyboardAwareBottomDrawer>
    </View>
  </SafeAreaView>;
}
