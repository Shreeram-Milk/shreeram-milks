import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { DeliverySetupHeader } from "../src/components/molecules/DeliverySetupHeader";
import { useScrollResponsiveBottomAction } from "../src/components/organisms/ScrollResponsiveBottomAction";
import { useAddresses, useDoorstepInstructions, useSaveDoorstepInstructions, pickDefaultAddress } from "../src/hooks/useAddresses";
import { usePinAvailability } from "../src/hooks/usePinAvailability";
import { formatDeliveryDate, formatWindow } from "../src/lib/deliveryText";
import { describeError } from "../src/services/errorMapper";
import { CalendarIcon, LocationIcon } from "../src/icons/appIcons";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { ServedSlot } from "../src/types/delivery";

interface ProtocolSwitchProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function ProtocolSwitch({
  label,
  description,
  value,
  onChange,
}: ProtocolSwitchProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        borderTopWidth: theme.borderWidths.hairline,
        borderColor: theme.colors.colorBorder,
      }}
    >
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <ThemedText variant="bodySmall" weight="semibold">
          {label}
        </ThemedText>
        <ThemedText
          variant="caption"
          style={{ color: theme.colors.colorTextSecondary }}
        >
          {description}
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={label}
        onPress={() => onChange(!value)}
        style={{
          width: 48,
          height: 28,
          justifyContent: "center",
          borderRadius: theme.radii.pill,
          padding: 3,
          backgroundColor: value
            ? theme.colors.colorPrimary
            : theme.colors.colorBorder,
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            alignSelf: value ? "flex-end" : "flex-start",
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.colorSurface,
          }}
        />
      </Pressable>
    </View>
  );
}

/** One delivery window the customer's PIN code gets, from the admin's delivery slots. Shown for information: the window is chosen when ordering. */
function WindowCard({ slot, language }: { slot: ServedSlot; language: "en" | "gu" }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        minHeight: theme.sizes.slotCardHeight * 2,
        justifyContent: "space-between",
        borderRadius: theme.radii.lg,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.colorSurface,
        borderWidth: theme.borderWidths.hairline,
        borderColor: theme.colors.colorBorder,
      }}
    >
      <View
        style={{
          width: theme.sizes.avatarSm,
          height: theme.sizes.avatarSm,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.colorSurfaceMuted,
        }}
      >
        <AppIcon icon={CalendarIcon} accessibilityLabel="" size="sm" tone="secondary" />
      </View>
      <View style={{ gap: theme.spacing.xs }}>
        <ThemedText variant="bodySmall" weight="semibold">
          {slot.name}
        </ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>
          {formatWindow(slot.startTime, slot.endTime)}
        </ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorPrimary }}>
          {t("location.earliest", { date: formatDeliveryDate(slot.earliestDate, language) })}
        </ThemedText>
      </View>
    </View>
  );
}

export default function DeliverySlotScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { bottomActionStyle, onScroll } = useScrollResponsiveBottomAction();
  const language = useAppStore((state) => state.language);
  const deliveryPin = useAppStore((state) => state.deliveryPin);
  const { data: addresses } = useAddresses();
  const { data: availability } = usePinAvailability(deliveryPin);
  const { data: instructions } = useDoorstepInstructions();
  const saveInstructions = useSaveDoorstepInstructions();
  const [ringChoice, setRingChoice] = useState<boolean | null>(null);
  const address = pickDefaultAddress(addresses);
  const ringBell = ringChoice ?? (instructions ? !instructions.noDoorbell : false);
  // Distinct windows across every delivery option that serves the PIN, in time order.
  const windows = [...new Map((availability?.options ?? []).flatMap((option) => option.slots).map((slot) => [slot.slotId, slot])).values()].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const complete = () => {
    if (!instructions) { router.replace("/home"); return; }
    saveInstructions.mutate({ ...instructions, noDoorbell: !ringBell }, { onSuccess: () => router.replace("/home") });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}>
        <DeliverySetupHeader
          step={2}
          title={t("deliverySlot.title")}
          skipLabel={t("location.skip")}
        />
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            gap: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: 132,
          }}
        >
          <ThemedText
            variant="bodySmall"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            {t("deliverySlot.description")}
          </ThemedText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
              borderRadius: theme.radii.lg,
              borderWidth: theme.borderWidths.hairline,
              borderColor: theme.colors.colorBorder,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.colorSurfaceDisabled,
            }}
          >
            <View
              style={{
                width: theme.sizes.avatarMd,
                height: theme.sizes.avatarMd,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.colorSurface,
              }}
            >
              <AppIcon
                icon={LocationIcon}
                accessibilityLabel={t("deliverySlot.deliveringTo")}
                size="sm"
              />
            </View>
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <ThemedText
                variant="caption"
                weight="semibold"
                style={{ color: theme.colors.colorTextSecondary }}
              >
                {t("deliverySlot.deliveringTo")}
              </ThemedText>
              <ThemedText
                variant="bodySmall"
                numberOfLines={2}
                weight="semibold"
              >
                {address ? [address.line1, address.line2].filter(Boolean).join(", ") : t("deliverySlot.pinOnly", { pin: deliveryPin })}
              </ThemedText>
              {address ? (
                <ThemedText
                  variant="caption"
                  style={{ color: theme.colors.colorTextSecondary }}
                >
                  {[address.city, address.pincode].filter(Boolean).join(" • ")}
                </ThemedText>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("addresses.edit")}
              onPress={() => router.back()}
              style={{
                borderRadius: theme.radii.pill,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                backgroundColor: theme.colors.colorSurface,
              }}
            >
              <ThemedText
                variant="caption"
                weight="semibold"
                style={{ color: theme.colors.colorPrimary }}
              >
                {t("addresses.edit")}
              </ThemedText>
            </Pressable>
          </View>
          <View style={{ gap: theme.spacing.sm }}>
            <ThemedText
              variant="caption"
              weight="semibold"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {t("deliverySlot.windowsTitle")}
            </ThemedText>
            {windows.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
                {windows.map((slot) => (
                  <View key={slot.slotId} style={{ flexBasis: "47%", flexGrow: 1 }}>
                    <WindowCard slot={slot} language={language} />
                  </View>
                ))}
              </View>
            ) : (
              <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>
                {t("deliverySlot.noWindows")}
              </ThemedText>
            )}
          </View>
          <View
            style={{
              gap: theme.spacing.sm,
              borderRadius: theme.radii.lg,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.colorSurfaceDisabled,
            }}
          >
            <ThemedText variant="body" weight="semibold">
              {t("deliverySlot.protocol")}
            </ThemedText>
            <ProtocolSwitch
              label={t("deliverySlot.ring")}
              description={t("deliverySlot.ringDetail")}
              value={ringBell}
              onChange={setRingChoice}
            />
          </View>
          {saveInstructions.error ? (
            <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>
              {describeError(saveInstructions.error)}
            </ThemedText>
          ) : null}
        </Animated.ScrollView>
        <Animated.View
          style={[
            {
              position: "absolute",
              right: theme.spacing.lg,
              bottom: theme.spacing.sm,
              left: theme.spacing.lg,
              paddingTop: theme.spacing.xs,
              backgroundColor: theme.colors.colorBackground,
            },
            bottomActionStyle,
          ]}
        >
          <View style={{ paddingBottom: theme.spacing.xs }}>
            <Button loading={saveInstructions.isPending} onPress={complete}>
              {t("deliverySlot.complete")}
            </Button>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
