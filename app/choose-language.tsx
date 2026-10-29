import { router } from "expo-router";
import { Image } from "expo-image";
import { StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { PressableScale } from "../src/components/atoms/PressableScale";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ForwardIcon } from "../src/icons/appIcons";
import i18n from "../src/lib/i18n";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { AppLanguage } from "../src/types/models";

// Written in both scripts on purpose: nothing on this screen may depend on the language not chosen yet. Gujarati comes first,
// since most customers read it; each choice also names itself in the other script.
const CHOICES: { value: AppLanguage; label: string; other: string }[] = [
  { value: "gu", label: "ગુજરાતી", other: "Gujarati" },
  { value: "en", label: "English", other: "અંગ્રેજી" },
];

/**
 * The first screen of a fresh install: one tap on a language sets it and moves on to the introduction. The phone's own language
 * is outlined as a hint, but nothing is chosen until the customer taps. It can be changed later on onboarding, sign-in or Profile.
 */
export default function ChooseLanguageScreen() {
  const theme = useTheme();
  const setLanguage = useAppStore((state) => state.setLanguage);
  // i18n starts in the phone's language (English unless the phone is set to Gujarati).
  const hinted: AppLanguage = i18n.language === "gu" ? "gu" : "en";

  const choose = (language: AppLanguage) => {
    setLanguage(language);
    router.replace("/onboarding");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: theme.spacing.lg, gap: theme.spacing.xl }}>
        <View style={{ alignItems: "center", gap: theme.spacing.md }}>
          <Image source={require("../assets/icon.png")} contentFit="contain" accessibilityLabel="ShreeRam Milks" style={{ width: 72, height: 72, borderRadius: theme.radii.lg }} />
          <View style={{ alignItems: "center", gap: theme.spacing.xs }}>
            <ThemedText accessibilityRole="header" variant="h1" style={{ textAlign: "center" }}>તમારી ભાષા પસંદ કરો</ThemedText>
            <ThemedText variant="body" style={{ textAlign: "center", color: theme.colors.colorTextSecondary }}>Choose your language</ThemedText>
          </View>
        </View>
        <View accessibilityRole="radiogroup" style={{ gap: theme.spacing.md }}>
          {CHOICES.map((choice) => {
            const hint = choice.value === hinted;
            return (
              <PressableScale
                key={choice.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: false }}
                accessibilityLabel={`${choice.label}, ${choice.other}`}
                onPress={() => choose(choice.value)}
                style={{ minHeight: 84, paddingHorizontal: theme.spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: theme.radii.lg, borderWidth: hint ? 2 : theme.borderWidths.hairline, borderColor: hint ? theme.colors.colorPrimary : theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface, ...theme.elevation.card }}
              >
                <View style={{ gap: 2 }}>
                  <ThemedText variant="h2" weight="extrabold">{choice.label}</ThemedText>
                  <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{choice.other}</ThemedText>
                </View>
                <AppIcon icon={ForwardIcon} accessibilityLabel="" tone={hint ? "brand" : "secondary"} />
              </PressableScale>
            );
          })}
        </View>
        <ThemedText variant="caption" style={{ textAlign: "center", color: theme.colors.colorTextSecondary }}>
          {"તમે પછી પ્રોફાઇલમાં બદલી શકો છો\nYou can change it later in Profile"}
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}
