import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AvailabilityGate } from "../src/components/organisms/AvailabilityGate";
import { LanguageSwitchOverlay } from "../src/components/organisms/LanguageSwitchOverlay";
import { PushSetup } from "../src/components/organisms/PushSetup";
import { StartupHandoff } from "../src/components/organisms/StartupHandoff";
import { AppProviders } from "../src/providers/AppProviders";
import { theme, useAppFonts } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";
import { useSessionStore } from "../src/store/useSessionStore";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const sessionStatus = useSessionStore((state) => state.status);
  const previousStatus = useRef(sessionStatus);

  useEffect(() => {
    void useSessionStore.getState().restore();
  }, []);

  // A token the server refused (or an account deleted elsewhere) ends the session; send the customer back to the start.
  useEffect(() => {
    if (previousStatus.current === "signedIn" && sessionStatus === "signedOut") router.replace("/onboarding");
    previousStatus.current = sessionStatus;
  }, [sessionStatus]);

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
          <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
          <Stack.Screen name="order-success" options={{ animation: "fade", gestureEnabled: false }} />
          <Stack.Screen name="search" options={{ animation: "fade_from_bottom" }} />
          <Stack.Screen name="delivery-slot" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="language" options={{ animation: "slide_from_bottom" }} />
        </Stack>
      </AvailabilityGate>
      <LanguageSwitchOverlay />
      <PushSetup />
      <StartupHandoff />
    </AppProviders>
  );
}
