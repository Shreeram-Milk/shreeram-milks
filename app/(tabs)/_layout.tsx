import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { BottomNavigation, type BottomNavigationItem } from "../../src/components/organisms/BottomNavigation";
import { useAddresses } from "../../src/hooks/useAddresses";
import { useFeatureFlags } from "../../src/hooks/useContent";
import { useMyOrders } from "../../src/hooks/useOrders";
import { useSavedDeliveryPin } from "../../src/hooks/useSavedDeliveryPin";
import { useMySubscriptions } from "../../src/hooks/useSubscriptions";
import { CalendarIcon, CartIcon, HomeIcon, ProductsIcon, ProfileIcon } from "../../src/icons/appIcons";

/**
 * The five main screens live in real tabs: all are prepared when the app opens (not on first visit), so switching is instant with no
 * loading placeholders, repeats no requests, and Back leaves the app instead of walking through old tabs.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { showSubscriptions } = useFeatureFlags();
  // Start loading the customer's own lists now, so Orders and Plans open with their content instead of placeholders.
  useMyOrders();
  useMySubscriptions();
  useAddresses();
  useSavedDeliveryPin();
  const items: BottomNavigationItem[] = [
    { key: "home", label: t("navigation.home"), icon: HomeIcon },
    { key: "products", label: t("navigation.products"), icon: ProductsIcon },
    { key: "subscriptions", label: t("navigation.subscriptions"), icon: CalendarIcon },
    { key: "cart", label: t("navigation.cart"), icon: CartIcon },
    { key: "profile", label: t("navigation.profile"), icon: ProfileIcon },
  ].filter((item) => item.key !== "subscriptions" || showSubscriptions);

  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: "fade", freezeOnBlur: true, lazy: false }}
      tabBar={({ state, navigation }) => {
        const activeKey = state.routes[state.index]?.name ?? "home";
        return (
          <BottomNavigation
            activeKey={activeKey}
            items={items}
            onChange={(key) => {
              const route = state.routes.find((entry) => entry.name === key);
              if (!route) return;
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (activeKey !== key && !event.defaultPrevented) navigation.navigate(key);
            }}
          />
        );
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="products" />
      <Tabs.Screen name="subscriptions" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
