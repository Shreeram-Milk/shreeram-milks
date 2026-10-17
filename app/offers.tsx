import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../src/components/atoms/Card";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useOffers } from "../src/hooks/useContent";
import { formatRupees } from "../src/lib/catalogCart";
import { localized } from "../src/lib/contentLocalization";
import { offerValueText, offerWorksForText } from "../src/lib/offerText";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { Offer } from "../src/types/offers";

/** "2026-10-31" -> "31 Oct 2026". Plain text, so no date library is needed. */
function formatDay(day: string, language: "en" | "gu"): string {
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? day : new Intl.DateTimeFormat(language === "gu" ? "gu-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function OfferCard({ offer, language }: { offer: Offer; language: "en" | "gu" }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const description = localized(offer.description, offer.descriptionGu, language);
  return (
    <Card padded>
      <View style={{ gap: theme.spacing.sm }}>
        <View style={{ alignSelf: "flex-start", borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, backgroundColor: theme.colors.colorAccentTint }}>
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorAccent }}>{offerValueText(offer, t)}</ThemedText>
        </View>
        <ThemedText variant="body" weight="semibold">{localized(offer.title, offer.titleGu, language)}</ThemedText>
        {description ? <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{description}</ThemedText> : null}
        {offer.minOrderPaise > 0 ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("offers.orderAbove", { amount: formatRupees(offer.minOrderPaise) })}</ThemedText> : null}
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("offers.worksFor")}: {offerWorksForText(offer, t)}</ThemedText>
        {offer.code ? (
          <View style={{ alignSelf: "flex-start", borderRadius: theme.radii.md, borderWidth: theme.borderWidths.hairline, borderStyle: "dashed", borderColor: theme.colors.colorPrimary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs }}>
            <ThemedText variant="bodySmall" weight="bold" style={{ color: theme.colors.colorPrimary, letterSpacing: 1 }}>{t("offers.useCode", { code: offer.code })}</ThemedText>
          </View>
        ) : (
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorAccent }}>{t("offers.automatic")}</ThemedText>
        )}
        {offer.endsOn ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("offers.validUntil", { date: formatDay(offer.endsOn, language) })}</ThemedText> : null}
      </View>
    </Card>
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
