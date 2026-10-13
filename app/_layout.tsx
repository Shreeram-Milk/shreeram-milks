import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AvailabilityGate } from "../src/components/organisms/AvailabilityGate";
import { AppProviders } from "../src/providers/AppProviders";
import { useAppFonts } from "../src/theme";
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

  useEffect(() => {
    void AsyncStorage.getItem("appLanguage")
      .then((language) => {
        if (language === "en" || language === "gu")
          useAppStore.getState().setLanguage(language);
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
        <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      </AvailabilityGate>
    </AppProviders>
  );
}
