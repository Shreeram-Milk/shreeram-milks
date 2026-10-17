import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { Avatar } from "../src/components/atoms/Avatar";
import { MailIcon, PhoneIcon, ProfileIcon } from "../src/icons/appIcons";
import { FormField } from "../src/components/molecules/FormField";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { useSaveProfile } from "../src/hooks/useCustomerAuth";
import { isIndianMobile, toTenDigits } from "../src/lib/phone";
import { describeError } from "../src/services/errorMapper";
import { useToast } from "../src/providers/ToastProvider";
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
  const [draft, setDraft] = useState({ fullName: customer?.name ?? "", phone: toTenDigits(customer?.phone ?? "") });
  const { showToast } = useToast();
  const phoneError = draft.phone.length > 0 && !isIndianMobile(draft.phone);
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
            icon={ProfileIcon}
            value={draft.fullName}
            onChangeText={(fullName) => {
              setDraft({ ...draft, fullName });
            }}
            autoComplete="name"
          />
          <FormField
            label={t("editProfile.email")}
            icon={MailIcon}
            helper={t("editProfile.emailHint")}
            value={customer?.email ?? ""}
            editable={false}
            keyboardType="email-address"
          />
          <FormField
            label={t("editProfile.phone")}
            icon={PhoneIcon}
            helper={t("editProfile.phoneHint")}
            valid={!phoneError && draft.phone.length > 0}
            value={draft.phone}
            onChangeText={(phone) => {
              setDraft({ ...draft, phone: phone.replace(/\D/g, "") });
            }}
            error={phoneError ? t("editProfile.invalidPhone") : undefined}
            keyboardType="phone-pad"
            maxLength={10}
            autoComplete="tel"
          />
          <Button
            disabled={phoneError || !draft.fullName.trim()}
            loading={save.isPending}
            onPress={() =>
              save.mutate(
                { name: draft.fullName.trim(), phone: draft.phone, language },
                {
                  onSuccess: () => {
                    showToast(t("editProfile.saved"));
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
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}
