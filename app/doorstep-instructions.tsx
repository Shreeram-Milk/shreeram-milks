import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StatusBar, Switch, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppInput } from "../src/components/atoms/AppInput";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useDoorstepInstructions, useSaveDoorstepInstructions } from "../src/hooks/useAddresses";
import { describeError } from "../src/services/errorMapper";
import { useTheme } from "../src/theme";
import type { DoorstepInstructions } from "../src/types/models";

const handoffOptions: {
  key: DoorstepInstructions["handoff"];
  label: string;
}[] = [
  { key: "hand-to-me", label: "instructions.handToMe" },
  { key: "leave-at-door", label: "instructions.leaveAtDoor" },
  { key: "milk-box", label: "instructions.milkBox" },
  { key: "security", label: "instructions.security" },
];
const dropOptions: {
  key: DoorstepInstructions["dropLocation"];
  label: string;
}[] = [
  { key: "front-door", label: "instructions.frontDoor" },
  { key: "side-gate", label: "instructions.sideGate" },
  { key: "milk-box", label: "instructions.milkBox" },
  { key: "security-desk", label: "instructions.securityDesk" },
];

function InstructionsForm({ savedInstructions }: { savedInstructions: DoorstepInstructions }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const saver = useSaveDoorstepInstructions();
  const [draft, setDraft] = useState(savedInstructions);
  const [saved, setSaved] = useState(false);
  const save = () => saver.mutate(draft, { onSuccess: () => setSaved(true) });
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
          title={t("instructions.title")}
        />
        <KeyboardAwareScrollView
          mode="layout"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            paddingBottom: theme.spacing.xxl,
          }}
        >
          <ThemedText
            variant="bodySmall"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            {t("instructions.subtitle")}
          </ThemedText>
          <OptionGroup
            title={t("instructions.handoff")}
            options={handoffOptions}
            value={draft.handoff}
            onChange={(handoff) => setDraft({ ...draft, handoff })}
          />
          <View style={{ gap: theme.spacing.sm }}>
            <ThemedText variant="body" weight="semibold">
              {t("instructions.quiet")}
            </ThemedText>
            <Preference
              label={t("instructions.noDoorbell")}
              value={draft.noDoorbell}
              onChange={(noDoorbell) => setDraft({ ...draft, noDoorbell })}
            />
            <Preference
              label={t("instructions.noCall")}
              value={draft.noCall}
              onChange={(noCall) => setDraft({ ...draft, noCall })}
            />
            <Preference
              label={t("instructions.notify")}
              value={draft.notifyAfterDelivery}
              onChange={(notifyAfterDelivery) =>
                setDraft({ ...draft, notifyAfterDelivery })
              }
            />
          </View>
          <OptionGroup
            title={t("instructions.dropLocation")}
            options={dropOptions}
            value={draft.dropLocation}
            onChange={(dropLocation) => setDraft({ ...draft, dropLocation })}
          />
          <View style={{ gap: theme.spacing.sm }}>
            <ThemedText variant="body" weight="semibold">
              {t("instructions.additional")}
            </ThemedText>
            <AppInput
              accessibilityLabel={t("instructions.additional")}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: theme.sizes.inputHeight + theme.spacing.xxl }}
              placeholder={t("instructions.additionalPlaceholder")}
              value={draft.additionalInstructions}
              onChangeText={(additionalInstructions) =>
                setDraft({ ...draft, additionalInstructions })
              }
            />
          </View>
          {saver.error ? (
            <ThemedText accessibilityLiveRegion="polite" variant="bodySmall" style={{ color: theme.colors.colorDanger }}>
              {describeError(saver.error)}
            </ThemedText>
          ) : null}
          <Button loading={saver.isPending} onPress={save}>{t("instructions.save")}</Button>
          {saved && JSON.stringify(draft) === JSON.stringify(savedInstructions) ? (
            <ThemedText
              accessibilityLiveRegion="polite"
              variant="bodySmall"
              weight="semibold"
              style={{ color: theme.colors.colorPrimary, textAlign: "center" }}
            >
              {t("instructions.saved")}
            </ThemedText>
          ) : null}
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}

function OptionGroup<T extends string>({
  onChange,
  options,
  title,
  value,
}: {
  onChange: (value: T) => void;
  options: { key: T; label: string }[];
  title: string;
  value: T;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <ThemedText variant="body" weight="semibold">
        {title}
      </ThemedText>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.key)}
            style={{
              minHeight: theme.layout.touchTargetMin,
              paddingHorizontal: theme.spacing.md,
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
              borderRadius: theme.radii.md,
              borderWidth: selected
                ? theme.borderWidths.medium
                : theme.borderWidths.hairline,
              borderColor: selected
                ? theme.colors.colorPrimary
                : theme.colors.colorBorder,
              backgroundColor: selected
                ? theme.colors.colorPrimaryTint
                : theme.colors.colorSurface,
            }}
          >
            <ThemedText variant="bodySmall" weight="semibold">
              {t(option.label)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
function Preference({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        minHeight: theme.layout.touchTargetMin,
        paddingHorizontal: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.colorSurfaceSecondary,
      }}
    >
      <ThemedText variant="bodySmall" style={{ flex: 1 }}>
        {label}
      </ThemedText>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: theme.colors.colorSurfaceDisabled,
          true: theme.colors.colorPrimaryTint,
        }}
        thumbColor={
          value ? theme.colors.colorPrimary : theme.colors.colorTextDisabled
        }
      />
    </View>
  );
}

/** Loads the saved preferences first, so the form starts from what the customer chose last time. */
export default function DoorstepInstructionsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useDoorstepInstructions();
  if (isLoading || isError || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground, padding: theme.layout.screenHorizontalPadding }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={t("instructions.title")} />
        {isError ? <StateMessage type="error" title={t("instructions.errorTitle")} description={t("addresses.errorDetail")} actionLabel={t("addresses.retry")} onAction={() => void refetch()} /> : <StateMessage type="loading" title={t("instructions.loading")} />}
      </SafeAreaView>
    );
  }
  return <InstructionsForm savedInstructions={data} />;
}
