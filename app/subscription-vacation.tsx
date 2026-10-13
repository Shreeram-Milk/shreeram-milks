import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/atoms/Button";
import { IconButton } from "../src/components/atoms/IconButton";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { SharedCalendar } from "../src/components/molecules/SharedCalendar";
import { BackIcon } from "../src/icons/appIcons";
import { useTheme } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";
import { useDeliveryCalendar } from "../src/hooks/useDeliveryCalendar";
import { useProducts } from "../src/hooks/useProducts";
import type { Product } from "../src/types/models";

type Step = "products" | "dates" | "success";
type DateField = "pause" | "resume";

const subscriptions = [
  {
    id: "a2-cow-milk",
    nameKey: "a2Milk",
    detailKey: "milkDaily",
  },
  {
    id: "buffalo-milk",
    nameKey: "buffaloMilk",
    detailKey: "milkDaily",
  },
  {
    id: "premium-curd",
    nameKey: "dahi",
    detailKey: "dahiAlternate",
  },
];

const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.UTC(
      Number(to.slice(0, 4)),
      Number(to.slice(5, 7)) - 1,
      Number(to.slice(8, 10)),
    ) -
      Date.UTC(
        Number(from.slice(0, 4)),
        Number(from.slice(5, 7)) - 1,
        Number(from.slice(8, 10)),
      )) / 86_400_000,
  );

