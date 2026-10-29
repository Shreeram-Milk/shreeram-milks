import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, SectionList, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip } from "../src/components/atoms/Chip";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ListSkeleton } from "../src/components/molecules/LoadingSkeletons";
import { OrderSummaryCard } from "../src/components/molecules/OrderSummaryCard";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { SegmentedTabs } from "../src/components/molecules/SegmentedTabs";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useProductImages } from "../src/hooks/useCatalog";
import { useMyOrders } from "../src/hooks/useOrders";
import { formatShortDay, indiaToday } from "../src/lib/deliveryText";
import { groupByDay, kindOf, type OrderKind } from "../src/lib/orderGroups";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";

type OrderFilter = "all" | "active" | "past";
const FILTERS: OrderFilter[] = ["all", "active", "past"];
const KINDS: OrderKind[] = ["direct", "subscription", "trial"];

/**
 * The customer's orders under one heading per delivery day (Today, Tomorrow, Yesterday, then dates): what is still to come
 * first, nearest delivery on top. Each card is short and opens the order's own page. Pull down to refresh: staff change an
 * order's status in the admin.
 */
export default function OrdersScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { data: orders = [], isError, isLoading, error, refetch, isRefetching } = useMyOrders();
  const images = useProductImages();
  const [filter, setFilter] = useState<OrderFilter>("all");
  // Direct purchase, subscription or trial; null shows every type.
  const [kind, setKind] = useState<OrderKind | null>(null);
  const today = indiaToday();
  const sections = useMemo(
    () => groupByDay(orders.filter((order) => kind === null || kindOf(order) === kind).filter((order) => filter === "all" || (filter === "active" ? order.status === "placed" || order.status === "out_for_delivery" : order.status === "delivered" || order.status === "missed" || order.status === "cancelled")), today)
      .map((day, index, days) => ({ key: day.date, date: day.date, data: day.orders, firstEarlier: day.earlier && !days[index - 1]?.earlier })),
    [filter, kind, orders, today],
  );

  const listEmpty = isLoading ? (
    <ListSkeleton count={4} rowHeight={88} />
  ) : isError ? (
    <StateMessage type="error" title={t("orders.error")} description={describeError(error)} actionLabel={t("common.retry")} onAction={() => void refetch()} />
  ) : (
    <StateMessage type="empty" title={t(orders.length === 0 ? "shop.emptyTitle" : "shop.emptyFilter")} description={orders.length === 0 ? t("shop.emptyDetail") : undefined} actionLabel={orders.length === 0 ? t("shop.shop") : undefined} onAction={orders.length === 0 ? () => router.navigate("/products") : undefined} />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <SectionList
        sections={isLoading || isError ? [] : sections}
        keyExtractor={(order) => order.id}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} colors={[theme.colors.colorPrimary]} tintColor={theme.colors.colorPrimary} />}
        renderSectionHeader={({ section }) => (
          <View>
            {section.firstEarlier ? (
              <ThemedText accessibilityRole="header" variant="body" weight="bold" style={{ paddingTop: theme.spacing.lg }}>{t("orders.earlier")}</ThemedText>
            ) : null}
            <ThemedText accessibilityRole="header" variant="overline" style={{ color: theme.colors.colorTextSecondary, textTransform: "uppercase", letterSpacing: 0.6, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm }}>
              {formatShortDay(section.date, language, t)}
            </ThemedText>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={{ paddingBottom: theme.spacing.sm }}>
            <OrderSummaryCard order={item} language={language} imageUrl={images.get(item.items[0]?.productId ?? "")} onPress={() => router.push({ pathname: "/order-tracking", params: { orderId: item.id } })} />
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.xxl }}
        ListEmptyComponent={listEmpty}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.md - 4 }}>
            <ScreenHeader backLabel={t("orders.back")} title={t("orders.title")} />
            <SegmentedTabs tabs={FILTERS.map((key) => ({ key, label: t(`shop.filter.${key}`) }))} value={filter} onChange={setFilter} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
              <Chip selected={kind === null} onPress={() => setKind(null)}>{t("orders.kindAll")}</Chip>
              {KINDS.map((item) => <Chip key={item} selected={kind === item} onPress={() => setKind(item)}>{t(`orders.kind_${item}`)}</Chip>)}
            </ScrollView>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
