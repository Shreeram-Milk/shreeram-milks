import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StatusBar, View, type FlatList, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/atoms/Button';
import { ThemedText } from '../src/components/atoms/ThemedText';
import { LanguageChip } from '../src/components/molecules/LanguageChip';
import { PageDots } from '../src/components/molecules/PageDots';
import { useOnboardingSlides } from '../src/hooks/useContent';
import { localized } from '../src/lib/contentLocalization';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme';
import type { OnboardingSlide } from '../src/types/content';
import { remoteImage } from '../src/lib/remoteImage';

export default function OnboardingScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { data: remoteSlides } = useOnboardingSlides();
  const list = useRef<FlatList<OnboardingSlide>>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  // A visible gap between slides while swiping; the dots read the same scroll position.
  const gap = theme.spacing.lg;
  const step = width + gap;
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => { scrollX.value = event.contentOffset.x; });
  const renderSeparator = useCallback(() => <View style={{ width: gap }} />, [gap]);

  // The admin's slides when there are any; otherwise the built-in introduction, so the screen is never empty.
  const slides: OnboardingSlide[] = remoteSlides?.length
    ? remoteSlides
    : [{ id: 'built-in', imageUrl: null, titleEn: t('onboarding.title'), titleGu: '', descriptionEn: t('onboarding.description'), descriptionGu: '', sortOrder: 1 }];
  const isLast = index >= slides.length - 1;

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const onSlideEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (step > gap) setIndex(Math.round(event.nativeEvent.contentOffset.x / step));
  };
  const next = () => {
    if (isLast) { router.push('/sign-in'); return; }
    list.current?.scrollToIndex({ index: index + 1, animated: true });
    setIndex(index + 1);
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
    <StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}>
      <View style={{ minHeight: theme.sizes.buttonHeight + theme.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}><Image source={require('../assets/icon.png')} contentFit="contain" accessibilityLabel={t('onboarding.logo')} style={{ width: theme.sizes.avatarSm, height: theme.sizes.avatarSm }} /><ThemedText variant="bodySmall" weight="semibold" numberOfLines={1} style={{ flexShrink: 1 }}>{t('common.appName')}</ThemedText></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <LanguageChip />
          {/* A quiet text action, not a button: it skips the remaining slides to sign-in, and disappears on the last slide where "Get Started" takes over. */}
          {isLast ? null : <Pressable accessibilityRole="button" onPress={() => router.push('/sign-in')} hitSlop={theme.spacing.sm} style={{ minHeight: theme.layout.touchTargetMin, justifyContent: 'center', paddingHorizontal: theme.spacing.xs }}>
            <ThemedText variant="bodySmall" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{t('onboarding.skip')}</ThemedText>
          </Pressable>}
        </View>
      </View>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        {width > 0 ? <Animated.FlatList
          ref={list}
          data={slides}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          snapToInterval={step}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          nestedScrollEnabled
          onScroll={onScroll}
          scrollEventThrottle={16}
          ItemSeparatorComponent={renderSeparator}
          onMomentumScrollEnd={onSlideEnd}
          getItemLayout={(_, position) => ({ length: width, offset: step * position, index: position })}
          renderItem={({ item }) => <View style={{ width }}>
            <Image source={item.imageUrl ? remoteImage(item.imageUrl) : require('../assets/onboarding-milk-hero.png')} contentFit="cover" accessibilityLabel={t('onboarding.heroLabel')} style={{ height: 264, marginTop: theme.spacing.sm, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurfaceMuted }} />
            <View style={{ paddingTop: theme.spacing.lg, gap: theme.spacing.md }}>
              <ThemedText variant="h1" weight="extrabold">{localized(item.titleEn, item.titleGu, language)}</ThemedText>
              <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{localized(item.descriptionEn, item.descriptionGu, language)}</ThemedText>
            </View>
          </View>}
        /> : null}
      </View>
      <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
        <PageDots count={slides.length} scrollX={scrollX} step={width > 0 ? step : 0} accessibilityLabel={t('onboarding.slidePosition', { current: index + 1, total: slides.length })} />
        <Button onPress={next}>{isLast ? t('onboarding.getStarted') : t('onboarding.next')}</Button>
      </View>
    </View>
  </SafeAreaView>;
}
