import { router } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { ZoomIn, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from "react-native-reanimated";

import { useScratchReward } from "../../hooks/useRewards";
import { GiftIcon } from "../../icons/appIcons";
import { localized } from "../../lib/contentLocalization";
import { openFromCard } from "../../lib/morph";
import { offerValueText } from "../../lib/offerText";
import { describeError } from "../../services/errorMapper";
import { useAppStore } from "../../store/useAppStore";
import { useTheme } from "../../theme";
import type { RewardCard } from "../../types/rewards";
import { AppIcon } from "../atoms/AppIcon";
import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";
import { CodeBox } from "../molecules/CodeBox";
import { ScratchCard } from "../molecules/ScratchCard";

const CARD_WIDTH = 288;
const CARD_HEIGHT = 216;

/** What is under the foil: the reward in big letters, then the code once the server has sent it. */
function RewardFace({ card, code, scale }: { card: RewardCard; code: string | null; scale: SharedValue<number> }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.xs, padding: theme.spacing.md, backgroundColor: theme.colors.colorHighlightTint }, pop]}>
      <AppIcon icon={GiftIcon} accessibilityLabel="" tone="accent" />
      <ThemedText variant="display" style={{ color: theme.colors.colorPrimary, textAlign: "center", fontSize: 26, lineHeight: 32 }}>{offerValueText(card.offer, t)}</ThemedText>
      <ThemedText variant="bodySmall" weight="semibold" numberOfLines={2} style={{ textAlign: "center" }}>{localized(card.offer.title, card.offer.titleGu, language)}</ThemedText>
      {code ? <View style={{ alignSelf: "stretch", marginTop: theme.spacing.xs }}><CodeBox code={code} compact /></View> : <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>…</ThemedText>}
    </Animated.View>
  );
}

type Props = { card: RewardCard | null; onClose: () => void; title?: string };

/**
 * The scratch card in a pop-up over the screen: "You won a scratch card!", the foil to scratch, then the code with Copy and a way
 * to the offer's page. The card is free and always holds a real reward, as the Play Store expects of rewards.
 */
export function ScratchRewardModal({ card, onClose, title }: Props) {
  if (!card) return null;
  // A fresh sheet per card, so its own state starts from that card.
  return <ScratchSheet key={card.id} card={card} onClose={onClose} title={title} />;
}

function ScratchSheet({ card, onClose, title }: { card: RewardCard; onClose: () => void; title?: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const scratch = useScratchReward();
  const [revealed, setRevealed] = useState(card.status !== "new");
  const [code, setCode] = useState<string | null>(card.offer.code);
  const face = useSharedValue(1);
  const cardBox = useRef<View>(null);
  const start = () => scratch.mutate(card.id, { onSuccess: (updated) => setCode(updated.offer.code) });
  const reveal = () => {
    setRevealed(true);
    face.set(withTiming(1.06, { duration: 140 }, () => { face.value = withSpring(1, { damping: 12, stiffness: 260 }); }));
  };
  const openOffer = () => {
    // Measured while the pop-up is still showing, so the offer page grows out of this very card.
    openFromCard(cardBox.current, `card:${card.id}`, theme.radii.lg, card.offer.imageUrl, () => { onClose(); router.push({ pathname: "/offer", params: { cardId: card.id } }); });
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("commonActions.close")} onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(31,28,24,0.62)" }]} />
      <View pointerEvents="box-none" style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: theme.spacing.lg }}>
        <Animated.View entering={ZoomIn.springify().damping(14).stiffness(220)} style={{ width: CARD_WIDTH + theme.spacing.lg * 2, alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.lg, borderRadius: theme.radii.xl, backgroundColor: theme.colors.colorSurface }}>
          <View style={{ alignItems: "center", gap: 2 }}>
            <ThemedText variant="h2" weight="extrabold" style={{ textAlign: "center" }}>{revealed ? t("rewards.youWon") : (title ?? t("rewards.wonTitle"))}</ThemedText>
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{revealed ? t("rewards.useAtCheckout") : t("rewards.wonDetail", { order: card.orderNumber })}</ThemedText>
          </View>
          <View ref={cardBox} collapsable={false}>
            <ScratchCard width={CARD_WIDTH} height={CARD_HEIGHT} revealed={card.status !== "new"} onStart={start} onReveal={reveal}>
              <RewardFace card={card} code={code} scale={face} />
            </ScratchCard>
          </View>
          {scratch.error ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger, textAlign: "center" }}>{describeError(scratch.error)}</ThemedText> : null}
          {revealed ? (
            <View style={{ alignSelf: "stretch", gap: theme.spacing.sm }}>
              <Button onPress={openOffer}>{t("rewards.viewOffer")}</Button>
              <Button variant="secondary" onPress={onClose}>{t("rewards.done")}</Button>
            </View>
          ) : (
            <Button variant="secondary" style={{ alignSelf: "stretch" }} onPress={onClose}>{t("rewards.later")}</Button>
          )}
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{t("rewards.terms")}</ThemedText>
        </Animated.View>
      </View>
    </Modal>
  );
}
