import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, SectionList, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip } from "../src/components/atoms/Chip";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ListSkeleton } from "../src/components/molecules/LoadingSkeletons";
import { OrderSummaryCard } from "../src/components/molecules/OrderSummaryCard";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { SubscriptionBottomSheet } from "../src/components/organisms/SubscriptionBottomSheet";
import { useProductImages } from "../src/hooks/useCatalog";
import { useMyOrders } from "../src/hooks/useOrders";
import { formatShortDay } from "../src/lib/deliveryText";
import { groupByDay, kindOf, shownStatus, type OrderKind } from "../src/lib/orderGroups";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";

type OrderFilter = "all" | "active" | "past" | "overdue" | "cancelled";
const FILTERS: OrderFilter[] = ["all", "active", "overdue", "past", "cancelled"];
const KINDS: OrderKind[] = ["direct", "subscription", "trial"];

export default function OrdersScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { data: orders = [], isError, isLoading, error, refetch, isRefetching } = useMyOrders();
  const images = useProductImages();
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [kind, setKind] = useState<OrderKind | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const now = new Date();
  const filterLabel = (value: OrderFilter) => t(value === "all" ? "orders.currentAndPast" : value === "overdue" || value === "cancelled" ? `shop.status.${value}` : `shop.filter.${value}`);
  const visible = orders.filter((order) => {
    if (kind !== null && kindOf(order) !== kind) return false;
    if (filter === "cancelled") return order.status === "cancelled";
    if (order.status === "cancelled") return false;
    if (filter === "overdue") return shownStatus(order, now) === "overdue";
    if (filter === "active") return order.status === "placed" || order.status === "out_for_delivery";
    if (filter === "past") return order.status === "delivered" || order.status === "missed";
    return true;
  });
  const sections = groupByDay(visible).map(({ date, orders: data }) => ({ key: date, date, data }));

  const listEmpty = isLoading ? (
    <ListSkeleton count={4} rowHeight={144} />
  ) : isError ? (
    <StateMessage type="error" title={t("orders.error")} description={describeError(error)} actionLabel={t("common.retry")} onAction={() => void refetch()} />
  ) : (
    <StateMessage type="empty" title={t(orders.length === 0 ? "shop.emptyTitle" : "shop.emptyFilter")} description={orders.length === 0 ? t("shop.emptyDetail") : undefined} actionLabel={orders.length === 0 ? t("shop.shop") : undefined} onAction={orders.length === 0 ? () => router.navigate("/products") : undefined} />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorOrderHistoryBackground }}>
      <StatusBar barStyle="dark-content" />
      <SectionList
        sections={isLoading || isError ? [] : sections}
        keyExtractor={(order) => order.id}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} colors={[theme.colors.colorPrimary]} tintColor={theme.colors.colorPrimary} />}
        renderSectionHeader={({ section }) => (
            <ThemedText accessibilityRole="header" variant="overline" style={{ color: theme.colors.colorTextSecondary, textTransform: "uppercase", letterSpacing: 0.6, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm }}>
              {formatShortDay(section.date, language, t)}
            </ThemedText>
        )}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
        renderItem={({ item }) => (
          <OrderSummaryCard order={item} language={language} imageUrl={images.get(item.items[0]?.productId ?? "")} onPress={() => router.push({ pathname: "/order-tracking", params: { orderId: item.id } })} />
        )}
        contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.xxl }}
        ListEmptyComponent={listEmpty}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.md - 4 }}>
            <ScreenHeader backLabel={t("orders.back")} title={t("orders.title")} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm }}>
              <ThemedText variant="caption" style={{ flex: 1, color: theme.colors.colorTextSecondary }}>
                {filterLabel(filter)}{kind ? ` · ${t(`orders.kind_${kind}`)}` : ""}
              </ThemedText>
              <Button compact variant="secondary" onPress={() => setFilterOpen(true)}>{t("orders.filterTitle")} ▾</Button>
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
      <SubscriptionBottomSheet visible={filterOpen} onClose={() => setFilterOpen(false)}>
        <View style={{ gap: theme.spacing.md }}>
          <ThemedText variant="h2">{t("orders.filterTitle")}</ThemedText>
          <ThemedText variant="label" weight="bold">{t("orders.filterStatus")}</ThemedText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            {FILTERS.map((value) => <Chip key={value} selected={filter === value} onPress={() => setFilter(value)}>{filterLabel(value)}</Chip>)}
          </View>
          <ThemedText variant="label" weight="bold">{t("orders.filterType")}</ThemedText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            <Chip selected={kind === null} onPress={() => setKind(null)}>{t("orders.kindAll")}</Chip>
            {KINDS.map((item) => <Chip key={item} selected={kind === item} onPress={() => setKind(item)}>{t(`orders.kind_${item}`)}</Chip>)}
          </View>
          <Button onPress={() => setFilterOpen(false)}>{t("orders.showOrders")}</Button>
        </View>
      </SubscriptionBottomSheet>
    </SafeAreaView>
  );
}
