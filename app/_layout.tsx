import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AvailabilityGate } from "../src/components/organisms/AvailabilityGate";
import { LanguageSwitchOverlay } from "../src/components/organisms/LanguageSwitchOverlay";
import { PushSetup } from "../src/components/organisms/PushSetup";
import { SignedOutGuard } from "../src/components/organisms/SignedOutGuard";
import { StartupHandoff } from "../src/components/organisms/StartupHandoff";
import { AppProviders } from "../src/providers/AppProviders";
import { theme, useAppFonts } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";
import { useSessionStore } from "../src/store/useSessionStore";

void SplashScreen.preventAutoHideAsync();

/** Signed-in screens with the default slide animation (the tabs and the few with their own animation are listed in the Stack). */
const PROTECTED_SCREENS = [
  "checkout-address", "checkout-review", "delivery-addresses", "delivery-address-form", "delivery-calendar", "doorstep-instructions",
  "edit-profile", "help", "location", "my-report", "my-reports", "notifications", "offers", "orders", "order-tracking",
  "product-details", "report-issue", "settings", "subscribe-review", "subscription-manage", "subscription-vacation", "support",
] as const;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const sessionStatus = useSessionStore((state) => state.status);

  useEffect(() => {
    void useSessionStore.getState().restore();
  }, []);

  // The saved language and delivery PIN are read before the first screen is chosen: the start screen needs the PIN to decide between Home and the location step.
  useEffect(() => {
    void Promise.all([AsyncStorage.getItem("appLanguage"), AsyncStorage.getItem("deliveryPin")])
      .then(([language, pin]) => {
        if (language === "en" || language === "gu")
          useAppStore.getState().setLanguage(language);
        if (pin && !useAppStore.getState().deliveryPin) useAppStore.setState({ deliveryPin: pin });
      })
      .catch(() => undefined)
      .finally(() => setLanguageLoaded(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && languageLoaded && sessionStatus !== "restoring")
      void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded, languageLoaded, sessionStatus]);

  if ((!fontsLoaded && !fontError) || !languageLoaded || sessionStatus === "restoring") return null;
  if (fontError) throw fontError;

  return (
    <AppProviders>
      <AvailabilityGate>
        {/* Detail screens slide in from the right with no dark shade over the page behind; entry, tab and finish screens fade; pickers rise from the bottom. */}
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: theme.colors.colorBackground } }}>
          <Stack.Screen name="index" options={{ animation: "fade" }} />
          <Stack.Screen name="choose-language" options={{ animation: "fade", gestureEnabled: false }} />
          <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="verify" />
          <Stack.Screen name="language" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="policies" />
          <Stack.Screen name="policy-details" />
          {/* Everything else needs a signed-in customer. Signing out (or a token the server refuses) removes these screens from
              the history, so Back can never return to them, and the app goes back to the start. A new screen must be listed here. */}
          <Stack.Protected guard={sessionStatus === "signedIn"}>
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            <Stack.Screen name="order-success" options={{ animation: "fade", gestureEnabled: false }} />
            <Stack.Screen name="search" options={{ animation: "fade_from_bottom" }} />
            <Stack.Screen name="delivery-slot" options={{ animation: "slide_from_bottom" }} />
            {PROTECTED_SCREENS.map((name) => <Stack.Screen key={name} name={name} />)}
          </Stack.Protected>
        </Stack>
      </AvailabilityGate>
      <LanguageSwitchOverlay />
      <PushSetup />
      <StartupHandoff />
      <SignedOutGuard />
    </AppProviders>
  );
}
