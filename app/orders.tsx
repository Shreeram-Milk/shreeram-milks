import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { OrderSummaryCard } from "../src/components/molecules/OrderSummaryCard";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { SearchIcon } from "../src/icons/appIcons";
import { useOrders } from "../src/hooks/useOrders";
import { useTheme } from "../src/theme";

type OrderFilter = "all" | "active" | "delivered";

export default function OrdersScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: orders = [], isError, isLoading, refetch } = useOrders();
  const [filter, setFilter] = useState<OrderFilter>("all");
  const filteredOrders = useMemo(
    () =>
      filter === "all"
        ? orders
        : orders.filter((order) =>
            filter === "active"
              ? order.status !== "delivered"
              : order.status === "delivered",
          ),
    [filter, orders],
  );
  if (isLoading || isError)
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
      >
        <StateMessage
          type={isError ? "error" : "loading"}
          title={isError ? t("orders.error") : t("orders.loading")}
          actionLabel={isError ? t("common.retry") : undefined}
          onAction={isError ? () => refetch() : undefined}
        />
      </SafeAreaView>
    );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={filteredOrders}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => (
          <OrderSummaryCard
            order={item}
            onPress={() =>
              router.push({
                pathname: "/order-tracking",
                params: { orderId: item.id },
              })
            }
          />
        )}
        contentContainerStyle={{
          padding: theme.layout.screenHorizontalPadding,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.md,
        }}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.md }}>
            <ScreenHeader backLabel={t("orders.back")} title={t("orders.title")}
              trailing={
              <AppIcon
                icon={SearchIcon}
                accessibilityLabel={t("orders.search")}
                tone="secondary"
              />
              }
            />
            <View
              style={{
                padding: theme.spacing.sm,
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.colorInfoTint,
              }}
            >
              <ThemedText
                variant="caption"
                style={{ color: theme.colors.colorInfo }}
              >
                ● {t("orders.arrival")}
              </ThemedText>
            </View>
            <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
              {(["all", "active", "delivered"] as OrderFilter[]).map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="tab"
                  accessibilityLabel={t(`orders.${item}`)}
                  accessibilityState={{ selected: filter === item }}
                  onPress={() => setFilter(item)}
                  style={{
                    minHeight: theme.layout.touchTargetMin,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radii.pill,
                    backgroundColor:
                      filter === item
                        ? theme.colors.colorPrimary
                        : theme.colors.colorSurfaceMuted,
                  }}
                >
                  <ThemedText
                    variant="caption"
                    weight="semibold"
                    style={{
                      color:
                        filter === item
                          ? theme.colors.colorTextInverse
                          : theme.colors.colorTextPrimary,
                    }}
                  >
                    {t(`orders.${item}`)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <ThemedText
              variant="caption"
              weight="bold"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {t("orders.current")}
            </ThemedText>
          </View>
        }
      />
    </SafeAreaView>
  );
}
