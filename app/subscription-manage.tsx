import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { Button } from "../src/components/atoms/Button";
import { IconButton } from "../src/components/atoms/IconButton";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { SubscriptionBottomSheet } from "../src/components/organisms/SubscriptionBottomSheet";
import { BackIcon, CalendarIcon } from "../src/icons/appIcons";
import { useTheme } from "../src/theme";

export default function ManageSubscriptionScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [editing, setEditing] = useState<"quantity" | "days" | "slot" | null>(
    null,
  );
  const [quantity, setQuantity] = useState("oneLitre");
  const [days, setDays] = useState("Mon–Sat");
  const [slot, setSlot] = useState("5–7 AM");
  const [reason, setReason] = useState("qualityIssue");
  const [nextDeliverySkipped, setNextDeliverySkipped] = useState(false);
  const cancellationReasons = ["tooExpensive", "qualityIssue", "notNeeded", "moving", "other"];
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: theme.layout.screenHorizontalPadding,
            paddingVertical: theme.spacing.md,
            borderBottomWidth: theme.borderWidths.hairline,
            borderColor: theme.colors.colorBorder,
          }}
        >
          <IconButton
            icon={BackIcon}
            label={t("subscriptionManage.back")}
            onPress={() => router.back()}
          />
          <ThemedText variant="body" weight="semibold">
            {t("subscriptionManage.title")}
          </ThemedText>
          <ThemedText variant="h2">?</ThemedText>
        </View>
        <ScrollView
          contentContainerStyle={{
            gap: theme.spacing.md,
            padding: theme.layout.screenHorizontalPadding,
            paddingBottom: theme.spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              {
                flexDirection: "row",
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.colorSurface,
              },
              theme.elevation.card,
            ]}
          >
            <Image
              source={require("../assets/onboarding-milk-hero.png")}
              contentFit="cover"
              style={{
                width: theme.sizes.productCardImageSize,
                height: theme.sizes.productCardImageSize,
                borderRadius: theme.radii.md,
              }}
            />
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    borderRadius: theme.radii.pill,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    backgroundColor: theme.colors.colorPrimaryTint,
                  }}
                >
                  <ThemedText
                    variant="caption"
                    weight="semibold"
                    style={{ color: theme.colors.colorPrimary }}
                  >
                    ● {t("subscriptionManage.active")}
                  </ThemedText>
                </View>
                <ThemedText
                  variant="body"
                  weight="semibold"
                  style={{ color: theme.colors.colorPrimary }}
                >
                  ₹95
                </ThemedText>
              </View>
              <ThemedText variant="body" weight="semibold">
                {t("subscriptionManage.product")}
              </ThemedText>
              <ThemedText
                variant="caption"
                style={{ color: theme.colors.colorTextSecondary }}
              >
                {t("subscriptionManage.productUnit")}
              </ThemedText>
              <ThemedText
                variant="caption"
                weight="semibold"
                style={{ color: theme.colors.colorPrimary }}
              >
                ▣ {t("subscriptionManage.tomorrowDelivery")}
              </ThemedText>
            </View>
          </View>
          <View
            style={{
              gap: theme.spacing.sm,
              padding: theme.spacing.md,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.colorSurface,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ThemedText variant="body" weight="semibold">
                {t("subscriptionManage.planSummary")}
              </ThemedText>
              <View
                style={{
                  borderRadius: theme.radii.sm,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  backgroundColor: theme.colors.colorSurfaceMuted,
                }}
              >
                <ThemedText
                  variant="caption"
                  weight="semibold"
                  style={{ color: theme.colors.colorTextSecondary }}
                >
                  {t("subscriptionManage.prepaidActive")}
                </ThemedText>
              </View>
            </View>
            <View style={{ gap: theme.spacing.sm }}>
              <SummaryRow
                label={t("subscriptionManage.frequency")}
                value={days === "Mon–Sat" ? t("subscriptionManage.monToSat") : t(`subscriptionManage.${days === "Daily" ? "daily" : "alternateDays"}`)}
              />
              <SummaryRow
                label={t("subscriptionManage.deliveryDays")}
                value={days === "Mon–Sat" ? "M  T  W  T  F  S" : days}
              />
              <SummaryRow
                label={t("subscriptionManage.bottleQuantity")}
                value={t("subscriptionManage.glassBottle", { quantity: t(`subscriptionManage.${quantity}`) })}
              />
              <SummaryRow
                label={t("subscriptionManage.preferredSlot")}
                value={
                  slot === "5–7 AM" ? t("subscriptionManage.earlySlot") : t("subscriptionManage.regularSlot")
                }
                detail={t("subscriptionManage.silentPorch")}
              />
              <SummaryRow label={t("subscriptionManage.startDate")} value={t("subscriptionManage.startDateValue")} />
              <SummaryRow
                label={t("subscriptionManage.nextDelivery")}
                value={nextDeliverySkipped ? t("subscriptionManage.skipped") : t("subscriptionManage.nextDeliveryValue")}
                accent
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: theme.spacing.sm,
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.colorSurfaceMuted,
              }}
            >
              <ThemedText variant="bodySmall">▣ {t("subscriptionManage.perDelivery")}</ThemedText>
              <View style={{ alignItems: "flex-end" }}>
                <ThemedText variant="body" weight="bold">
                  ₹95
                </ThemedText>
                <ThemedText
                  variant="caption"
                  style={{ color: theme.colors.colorTextSecondary }}
                >
                  {t("subscriptionManage.zeroDeliveryFee")}
                </ThemedText>
              </View>
            </View>
          </View>
          <View
            style={{
              gap: theme.spacing.none,
              overflow: "hidden",
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.colorSurface,
            }}
          >
            <View style={{ padding: theme.spacing.md }}>
              <ThemedText variant="body" weight="semibold">
                {t("subscriptionManage.managePreferences")}
              </ThemedText>
            </View>
            <ManageRow
              title={t("subscriptionManage.changeQuantity")}
              subtitle={t("subscriptionManage.changeQuantityDetail")}
              value={t(`subscriptionManage.${quantity}`)}
              onPress={() => setEditing("quantity")}
            />
            <ManageRow
              title={t("subscriptionManage.changeDays")}
              subtitle={t("subscriptionManage.changeDaysDetail")}
              value={days}
              onPress={() => setEditing("days")}
            />
            <ManageRow
              title={t("subscriptionManage.changeSlot")}
              subtitle={t("subscriptionManage.changeSlotDetail")}
              value={slot}
              onPress={() => setEditing("slot")}
            />
            <ManageRow
              title={t("subscriptionManage.skipDelivery")}
              subtitle={t("subscriptionManage.skipDeliveryDetail")}
              value={nextDeliverySkipped ? t("subscriptionManage.skipped") : t("subscriptionManage.tomorrow")}
              onPress={() => setNextDeliverySkipped((current) => !current)}
            />
            <ManageRow
              title={t("subscriptionManage.pause")}
              subtitle={t("subscriptionManage.pauseDetail")}
              onPress={() => router.push("/subscription-vacation")}
            />
          </View>
          <View
            style={{
              gap: theme.spacing.sm,
              padding: theme.spacing.md,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.colorPrimary,
            }}
          >
            <ThemedText
              variant="body"
              weight="semibold"
              style={{ color: theme.colors.colorTextInverse }}
            >
              {t("subscriptionManage.returnTitle")}
            </ThemedText>
            <ThemedText
              variant="caption"
              style={{ color: theme.colors.colorPrimaryTint }}
            >
              {t("subscriptionManage.returnDetail")}
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setCancelOpen(true)}
            style={{
              minHeight: theme.sizes.buttonHeight,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.colorDangerTint,
            }}
          >
            <ThemedText
              variant="body"
              weight="semibold"
              style={{ color: theme.colors.colorDanger }}
            >
              ⊗ {t("subscriptionManage.cancel")}
            </ThemedText>
          </Pressable>
          <ThemedText
            variant="caption"
            style={{
              color: theme.colors.colorTextSecondary,
              textAlign: "center",
            }}
          >
            {t("subscriptionManage.refundNotice")}
          </ThemedText>
        </ScrollView>
      </View>
      <SubscriptionBottomSheet
        visible={cancelOpen}
        onClose={() => setCancelOpen(false)}
      >
        <View style={{ gap: theme.spacing.md }}>
          <View style={{ gap: theme.spacing.xs }}>
            <ThemedText
              variant="caption"
              weight="semibold"
              style={{ color: theme.colors.colorPrimary }}
            >
              ● {t("subscriptionManage.careTeam")}
            </ThemedText>
            <ThemedText variant="h2">{t("subscriptionManage.cancelTitle")}</ThemedText>
            <ThemedText
              variant="bodySmall"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {t("subscriptionManage.cancelDetail")}
            </ThemedText>
          </View>
          <View style={{ gap: theme.spacing.sm }}>
            <ThemedText variant="bodySmall" weight="semibold">
              {t("subscriptionManage.selectReason")}
            </ThemedText>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: theme.spacing.sm,
              }}
            >
              {cancellationReasons.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: item === reason }}
                  onPress={() => setReason(item)}
                  style={{
                    borderRadius: theme.radii.pill,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    backgroundColor:
                      item === reason
                        ? theme.colors.colorPrimary
                        : theme.colors.colorSurfaceMuted,
                  }}
                >
                  <ThemedText
                    variant="caption"
                    weight="semibold"
                    style={{
                      color:
                        item === reason
                          ? theme.colors.colorTextInverse
                          : theme.colors.colorTextPrimary,
                    }}
                  >
                    {t(`subscriptionManage.${item}`)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable
            onPress={() => {
              setCancelOpen(false);
              router.push("/subscription-vacation");
            }}
            style={{
              gap: theme.spacing.xs,
              padding: theme.spacing.md,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.colorPrimaryTint,
            }}
          >
            <ThemedText variant="bodySmall" weight="semibold">
              {t("subscriptionManage.awayTitle")}
            </ThemedText>
            <ThemedText
              variant="caption"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {t("subscriptionManage.awayDetail")}
            </ThemedText>
            <ThemedText
              variant="caption"
              weight="semibold"
              style={{ color: theme.colors.colorPrimary }}
            >
              {t("subscriptionManage.pauseInstead")}
            </ThemedText>
          </Pressable>
          <Button onPress={() => setCancelOpen(false)}>
            {t("subscriptionManage.keep")} →
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              setCancelOpen(false);
              router.replace("/subscriptions");
            }}
            style={{ backgroundColor: theme.colors.colorDangerTint }}
          >
            {t("subscriptionManage.cancelAnyway")}
          </Button>
        </View>
      </SubscriptionBottomSheet>
      <SubscriptionBottomSheet
        visible={editing !== null}
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <ScheduleEditor
            title={
              editing === "quantity"
                ? t("subscriptionManage.changeQuantity")
                : editing === "days"
                  ? t("subscriptionManage.changeDays")
                  : t("subscriptionManage.changeSlot")
            }
            values={
              editing === "quantity"
                ? ["oneLitre", "twoLitres"]
                : editing === "days"
                  ? ["Mon–Sat", "alternateDays", "daily"]
                  : ["5–7 AM", "7–9 AM"]
            }
            current={
              editing === "quantity"
                ? quantity
                : editing === "days"
                  ? days
                  : slot
            }
            onCancel={() => setEditing(null)}
            onSave={(value) => {
              if (editing === "quantity") setQuantity(value);
              if (editing === "days") setDays(value);
              if (editing === "slot") setSlot(value);
              setEditing(null);
            }}
          />
        ) : null}
      </SubscriptionBottomSheet>
    </SafeAreaView>
  );
}

