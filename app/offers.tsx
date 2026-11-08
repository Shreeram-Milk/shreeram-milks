import { router } from "expo-router";
import { Image } from "expo-image";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PressableScale } from "../src/components/atoms/PressableScale";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useOffers } from "../src/hooks/useContent";
import { formatRupees } from "../src/lib/catalogCart";
import { localized } from "../src/lib/contentLocalization";
import { openFromCard } from "../src/lib/morph";
import { formatOfferDay, offerValueText, offerWorksForText } from "../src/lib/offerText";
import { remoteImage } from "../src/lib/remoteImage";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { Offer } from "../src/types/offers";

function OfferCard({ offer, language }: { offer: Offer; language: "en" | "gu" }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const description = localized(offer.description, offer.descriptionGu, language);
  const box = useRef<View>(null);
  const open = () => openFromCard(box.current, `offer:${offer.id}`, theme.radii.lg, offer.imageUrl, () => router.push({ pathname: "/offer", params: { offerId: offer.id } }));
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={localized(offer.title, offer.titleGu, language)} onPress={open}>
      <View ref={box} collapsable={false} style={{ overflow: "hidden", borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface, ...theme.elevation.card }}>
      {offer.imageUrl ? <Image source={remoteImage(offer.imageUrl)} contentFit="cover" style={{ width: "100%", aspectRatio: 2 }} /> : null}
      <View style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
        <View style={{ alignSelf: "flex-start", borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, backgroundColor: theme.colors.colorAccentTint }}>
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorAccent }}>{offerValueText(offer, t)}</ThemedText>
        </View>
        <ThemedText variant="body" weight="semibold">{localized(offer.title, offer.titleGu, language)}</ThemedText>
        {description ? <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{description}</ThemedText> : null}
        {offer.minOrderPaise > 0 ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("offers.orderAbove", { amount: formatRupees(offer.minOrderPaise) })}</ThemedText> : null}
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("offers.worksFor")}: {offerWorksForText(offer, t)}</ThemedText>
        {offer.code ? (
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorPrimary }}>{t("offers.hasCode")}</ThemedText>
        ) : (
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorAccent }}>{t("offers.automatic")}</ThemedText>
        )}
        {offer.endsOn ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("offers.validUntil", { date: formatOfferDay(offer.endsOn, language) })}</ThemedText> : null}
        <ThemedText variant="caption" weight="bold" style={{ color: theme.colors.colorPrimary }}>{t("offers.viewDetails")}</ThemedText>
      </View>
      </View>
    </PressableScale>
  );
}

/** The Offers page: every live offer, with its code if it has one. Opened from the profile, a banner or a notification. */
export default function OffersScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { data: offers = [], isError, isLoading, isRefetching, refetch } = useOffers();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={t("offers.title")} />
        <ScrollView
          contentContainerStyle={{ gap: theme.spacing.md, paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xxl }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        >
          <ThemedText variant="body" style={{ color: theme.colors.colorTextSecondary }}>{t("offers.subtitle")}</ThemedText>
          {isLoading ? <StateMessage type="loading" title={t("home.loading")} /> : null}
          {isError ? <StateMessage type="error" title={t("offers.loadError")} actionLabel={t("common.retry")} onAction={() => void refetch()} /> : null}
          {!isLoading && !isError && offers.length === 0 ? <StateMessage type="empty" title={t("offers.emptyTitle")} description={t("offers.empty")} /> : null}
          {offers.map((offer) => <OfferCard key={offer.id} offer={offer} language={language} />)}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
