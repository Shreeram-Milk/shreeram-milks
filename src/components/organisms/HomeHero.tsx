import { Image } from "expo-image";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { localized } from "../../lib/contentLocalization";
import { LocationIcon, SearchIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";
import type { BannerContent } from "../../types/content";
import type { AppLanguage } from "../../types/models";
import { AppIcon } from "../atoms/AppIcon";
import { IconButton } from "../atoms/IconButton";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";
import { CurvedHero } from "../molecules/CurvedHero";
import { NotificationBell } from "../molecules/NotificationBell";

/** The banner is a rounded card inside the page margins, about two-thirds as tall as it is wide. */
const BANNER_HEIGHT_RATIO = 0.62;
const HEADER_LOGO_SIZE = 36;
const AUTO_SLIDE_MS = 5000;
const LOCATION_LABEL_HOLD_MS = 2000;

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

type Props = { locationPin: string; locationCity?: string; locationText: string; children?: React.ReactNode };

function HomeLocationLabel({ pin, city }: { pin: string; city?: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const rowHeight = Math.ceil(theme.sizes.iconMd * fontScale);
  const shouldSlide = Boolean(pin && city) && !reduceMotion;
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -rowHeight * progress.get() }] }));

  useFocusEffect(useCallback(() => {
    if (!pin || !city || reduceMotion) return;
    progress.set(0);
    const slide = {
      duration: theme.motion.duration.slow,
      easing: Easing.bezier(...theme.motion.easing.standard),
      reduceMotion: ReduceMotion.System,
    };
    progress.set(withRepeat(
      withSequence(
        withDelay(LOCATION_LABEL_HOLD_MS, withTiming(1, slide), ReduceMotion.System),
        withDelay(LOCATION_LABEL_HOLD_MS, withTiming(2, slide), ReduceMotion.System),
        // The last row matches the first, so resetting the offset is invisible.
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.System,
    ));
    return () => {
      cancelAnimation(progress);
      progress.set(0);
    };
  }, [city, pin, progress, reduceMotion, theme.motion]));

  if (!shouldSlide) {
    return <ThemedText variant="caption" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>{city || pin || t("home.deliveryLocation")}</ThemedText>;
  }

  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ flex: 1, height: rowHeight, overflow: "hidden" }}>
      <Animated.View style={slideStyle}>
        {[{ key: "pin", label: pin }, { key: "city", label: city }, { key: "repeat-pin", label: pin }].map(({ key, label }) => (
          <View key={key} style={{ height: rowHeight, justifyContent: "center" }}>
            <ThemedText variant="caption" weight="semibold" numberOfLines={1}>{label}</ThemedText>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

/**
 * The compact Home controls sit above the promotion carousel, leaving the banner artwork clear.
 */
export function HomeHero({ locationPin, locationCity, locationText, children }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: theme.sizes.buttonHeight, paddingHorizontal: theme.layout.screenHorizontalPadding, backgroundColor: theme.colors.colorBackground }}>
        <View style={{ flex: 1, alignItems: "flex-start", paddingRight: theme.spacing.xs }}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`${t("home.deliveryLocation")}: ${locationText}`}
            onPress={() => router.push("/delivery-addresses")}
            style={{ width: "100%", minHeight: theme.layout.touchTargetMin, flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}
          >
            <AppIcon icon={LocationIcon} accessibilityLabel="" size="sm" tone="accent" />
            <HomeLocationLabel pin={locationPin} city={locationCity} />
          </PressableScale>
        </View>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={t("common.appName")}
          pointerEvents="none"
          style={{
            width: HEADER_LOGO_SIZE,
            height: HEADER_LOGO_SIZE,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: theme.radii.pill,
            overflow: "hidden",
            // The logo always sits on the brand orange.
            backgroundColor: theme.colors.colorBrand,
          }}
        >
          {/* The existing foreground has transparent padding for Android's adaptive icon. */}
          <Image
            source={require("../../../assets/android-icon-monochrome.png")}
            contentFit="contain"
            style={{ width: theme.sizes.avatarLg, height: theme.sizes.avatarLg, transform: [{ translateY: theme.spacing.xs }] }}
          />
        </View>
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end" }}>
          <IconButton icon={SearchIcon} label={t("search.title")} onPress={() => router.push("/search")} />
          <NotificationBell />
        </View>
      </View>
      {children}
    </View>
  );
}

/**
 * The admin's promotions as a rounded card inside the page margins. It moves to the next one every few seconds until the
 * customer swipes it themselves. Shows nothing when there are no promotions.
 */
export function PromotionCarousel({ promotions, language }: { promotions: BannerContent[]; language: AppLanguage }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<BannerContent>>(null);
  const touched = useRef(false);
  const count = promotions.length;
  const cardWidth = width - theme.layout.screenHorizontalPadding * 2;
  const heroHeight = Math.round(cardWidth * BANNER_HEIGHT_RATIO);

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
    <View>
      {count > 0 ? (
        <View style={{ height: heroHeight, marginTop: theme.spacing.sm }}>
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
                <Pressable accessibilityRole={link ? "button" : "image"} accessibilityLabel={title} disabled={!link} onPress={() => { if (link) router.push(link); }} style={{ width, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
                  <View style={{ overflow: "hidden", borderRadius: theme.radii.xl, backgroundColor: theme.colors.colorSurfaceTile }}>
                  <CurvedHero
                    imageUrl={item.imageUrl}
                    width={cardWidth}
                    height={heroHeight}
                    showText={item.showText}
                    label={localized(item.labelEn, item.labelGu, language)}
                    title={title}
                    message={localized(item.messageEn, item.messageGu, language)}
                    bottomSpace={count > 1 ? 14 : 0}
                  />
                  </View>
                </Pressable>
              );
            }}
          />
          {count > 1 ? (
            <View pointerEvents="none" accessibilityLabel={t("home.bannerPosition", { current: index + 1, total: count })} style={{ position: "absolute", bottom: theme.spacing.sm + 2, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 5 }}>
              {promotions.map((item, position) => (
                <View key={item.id} style={{ width: position === index ? 18 : 6, height: 6, borderRadius: theme.radii.pill, backgroundColor: position === index ? theme.colors.colorTextInverse : "rgba(255,255,255,0.55)" }} />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
