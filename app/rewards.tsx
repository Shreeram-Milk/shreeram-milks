import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StatusBar, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { PressableScale } from "../src/components/atoms/PressableScale";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { ScratchRewardModal } from "../src/components/organisms/ScratchRewardModal";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useMyRewards } from "../src/hooks/useRewards";
import { GiftIcon } from "../src/icons/appIcons";
import { localized } from "../src/lib/contentLocalization";
import { openFromCard } from "../src/lib/morph";
import { formatOfferDay, offerValueText } from "../src/lib/offerText";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { RewardCard } from "../src/types/rewards";

/** One card in the grid: foil until scratched, then the reward; used and expired cards are greyed. */
function RewardTile({ card, size, onPress }: { card: RewardCard; size: number; onPress: (card: RewardCard, view: View | null) => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const box = useRef<View>(null);
  const closed = card.status === "used" || card.status === "expired";
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={card.status === "new" ? t("rewards.scratchHere") : offerValueText(card.offer, t)} onPress={() => onPress(card, box.current)} style={{ width: size }}>
      <View ref={box} collapsable={false} style={{ width: size, height: size, overflow: "hidden", borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: closed ? theme.colors.colorSurfaceMuted : theme.colors.colorHighlightTint }}>
        {card.status === "new" ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.xs }}>
            <Svg width={size} height={size} style={{ position: "absolute" }}>
              <Defs>
                <LinearGradient id={`tile-${card.id}`} x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#F07811" />
                  <Stop offset="1" stopColor="#F2B33D" />
                </LinearGradient>
              </Defs>
              <Rect width={size} height={size} fill={`url(#tile-${card.id})`} />
            </Svg>
            {/* Drawn after the foil and lifted above it, so the gift and words always show on top. */}
            <View style={{ zIndex: 1, alignItems: "center", gap: theme.spacing.xs }}>
              <AppIcon icon={GiftIcon} accessibilityLabel="" tone="onPrimary" />
              <ThemedText variant="bodySmall" weight="extrabold" style={{ color: theme.colors.colorTextInverse }}>{t("rewards.tapToScratch")}</ThemedText>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.xs, padding: theme.spacing.md, opacity: closed ? 0.6 : 1 }}>
            <ThemedText variant="h2" weight="extrabold" numberOfLines={2} style={{ color: closed ? theme.colors.colorTextSecondary : theme.colors.colorPrimary }}>{offerValueText(card.offer, t)}</ThemedText>
            <ThemedText variant="caption" numberOfLines={2}>{localized(card.offer.title, card.offer.titleGu, language)}</ThemedText>
            {card.offer.code && !closed ? <ThemedText variant="caption" weight="bold" style={{ color: theme.colors.colorPrimary, letterSpacing: 1 }}>{card.offer.code}</ThemedText> : null}
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>
              {card.status === "used" ? t("rewards.used") : card.status === "expired" ? t("rewards.expired") : t("rewards.expires", { date: formatOfferDay(card.expiresAt, language) })}
            </ThemedText>
          </View>
        )}
      </View>
    </PressableScale>
  );
}

/** Scratch cards: every free card won with a delivered order. A new one opens to be scratched; a scratched one opens its offer page. */
export default function RewardsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { cardId } = useLocalSearchParams<{ cardId?: string }>();
  const { data: cards = [], isLoading, isError, error, isRefetching, refetch } = useMyRewards();
  const [scratching, setScratching] = useState<RewardCard | null>(null);
  // Opened from the "You won a scratch card" message: that card opens straight away, once.
  const [autoClosed, setAutoClosed] = useState(false);
  const autoCard = !autoClosed && cardId ? cards.find((item) => item.id === cardId && item.status === "new") ?? null : null;
  const gap = theme.spacing.md - 4;
  const size = Math.floor((Math.min(width, theme.layout.contentMaxWidth) - theme.layout.screenHorizontalPadding * 2 - gap) / 2);

  const open = (card: RewardCard, view: View | null) => {
    if (card.status === "new") { setScratching(card); return; }
    openFromCard(view, `card:${card.id}`, theme.radii.lg, card.offer.imageUrl, () => router.push({ pathname: "/offer", params: { cardId: card.id } }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={t("rewards.title")} />
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap }}
          contentContainerStyle={{ gap, paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xxl }}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          ListHeaderComponent={<ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary, paddingBottom: theme.spacing.xs }}>{t("rewards.subtitle")}</ThemedText>}
          ListEmptyComponent={
            isLoading ? <StateMessage type="loading" title={t("rewards.loading")} />
              : isError ? <StateMessage type="error" title={t("rewards.loadError")} description={describeError(error)} actionLabel={t("common.retry")} onAction={() => void refetch()} />
                : <StateMessage type="empty" title={t("rewards.emptyTitle")} description={t("rewards.empty")} />
          }
          renderItem={({ item }) => <RewardTile card={item} size={size} onPress={open} />}
        />
      </View>
      <ScratchRewardModal card={scratching ?? autoCard} title={t("rewards.scratchTitle")} onClose={() => { setScratching(null); setAutoClosed(true); }} />
    </SafeAreaView>
  );
}
