import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, StatusBar, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppInput, fieldChrome } from '../src/components/atoms/AppInput';
import { Button } from '../src/components/atoms/Button';
import { GoogleLogo } from '../src/components/atoms/GoogleLogo';
import { IconButton } from '../src/components/atoms/IconButton';
import { ThemedText } from '../src/components/atoms/ThemedText';
import { LanguageChip } from '../src/components/molecules/LanguageChip';
import { KeyboardAwareBottomDrawer } from '../src/components/organisms/KeyboardAwareBottomDrawer';
import { useAfterSignIn } from '../src/hooks/useAfterSignIn';
import { useGoogleSignIn, useRequestCode } from '../src/hooks/useCustomerAuth';
import { BackIcon, MailIcon } from '../src/icons/appIcons';
import { isEmail } from '../src/lib/phone';
import { describeError } from '../src/services/errorMapper';
import { googleSignInAvailable } from '../src/services/googleSignIn';
import { useTheme } from '../src/theme';
import type { PolicyType } from '../src/types/content';

/**
 * The first screen of signing in: two plain choices, "Continue with Google" and "Continue with email". Email opens the address
 * field and then the emailed code. Where Google is not available (an iPhone, or a build without it) the email field is all there is.
 */
export default function SignInScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const googleOffered = googleSignInAvailable();
  const [step, setStep] = useState<'choose' | 'email'>(googleOffered ? 'choose' : 'email');
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const requestCode = useRequestCode();
  const google = useGoogleSignIn();
  const { routing, continueAfterSignIn } = useAfterSignIn();
  const canContinue = isEmail(email);
  const showInvalid = email.includes('@') && email.includes('.') && !canContinue;
  const send = () => requestCode.mutate(email.trim().toLowerCase(), { onSuccess: () => router.push({ pathname: '/verify', params: { email: email.trim().toLowerCase() } }) });
  const withGoogle = () => google.mutate(undefined, { onSuccess: (result) => { if (result) void continueAfterSignIn(result.customer); } });
  const openPolicy = (type: PolicyType) => router.push({ pathname: '/policy-details', params: { type } });
  // On the email step, back returns to the two choices (the phone's own back button too) instead of leaving sign-in.
  const goBack = () => { if (step === 'email' && googleOffered) { setStep('choose'); requestCode.reset(); } else router.back(); };
  // The phone's own back button does the same: from the email step it returns to the two choices.
  const resetRequest = requestCode.reset;
  useEffect(() => {
    if (!(step === 'email' && googleOffered)) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { setStep('choose'); resetRequest(); return true; });
    return () => subscription.remove();
  }, [step, googleOffered, resetRequest]);

  const terms = (
    <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>
      {t('signIn.agreeBefore')}
      <ThemedText variant="caption" accessibilityRole="link" style={{ color: theme.colors.colorPrimary }} onPress={() => openPolicy('terms')}>{t('signIn.agreeTerms')}</ThemedText>
      {t('signIn.agreeAnd')}
      <ThemedText variant="caption" accessibilityRole="link" style={{ color: theme.colors.colorPrimary }} onPress={() => openPolicy('privacy')}>{t('signIn.agreePrivacy')}</ThemedText>
      {t('signIn.agreeAfter')}
    </ThemedText>
  );

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
    <StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}>
      <KeyboardAwareScrollView contentContainerStyle={{ paddingTop: theme.spacing.lg, paddingBottom: 88 }} keyboardShouldPersistTaps="handled" mode="layout">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon={BackIcon} label={t('commonActions.back')} onPress={goBack} />
          <LanguageChip />
        </View>
        <View style={{ flex: 1, paddingTop: theme.spacing.xl, gap: theme.spacing.xl }}>
          <View style={{ gap: theme.spacing.sm }}>
            <ThemedText variant="caption" style={{ color: theme.colors.colorPrimary }}>{t('signIn.eyebrow')}</ThemedText>
            <ThemedText variant="h1">{t('signIn.title')}</ThemedText>
            <ThemedText variant="body" style={{ color: theme.colors.colorTextSecondary }}>{step === 'choose' ? t('signIn.chooseHint') : t('signIn.description')}</ThemedText>
          </View>

          {step === 'choose' ? (
            <View style={{ gap: theme.spacing.md }}>
              <Button variant="secondary" leading={<GoogleLogo />} loading={google.isPending || routing} onPress={withGoogle}>{t('signIn.continueGoogle')}</Button>
              <Button icon={MailIcon} disabled={google.isPending || routing} onPress={() => setStep('email')}>{t('signIn.continueEmail')}</Button>
              {google.error ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>{describeError(google.error)}</ThemedText> : null}
              {terms}
            </View>
          ) : (
            <View style={{ gap: theme.spacing.xl }}>
              <View style={{ gap: theme.spacing.sm }}>
                <ThemedText variant="bodySmall">{t('signIn.email')}</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', ...fieldChrome(theme, { focused: emailFocused, error: Boolean(requestCode.error) || showInvalid }) }}>
                  <AppInput bare onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)} accessibilityLabel={t('signIn.email')} autoCapitalize="none" autoComplete="email" autoCorrect={false} keyboardType="email-address" maxLength={200} onChangeText={(value) => { setEmail(value); if (requestCode.isError) requestCode.reset(); }} placeholder={t('signIn.emailPlaceholder')} style={{ flex: 1, paddingHorizontal: theme.spacing.md }} textContentType="emailAddress" value={email} />
                </View>
                {showInvalid ? <ThemedText variant="caption" style={{ color: theme.colors.colorDanger }}>{t('signIn.invalidEmail')}</ThemedText> : null}
                {requestCode.error ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>{describeError(requestCode.error)}</ThemedText> : null}
              </View>
              {terms}
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
      {step === 'email' ? (
        <KeyboardAwareBottomDrawer openedOffset={theme.spacing.md} style={{ position: 'absolute', right: theme.spacing.lg, bottom: theme.spacing.md, left: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.sm, backgroundColor: theme.colors.colorBackground }}>
          <Button disabled={!canContinue} loading={requestCode.isPending} onPress={send}>{t('signIn.continue')}</Button>
        </KeyboardAwareBottomDrawer>
      ) : null}
    </View>
  </SafeAreaView>;
}
