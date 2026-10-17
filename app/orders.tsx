import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip } from "../src/components/atoms/Chip";
import { RiseIn } from "../src/components/atoms/RiseIn";
import { ListSkeleton } from "../src/components/molecules/LoadingSkeletons";
import { OrderSummaryCard } from "../src/components/molecules/OrderSummaryCard";
import { PlanOrdersCard } from "../src/components/molecules/PlanOrdersCard";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { SegmentedTabs } from "../src/components/molecules/SegmentedTabs";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useMyOrders } from "../src/hooks/useOrders";
import { groupOrders, kindOf, type OrderKind } from "../src/lib/orderGroups";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";

type OrderFilter = "all" | "active" | "past";
const FILTERS: OrderFilter[] = ["all", "active", "past"];
const KINDS: OrderKind[] = ["direct", "subscription", "trial"];

/**
 * The customer's orders: what is still to come first, nearest delivery on top. A subscription or trial is one card that opens to
 * its deliveries; a direct purchase is a card of its own. Pull down to refresh: staff change an order's status in the admin.
 */
export default function OrdersScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { data: orders = [], isError, isLoading, error, refetch, isRefetching } = useMyOrders();
  const [filter, setFilter] = useState<OrderFilter>("all");
  // Direct purchase, subscription or trial; null shows every type.
  const [kind, setKind] = useState<OrderKind | null>(null);
  const shown = useMemo(
    () => groupOrders(orders.filter((order) => kind === null || kindOf(order) === kind).filter((order) => filter === "all" || (filter === "active" ? order.status === "placed" || order.status === "out_for_delivery" : order.status === "delivered" || order.status === "missed" || order.status === "cancelled"))),
    [filter, kind, orders],
  );

  const listEmpty = isLoading ? (
    <ListSkeleton count={4} rowHeight={110} />
  ) : isError ? (
    <StateMessage type="error" title={t("orders.error")} description={describeError(error)} actionLabel={t("common.retry")} onAction={() => void refetch()} />
  ) : (
    <StateMessage type="empty" title={t(orders.length === 0 ? "shop.emptyTitle" : "shop.emptyFilter")} description={orders.length === 0 ? t("shop.emptyDetail") : undefined} actionLabel={orders.length === 0 ? t("shop.shop") : undefined} onAction={orders.length === 0 ? () => router.navigate("/products") : undefined} />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={isLoading || isError ? [] : shown}
        keyExtractor={(entry) => entry.key}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} colors={[theme.colors.colorPrimary]} tintColor={theme.colors.colorPrimary} />}
        renderItem={({ item, index }) => (
          <RiseIn index={index}>
            {item.type === "plan"
              ? <PlanOrdersCard kind={item.kind} language={language} orders={item.orders} />
              : <OrderSummaryCard order={item.order} language={language} onPress={() => router.push({ pathname: "/order-tracking", params: { orderId: item.order.id } })} />}
          </RiseIn>
        )}
        contentContainerStyle={{ padding: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.xxl, gap: theme.spacing.md - 4 }}
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
