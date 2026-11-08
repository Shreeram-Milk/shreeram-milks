import { router, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { localized } from "../../lib/contentLocalization";
import { LocationIcon, SearchIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";
import type { BannerContent } from "../../types/content";
import type { AppLanguage } from "../../types/models";
import { AppIcon } from "../atoms/AppIcon";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";
import { CurvedHero } from "../molecules/CurvedHero";
import { NotificationBell } from "../molecules/NotificationBell";

const CURVE = 28;
const AUTO_SLIDE_MS = 5000;

/** Where a promotion leads. A banner with no link does nothing; the server already checked the target exists. */
export function bannerLink(banner: Pick<BannerContent, "ctaType" | "ctaTarget">): Href | null {
  switch (banner.ctaType) {
    case "offers": return "/offers";
    case "offer": return banner.ctaTarget ? { pathname: "/offer", params: { offerId: banner.ctaTarget } } : null;
    case "product": return banner.ctaTarget ? { pathname: "/product-details", params: { productId: banner.ctaTarget } } : null;
    case "category": return "/products";
    case "subscriptions": case "trials": return "/subscriptions";
    case "orders": return "/orders";
    case "rewards": return "/rewards";
    default: return null;
  }
}

type Props = { promotions: BannerContent[]; language: AppLanguage; locationText: string };

/**
 * The top of Home: a big picture banner, about half the screen, with curved bottom corners. Several promotions slide sideways
 * (and move on by themselves every few seconds until touched). Delivery place, the bell and search sit on top of it.
 * With no promotion it shrinks to a warm header holding just those three.
 */
export function HomeHero({ promotions, language, locationText }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height: screenHeight } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<BannerContent>>(null);
  const touched = useRef(false);
  const count = promotions.length;
  const heroHeight = count > 0 ? Math.round(Math.min(Math.max(width * 1.02, 360), screenHeight * 0.54)) : insets.top + 132;

  // Moves to the next promotion every few seconds, until the customer swipes it themselves.
  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      if (touched.current) return;
      setIndex((current) => {
        const next = (current + 1) % count;
        list.current?.scrollToOffset({ offset: next * width, animated: true });
        return next;
      });
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [count, width]);

  const onSlideEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  }, [width]);

  return (
    <View style={{ height: heroHeight, overflow: "hidden", borderBottomLeftRadius: CURVE, borderBottomRightRadius: CURVE, backgroundColor: theme.colors.colorPrimaryTint }}>
      {count > 0 ? (
        <FlatList
          ref={list}
          data={promotions}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onScrollBeginDrag={() => { touched.current = true; }}
          onMomentumScrollEnd={onSlideEnd}
          getItemLayout={(_, position) => ({ length: width, offset: width * position, index: position })}
          renderItem={({ item }) => {
            const link = bannerLink(item);
            const title = localized(item.titleEn, item.titleGu, language);
            return (
              <Pressable accessibilityRole={link ? "button" : "image"} accessibilityLabel={title} disabled={!link} onPress={() => { if (link) router.push(link); }}>
                <CurvedHero
                  imageUrl={item.imageUrl}
                  width={width}
                  height={heroHeight}
                  showText={item.showText}
                  label={localized(item.labelEn, item.labelGu, language)}
                  title={title}
                  message={localized(item.messageEn, item.messageGu, language)}
                  bottomSpace={count > 1 ? 14 : 0}
                />
              </Pressable>
            );
          }}
        />
      ) : null}

      <View pointerEvents="box-none" style={{ position: "absolute", top: 0, left: 0, right: 0, gap: theme.spacing.sm + 2, paddingTop: insets.top + theme.spacing.sm, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <View style={{ flex: 1, alignItems: "flex-start" }}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`${t("home.deliveryLocation")}: ${locationText}`}
              onPress={() => router.push("/delivery-addresses")}
              style={{ maxWidth: width - theme.layout.screenHorizontalPadding * 2 - 56, flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, minHeight: 36, paddingHorizontal: theme.spacing.sm + 2, borderRadius: theme.radii.pill, backgroundColor: "rgba(255,255,255,0.94)" }}
            >
              <AppIcon icon={LocationIcon} accessibilityLabel="" size="sm" tone="accent" />
              <ThemedText variant="caption" weight="semibold" numberOfLines={1} style={{ flexShrink: 1 }}>{locationText}</ThemedText>
            </PressableScale>
          </View>
          <View style={{ flex: 0 }}><NotificationBell /></View>
        </View>
        <PressableScale
          accessibilityRole="search"
          accessibilityLabel={t("search.placeholder")}
          onPress={() => router.push("/search")}
          style={{ minHeight: 48, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurface, ...theme.elevation.card }}
        >
          <AppIcon icon={SearchIcon} accessibilityLabel="" size="sm" tone="secondary" />
          <ThemedText variant="bodySmall" style={{ flex: 1, color: theme.colors.colorTextSecondary }} numberOfLines={1}>{t("search.placeholder")}</ThemedText>
        </PressableScale>
      </View>

      {count > 1 ? (
        <View pointerEvents="none" accessibilityLabel={t("home.bannerPosition", { current: index + 1, total: count })} style={{ position: "absolute", bottom: theme.spacing.sm + 2, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 5 }}>
          {promotions.map((item, position) => (
            <View key={item.id} style={{ width: position === index ? 18 : 6, height: 6, borderRadius: theme.radii.pill, backgroundColor: position === index ? theme.colors.colorTextInverse : "rgba(255,255,255,0.55)" }} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