function ScheduleEditor({
  current,
  onCancel,
  onSave,
  title,
  values,
}: {
  current: string;
  onCancel: () => void;
  onSave: (value: string) => void;
  title: string;
  values: string[];
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [selected, setSelected] = useState(current);
  return (
    <View style={{ gap: theme.spacing.md }}>
      <ThemedText variant="h2">{title}</ThemedText>
      <View style={{ gap: theme.spacing.sm }}>
        {values.map((value) => (
          <Pressable
            key={value}
            onPress={() => setSelected(value)}
            style={{
              padding: theme.spacing.md,
              borderRadius: theme.radii.md,
              borderWidth:
                selected === value
                  ? theme.borderWidths.medium
                  : theme.borderWidths.hairline,
              borderColor:
                selected === value
                  ? theme.colors.colorPrimary
                  : theme.colors.colorBorder,
              backgroundColor: theme.colors.colorSurface,
            }}
          >
            <ThemedText variant="bodySmall" weight="semibold">
              {value === "oneLitre" || value === "twoLitres" || value === "alternateDays" || value === "daily"
                ? t(`subscriptionManage.${value}`)
                : value}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        <Button variant="secondary" style={{ flex: 1 }} onPress={onCancel}>
          {t("subscriptionManage.cancelAction")}
        </Button>
        <Button style={{ flex: 1 }} onPress={() => onSave(selected)}>
          {t("subscriptionManage.saveChanges")}
        </Button>
      </View>
    </View>
  );
}

function SummaryRow({
  accent = false,
  detail,
  label,
  value,
}: {
  accent?: boolean;
  detail?: string;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: theme.borderWidths.hairline,
        borderColor: theme.colors.colorBorder,
      }}
    >
      <ThemedText
        variant="caption"
        style={{ color: theme.colors.colorTextSecondary }}
      >
        {label}
      </ThemedText>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <ThemedText
          variant="caption"
          weight="semibold"
          style={{
            color: accent
              ? theme.colors.colorPrimary
              : theme.colors.colorTextPrimary,
            textAlign: "right",
          }}
        >
          {value}
        </ThemedText>
        {detail ? (
          <ThemedText
            variant="caption"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            {detail}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

function ManageRow({
  onPress,
  subtitle,
  title,
  value,
}: {
  onPress?: () => void;
  subtitle: string;
  title: string;
  value?: string;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        borderTopWidth: theme.borderWidths.hairline,
        borderColor: theme.colors.colorBorder,
      }}
    >
      <View
        style={{
          width: theme.sizes.avatarMd,
          height: theme.sizes.avatarMd,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.colorSurfaceMuted,
        }}
      >
        <AppIcon icon={CalendarIcon} accessibilityLabel="" size="sm" />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText variant="bodySmall" weight="semibold">
          {title}
        </ThemedText>
        <ThemedText
          variant="caption"
          style={{ color: theme.colors.colorTextSecondary }}
        >
          {subtitle}
        </ThemedText>
      </View>
      {value ? (
        <View
          style={{
            borderRadius: theme.radii.pill,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
            backgroundColor: theme.colors.colorSurfaceMuted,
          }}
        >
          <ThemedText variant="caption" weight="semibold">
            {value}
          </ThemedText>
        </View>
      ) : null}
      {onPress ? <ThemedText variant="body" style={{ color: theme.colors.colorTextSecondary }}>›</ThemedText> : <ThemedText variant="caption" style={{ color: theme.colors.colorTextDisabled }}>{t("commonActions.comingSoon")}</ThemedText>}
    </Pressable>
  );
}
