import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "../src/components/atoms/Button";
import { IconButton } from "../src/components/atoms/IconButton";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { CodeBox } from "../src/components/molecules/CodeBox";
import { CurvedHero } from "../src/components/molecules/CurvedHero";
import { MorphPage } from "../src/components/organisms/MorphPage";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useOffer } from "../src/hooks/useContent";
import { useMyRewards } from "../src/hooks/useRewards";
import { BackIcon } from "../src/icons/appIcons";
import { formatRupees } from "../src/lib/catalogCart";
import { localized } from "../src/lib/contentLocalization";
import { formatOfferDay, offerValueText, offerWorksForText } from "../src/lib/offerText";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { Offer } from "../src/types/offers";
import type { RewardCard } from "../src/types/rewards";

const CURVE = 28;
/** The offer picture's height: nearly square, never more than about half the screen. Shared with the opening animation. */
const offerHeroHeight = (width: number, height: number) => Math.round(Math.min(Math.max(width * 0.92, 320), height * 0.48));
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

type Shown = { offer: Pick<Offer, "title" | "titleGu" | "description" | "descriptionGu" | "kind" | "percent" | "flatPaise" | "maxDiscountPaise" | "minOrderPaise" | "endsOn" | "code" | "imageUrl" | "showText" | "points"> & Partial<Pick<Offer, "appliesOneTime" | "appliesTrial" | "appliesSubscription" | "minPlanDays">>; card: RewardCard | null };

function OfferBody({ shown }: { shown: Shown }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const language = useAppStore((state) => state.language);
  const { offer, card } = shown;
  const title = localized(offer.title, offer.titleGu, language);
  const description = localized(offer.description, offer.descriptionGu, language);
  const heroHeight = offerHeroHeight(width, height);
  const facts = [
    offer.minOrderPaise > 0 ? t("offers.orderAbove", { amount: formatRupees(offer.minOrderPaise) }) : null,
    offer.appliesOneTime !== undefined ? `${t("offers.worksFor")}: ${offerWorksForText({ appliesOneTime: offer.appliesOneTime, appliesTrial: offer.appliesTrial ?? false, appliesSubscription: offer.appliesSubscription ?? false, minPlanDays: offer.minPlanDays ?? null }, t)}` : t("rewards.oneTimeOnly"),
    card ? t("rewards.expires", { date: formatOfferDay(card.expiresAt, language) }) : offer.endsOn ? t("offers.validUntil", { date: formatOfferDay(offer.endsOn, language) }) : null,
    card ? t("rewards.oncePerCard") : null,
  ].filter((fact): fact is string => Boolean(fact));
  const points = offer.points.map((point) => localized(point.en, point.gu, language)).filter(Boolean);
  const closed = card?.status === "used" || card?.status === "expired";

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ overflow: "hidden", borderBottomLeftRadius: CURVE, borderBottomRightRadius: CURVE }}>
          <CurvedHero imageUrl={offer.imageUrl} width={width} height={heroHeight} showText={offer.showText} label={offerValueText(offer, t)} title={title} message={description} />
        </View>
        <View style={{ gap: theme.spacing.lg, padding: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.lg }}>
          {/* With the words switched off on the picture, they are written here instead. */}
          {offer.showText ? null : (
            <View style={{ gap: theme.spacing.xs }}>
              <ThemedText variant="caption" weight="bold" style={{ color: theme.colors.colorPrimary }}>{offerValueText(offer, t)}</ThemedText>
              <ThemedText variant="h1">{title}</ThemedText>
              {description ? <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{description}</ThemedText> : null}
            </View>
          )}
          <View style={{ gap: theme.spacing.sm }}>
            <ThemedText variant="body" weight="bold">{t("rewards.yourCode")}</ThemedText>
            {closed ? (
              <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{card?.status === "used" ? t("rewards.used") : t("rewards.expired")}</ThemedText>
            ) : offer.code ? (
              <>
                <CodeBox code={offer.code} hidden={!card} />
                <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("rewards.enterAtCheckout")}</ThemedText>
              </>
            ) : (
              <ThemedText variant="bodySmall" weight="semibold" style={{ color: theme.colors.colorAccent }}>{t("offers.automatic")}</ThemedText>
            )}
          </View>
          <View style={{ gap: theme.spacing.sm }}>
            <ThemedText variant="body" weight="bold">{t("rewards.details")}</ThemedText>
            {[...points, ...facts].map((line, index) => (
              <View key={`${index}-${line}`} style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                <View style={{ width: 6, height: 6, marginTop: 8, borderRadius: 3, backgroundColor: theme.colors.colorPrimary }} />
                <ThemedText variant="bodySmall" style={{ flex: 1 }}>{line}</ThemedText>
              </View>
            ))}
          </View>
          {closed ? null : <Button onPress={() => router.navigate("/products")}>{t("rewards.shopNow")}</Button>}
        </View>
      </ScrollView>
      <View style={{ position: "absolute", top: insets.top + theme.spacing.sm, left: theme.layout.screenHorizontalPadding }}>
        <IconButton icon={BackIcon} label={t("commonActions.back")} white onPress={() => router.back()} />
      </View>
    </View>
  );
}

/** Offer details: picture on top, the code (tap to reveal, then copy), and the offer's points. Opened from an offer, a banner, a notification or a scratched card. */
export default function OfferScreen() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ offerId?: string; cardId?: string }>();
  const offerId = one(params.offerId);
  const cardId = one(params.cardId);
  const offerQuery = useOffer(cardId ? "" : offerId);
  const rewards = useMyRewards();
  const card = cardId ? (rewards.data ?? []).find((item) => item.id === cardId) ?? null : null;
  const shown: Shown | null = card ? { offer: card.offer, card } : offerQuery.data ? { offer: offerQuery.data, card: null } : null;
  const loading = cardId ? rewards.isLoading : offerQuery.isLoading;
  const failed = cardId ? rewards.isError : offerQuery.isError;

  return (
    <MorphPage morphKey={cardId ? `card:${cardId}` : `offer:${offerId}`} heroTop={0} heroHeight={offerHeroHeight(width, height)}>
      {shown ? <OfferBody shown={shown} /> : (
        <View style={{ flex: 1, justifyContent: "center", padding: theme.spacing.lg, backgroundColor: theme.colors.colorBackground }}>
          {loading ? <StateMessage type="loading" title={t("home.loading")} />
            : failed ? <StateMessage type="error" title={t("offers.loadError")} actionLabel={t("common.retry")} onAction={() => { void (cardId ? rewards.refetch() : offerQuery.refetch()); }} />
              : <StateMessage type="empty" title={t("rewards.offerEnded")} actionLabel={t("commonActions.back")} onAction={() => router.back()} />}
        </View>
      )}
    </MorphPage>
  );
}
