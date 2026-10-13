import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { Avatar } from "../src/components/atoms/Avatar";
import { FormField } from "../src/components/molecules/FormField";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { useSaveProfile } from "../src/hooks/useCustomerAuth";
import { formatPhone } from "../src/lib/phone";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { useTheme } from "../src/theme";

export default function EditProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { first } = useLocalSearchParams<{ first?: string }>();
  const isFirstTime = first === "1";
  const customer = useSessionStore((state) => state.customer);
  const language = useAppStore((state) => state.language);
  const save = useSaveProfile();
  const [draft, setDraft] = useState({ fullName: customer?.name ?? "", email: customer?.email ?? "" });
  const [saved, setSaved] = useState(false);
  const emailError =
    draft.email.length > 0 && !/^\S+@\S+\.\S+$/.test(draft.email);
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <View
        style={{
          flex: 1,
          paddingHorizontal: theme.layout.screenHorizontalPadding,
        }}
      >
        <ScreenHeader
          backLabel={t("commonActions.back")}
          title={isFirstTime ? t("editProfile.firstTitle") : t("editProfile.title")}
        />
        <KeyboardAwareScrollView
          mode="layout"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: theme.spacing.md,
            paddingVertical: theme.spacing.md,
            paddingBottom: theme.spacing.xxl,
          }}
        >
          <View style={{ alignItems: "center", gap: theme.spacing.sm }}>
            <Avatar
              initials={draft.fullName.slice(0, 2).toUpperCase()}
              size="lg"
            />
          </View>
          {isFirstTime ? (
            <ThemedText
              variant="body"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {t("editProfile.firstDescription")}
            </ThemedText>
          ) : null}
          <FormField
            label={t("editProfile.name")}
            value={draft.fullName}
            onChangeText={(fullName) => {
              setDraft({ ...draft, fullName });
              setSaved(false);
            }}
            autoComplete="name"
          />
          <FormField
            label={t("editProfile.phone")}
            value={formatPhone(customer?.phone ?? "")}
            editable={false}
            keyboardType="phone-pad"
          />
          <ThemedText
            variant="caption"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            {t("editProfile.phoneHint")}
          </ThemedText>
          <FormField
            label={t("editProfile.email")}
            value={draft.email}
            onChangeText={(email) => {
              setDraft({ ...draft, email });
              setSaved(false);
            }}
            error={emailError ? t("editProfile.invalidEmail") : undefined}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Button
            disabled={emailError || !draft.fullName.trim()}
            loading={save.isPending}
            onPress={() =>
              save.mutate(
                { name: draft.fullName.trim(), email: draft.email.trim(), language },
                {
                  onSuccess: () => {
                    setSaved(true);
                    if (isFirstTime) router.replace("/location");
                  },
                },
              )
            }
          >
            {t("editProfile.save")}
          </Button>
          {save.error ? (
            <ThemedText
              accessibilityLiveRegion="polite"
              variant="bodySmall"
              style={{ color: theme.colors.colorDanger, textAlign: "center" }}
            >
              {describeError(save.error)}
            </ThemedText>
          ) : null}
          {saved ? (
            <ThemedText
              accessibilityLiveRegion="polite"
              variant="bodySmall"
              weight="semibold"
              style={{ color: theme.colors.colorPrimary, textAlign: "center" }}
            >
              {t("editProfile.saved")}
            </ThemedText>
          ) : null}
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}