export default function SubscriptionVacationScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("products");
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "a2-cow-milk",
    "buffalo-milk",
  ]);
  const [activeDateField, setActiveDateField] = useState<DateField>("pause");
  const initialDate = new Date();
  initialDate.setHours(12, 0, 0, 0);
  const initialWeekStart = addDays(initialDate, -((initialDate.getDay() + 6) % 7));
  const [pauseDate, setPauseDate] = useState(localDateKey(initialDate));
  const [resumeDate, setResumeDate] = useState(localDateKey(addDays(initialWeekStart, 14)));
  const setVacationPause = useAppStore((state) => state.setVacationPause);
  const setDeliveryState = useAppStore((state) => state.setDeliveryState);
  const { data: deliveries = [] } = useDeliveryCalendar();
  const { data: products = [] } = useProducts();
  const duration = daysBetween(pauseDate, resumeDate);

  const toggleSubscription = (id: string) =>
    setSelectedIds((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  const selectDate = (date: string) => {
    if (date < localDateKey(new Date())) return;
    if (activeDateField === "pause") {
      setPauseDate(date);
      if (date >= resumeDate)
        setResumeDate(localDateKey(addDays(new Date(`${date}T12:00:00`), 1)));
      setActiveDateField("resume");
    } else if (date > pauseDate) setResumeDate(date);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <Header
          onBack={() =>
            step === "products"
              ? router.back()
              : setStep(step === "dates" ? "products" : "dates")
          }
          step={step}
        />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: theme.spacing.lg,
            padding: theme.layout.screenHorizontalPadding,
            paddingBottom: theme.spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Progress step={step} />
          {step === "products" ? (
            <SelectProducts
              selectedIds={selectedIds}
              onToggle={toggleSubscription}
              products={products}
            />
          ) : null}
          {step === "dates" ? (
            <SelectDates
              activeField={activeDateField}
              onFieldChange={setActiveDateField}
              onDateSelect={selectDate}
              pauseDate={pauseDate}
              resumeDate={resumeDate}
            />
          ) : null}
          {step === "success" ? (
            <SuccessState pauseDate={pauseDate} resumeDate={resumeDate} />
          ) : null}
        </ScrollView>
        <View
          style={{
            paddingHorizontal: theme.layout.screenHorizontalPadding,
            paddingVertical: theme.spacing.md,
            backgroundColor: theme.colors.colorBackground,
          }}
        >
          {step === "products" ? (
            <Button
              disabled={selectedIds.length === 0}
              onPress={() => setStep("dates")}
            >
              {t("subscriptionVacation.continueDates")} →
            </Button>
          ) : null}
          {step === "dates" ? (
            <Button
              disabled={duration <= 0}
              onPress={() => {
                setVacationPause({
                  subscriptionIds: selectedIds,
                  from: pauseDate,
                  resumeOn: resumeDate,
                });
                if (selectedIds.includes("a2-cow-milk"))
                  deliveries
                    .filter(
                      (delivery) =>
                        delivery.date >= pauseDate &&
                        delivery.date < resumeDate,
                    )
                    .forEach((delivery) =>
                      setDeliveryState(delivery.id, "paused"),
                    );
                setStep("success");
              }}
            >
              {t("subscriptionVacation.confirmDays", { count: duration })}
            </Button>
          ) : null}
          {step === "success" ? (
            <Button onPress={() => router.replace("/subscriptions")}>
              {t("subscriptionVacation.backToSubscriptions")}
            </Button>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Header({ onBack, step }: { onBack: () => void; step: Step }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
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
        label={t("subscriptionVacation.back")}
        onPress={onBack}
      />
      <ThemedText variant="body" weight="semibold">
        {step === "success"
          ? t("subscriptionVacation.confirmedTitle")
          : t("subscriptionVacation.title")}
      </ThemedText>
      <ThemedText variant="body">?</ThemedText>
    </View>
  );
}

function Progress({ step }: { step: Step }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const current = step === "products" ? 1 : step === "dates" ? 2 : 3;
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <ThemedText
        variant="caption"
        weight="semibold"
        style={{ color: theme.colors.colorTextSecondary }}
      >
        {t("subscriptionVacation.step", { current })}
      </ThemedText>
      <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
        {[1, 2, 3].map((item) => (
          <View
            key={item}
            style={{
              flex: 1,
              height: theme.spacing.xs,
              borderRadius: theme.radii.pill,
              backgroundColor:
                item <= current
                  ? theme.colors.colorPrimary
                  : theme.colors.colorBorder,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function SelectProducts({
  onToggle,
  products,
  selectedIds,
}: {
  onToggle: (id: string) => void;
  products: Product[];
  selectedIds: string[];
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <View style={{ gap: theme.spacing.xs }}>
        <ThemedText variant="body" weight="semibold">
          {t("subscriptionVacation.pauseDeliveries")}
        </ThemedText>
        <ThemedText
          variant="bodySmall"
          style={{ color: theme.colors.colorTextSecondary }}
        >
          {t("subscriptionVacation.pauseDetail")}
        </ThemedText>
      </View>
      <View style={{ gap: theme.spacing.sm }}>
        {subscriptions.map((subscription) => (
          <View
            key={subscription.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.md,
              padding: theme.spacing.sm,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.colorSurface,
            }}
          >
            <Image
              source={{ uri: products.find((product) => product.id === subscription.id)?.imageUrl ?? undefined }}
              contentFit="cover"
              style={{
                width: theme.sizes.avatarLg,
                height: theme.sizes.avatarLg,
                borderRadius: theme.radii.md,
              }}
            />
            <View style={{ flex: 1 }}>
              <ThemedText variant="bodySmall" weight="semibold">
                {t(`subscriptionVacation.${subscription.nameKey}`)}
              </ThemedText>
              <ThemedText
                variant="caption"
                style={{ color: theme.colors.colorTextSecondary }}
              >
                {t(`subscriptionVacation.${subscription.detailKey}`)}
              </ThemedText>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel={t("subscriptionVacation.pauseProduct", {
                product: t(`subscriptionVacation.${subscription.nameKey}`),
              })}
              accessibilityState={{
                checked: selectedIds.includes(subscription.id),
              }}
              onPress={() => onToggle(subscription.id)}
              style={{
                width: theme.sizes.buttonHeight,
                height: theme.spacing.lg + theme.spacing.xs,
                justifyContent: "center",
                borderRadius: theme.radii.pill,
                padding: theme.spacing.xs,
                backgroundColor: selectedIds.includes(subscription.id)
                  ? theme.colors.colorPrimary
                  : theme.colors.colorBorder,
              }}
            >
              <View
                style={{
                  width: theme.spacing.md,
                  height: theme.spacing.md,
                  alignSelf: selectedIds.includes(subscription.id)
                    ? "flex-end"
                    : "flex-start",
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.colorSurface,
                }}
              />
            </Pressable>
          </View>
        ))}
      </View>
      <InfoCard />
    </>
  );
}

function SelectDates({
  activeField,
  onDateSelect,
  onFieldChange,
  pauseDate,
  resumeDate,
}: {
  activeField: DateField;
  onDateSelect: (date: string) => void;
  onFieldChange: (field: DateField) => void;
  pauseDate: string;
  resumeDate: string;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const current = new Date(`${pauseDate}T12:00:00`);
    return new Date(current.getFullYear(), current.getMonth(), 1);
  });
  const minDate = localDateKey(new Date());
  return (
    <>
      <View style={{ gap: theme.spacing.xs }}>
        <ThemedText variant="body" weight="semibold">
          {t("subscriptionVacation.selectDates")}
        </ThemedText>
        <ThemedText
          variant="bodySmall"
          style={{ color: theme.colors.colorTextSecondary }}
        >
          {t("subscriptionVacation.selectDatesDetail")}
        </ThemedText>
      </View>
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        <DateCard
          active={activeField === "pause"}
          label={t("subscriptionVacation.pauseFrom")}
          value={pauseDate}
          onPress={() => onFieldChange("pause")}
        />
        <DateCard
          active={activeField === "resume"}
          label={t("subscriptionVacation.resumeOn")}
          value={resumeDate}
          onPress={() => onFieldChange("resume")}
        />
      </View>
      <SharedCalendar
        mode="range"
        month={visibleMonth}
        onMonthChange={setVisibleMonth}
        fromDate={pauseDate}
        toDate={resumeDate}
        minDate={minDate}
        onDateSelect={onDateSelect}
        legend={[
          { color: theme.colors.colorPrimaryTint, label: t("subscriptionVacation.vacationRange") },
          { color: theme.colors.colorPrimary, label: t("subscriptionVacation.deliveriesResume", { date: resumeDate }) },
        ]}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          padding: theme.spacing.md,
          borderRadius: theme.radii.md,
          backgroundColor: theme.colors.colorPrimaryTint,
        }}
      >
        <ThemedText variant="bodySmall" weight="semibold">
          {t("subscriptionVacation.totalDuration")}
        </ThemedText>
        <ThemedText variant="bodySmall" weight="semibold">
          {t("subscriptionVacation.durationDays", { count: daysBetween(pauseDate, resumeDate) })}
        </ThemedText>
      </View>
      <InfoCard />
    </>
  );
}

function DateCard({
  active,
  label,
  onPress,
  value,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  value: string;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        flex: 1,
        gap: theme.spacing.xs,
        padding: theme.spacing.md,
        borderRadius: theme.radii.lg,
        borderWidth: active
          ? theme.borderWidths.medium
          : theme.borderWidths.hairline,
        borderColor: active
          ? theme.colors.colorPrimary
          : theme.colors.colorBorder,
        backgroundColor: theme.colors.colorSurface,
      }}
    >
      <ThemedText
        variant="caption"
        weight="semibold"
        style={{ color: theme.colors.colorTextPrimary }}
      >
        {label}
      </ThemedText>
      <ThemedText variant="bodySmall" weight="semibold">
        {new Date(`${value}T12:00:00`).toLocaleDateString(i18n.language, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </ThemedText>
      <ThemedText
        variant="caption"
        style={{ color: theme.colors.colorTextSecondary }}
      >
        {active
          ? t("subscriptionVacation.selecting")
          : t("subscriptionVacation.tapEdit")}
      </ThemedText>
    </Pressable>
  );
}

function InfoCard() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        gap: theme.spacing.xs,
        padding: theme.spacing.md,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.colorSurfaceMuted,
      }}
    >
      <ThemedText variant="bodySmall" weight="semibold">
        {t("subscriptionVacation.guaranteeTitle")}
      </ThemedText>
      <ThemedText
        variant="caption"
        style={{ color: theme.colors.colorTextSecondary }}
      >
        {t("subscriptionVacation.guaranteeDetail")}
      </ThemedText>
    </View>
  );
}

function SuccessState({
  pauseDate,
  resumeDate,
}: {
  pauseDate: string;
  resumeDate: string;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.md,
      }}
    >
      <View
        style={{
          width: theme.sizes.avatarLg * 2,
          height: theme.sizes.avatarLg * 2,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.colorPrimary,
        }}
      >
        <ThemedText
          variant="h1"
          style={{ color: theme.colors.colorTextInverse }}
        >
          ✓
        </ThemedText>
      </View>
      <ThemedText variant="h2">
        {t("subscriptionVacation.successTitle")}
      </ThemedText>
      <ThemedText
        variant="bodySmall"
        style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}
      >
        {t("subscriptionVacation.successDetail", { pauseDate, resumeDate })}
      </ThemedText>
    </View>
  );
}
