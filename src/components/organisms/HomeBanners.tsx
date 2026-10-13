import { Image } from "expo-image";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";

import { localized } from "../../lib/contentLocalization";
import { useTheme } from "../../theme";
import type { BannerContent, BannerType } from "../../types/content";
import type { AppLanguage } from "../../types/models";
import { ThemedText } from "../atoms/ThemedText";
import { PageDots } from "../molecules/PageDots";

const BANNER_HEIGHT = 146;
const NOTICE_ORDER: readonly BannerType[] = ["warning", "maintenance", "informational"];

type Props = { banners: BannerContent[] | undefined; isLoading: boolean; language: AppLanguage };

/**
 * The home screen's banner area. Promotions slide sideways as a slideshow. Warnings, maintenance and information
 * show above it as short notices: plain text, with an optional small icon on the last two.
 */
export function HomeBanners({ banners, isLoading, language }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  // The slideshow follows the finger with a visible gap between slides; the dots read the same scroll position.
  const gap = theme.spacing.sm;
  const step = width + gap;
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => { scrollX.value = event.contentOffset.x; });
  const renderSeparator = useCallback(() => <View style={{ width: gap }} />, [gap]);

  if (isLoading) {
    return <View accessibilityLabel={t("home.loading")} style={{ height: BANNER_HEIGHT, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface }} />;
  }
  const promotions = (banners ?? []).filter((item) => item.type === "promotion");
  const notices = NOTICE_ORDER.flatMap((type) => (banners ?? []).filter((item) => item.type === type));
  if (promotions.length === 0 && notices.length === 0) return null;

  const noticeStyle = (type: BannerType) =>
    type === "warning"
      ? { backgroundColor: theme.colors.colorWarningTint, borderColor: theme.colors.colorWarning }
      : type === "maintenance"
        ? { backgroundColor: theme.colors.colorDangerTint, borderColor: theme.colors.colorDanger }
        : { backgroundColor: theme.colors.colorInfoTint, borderColor: theme.colors.colorInfo };
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const onSlideEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (step > gap) setIndex(Math.round(event.nativeEvent.contentOffset.x / step));
  };

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {notices.map((notice) => {
        const message = localized(notice.messageEn, notice.messageGu, language);
        return (
          <View
            key={notice.id}
            accessibilityRole="alert"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
              borderRadius: theme.radii.lg,
              borderWidth: theme.borderWidths.hairline,
              padding: theme.spacing.md,
              ...noticeStyle(notice.type),
            }}
          >
            {notice.imageUrl ? <Image source={{ uri: notice.imageUrl }} contentFit="contain" accessibilityLabel="" style={{ width: 28, height: 28 }} /> : null}
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <ThemedText variant="bodySmall" weight="semibold" style={{ color: theme.colors.colorTextPrimary }}>
                {localized(notice.titleEn, notice.titleGu, language)}
              </ThemedText>
              {message ? (
                <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>
                  {message}
                </ThemedText>
              ) : null}
            </View>
          </View>
        );
      })}
      {promotions.length > 0 ? (
        <View onLayout={onLayout} style={{ gap: theme.spacing.xs }}>
          {width > 0 ? (
            <Animated.FlatList
              data={promotions}
              horizontal
              // The slideshow sits inside the home screen's vertical list. These let a sideways swipe win on Android.
              nestedScrollEnabled
              snapToInterval={step}
              snapToAlignment="start"
              onScroll={onScroll}
              scrollEventThrottle={16}
              ItemSeparatorComponent={renderSeparator}
              decelerationRate="fast"
              disableIntervalMomentum
              scrollEnabled={promotions.length > 1}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              onMomentumScrollEnd={onSlideEnd}
              getItemLayout={(_, position) => ({ length: width, offset: step * position, index: position })}
              renderItem={({ item }) => {
                const label = localized(item.labelEn, item.labelGu, language);
                const message = localized(item.messageEn, item.messageGu, language);
                return (
                  <View style={{ width, height: BANNER_HEIGHT, overflow: "hidden", borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorPrimary }}>
                    <Image
                      source={item.imageUrl ? { uri: item.imageUrl } : require("../../../assets/onboarding-milk-hero.png")}
                      contentFit="cover"
                      transition={theme.motion.duration.normal}
                      style={{ width: "100%", height: "100%" }}
                    />
                    <View pointerEvents="none" style={{ position: "absolute", inset: 0, backgroundColor: theme.colors.colorOverlay, opacity: 0.48 }} />
                    <View pointerEvents="none" style={{ position: "absolute", inset: 0, justifyContent: "flex-end", padding: theme.spacing.md, gap: theme.spacing.xs }}>
                      {label ? (
                        <View style={{ alignSelf: "flex-start", borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, backgroundColor: theme.colors.colorSurface }}>
                          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorPrimary }}>
                            {label}
                          </ThemedText>
                        </View>
                      ) : null}
                      <ThemedText variant="h2" numberOfLines={2} style={{ color: theme.colors.colorTextInverse, flexShrink: 1, fontSize: 18, lineHeight: 24 }}>
                        {localized(item.titleEn, item.titleGu, language)}
                      </ThemedText>
                      {message ? (
                        <ThemedText variant="bodySmall" numberOfLines={2} style={{ color: theme.colors.colorTextInverse, flexShrink: 1 }}>
                          {message}
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                );
              }}
            />
          ) : (
            <View style={{ height: BANNER_HEIGHT }} />
          )}
          <PageDots count={promotions.length} scrollX={scrollX} step={width > 0 ? step : 0} accessibilityLabel={t("home.bannerPosition", { current: index + 1, total: promotions.length })} />
        </View>
      ) : null}
    </View>
  );
}
