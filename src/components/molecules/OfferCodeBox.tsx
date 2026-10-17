import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { localized } from "../../lib/contentLocalization";
import { formatRupees } from "../../lib/catalogCart";
import { useTheme } from "../../theme";
import type { AppLanguage } from "../../types/models";
import { AppInput } from "../atoms/AppInput";
import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";
import { CheckoutSection } from "./CheckoutSection";

export interface AppliedOfferView {
  title: string;
  titleGu: string;
  /** Money taken off; 0 for a free gift. */
  discountPaise: number;
  hasGift: boolean;
}

interface Props {
  language: AppLanguage;
  /** The offer the server gave this cart, if any. */
  applied: AppliedOfferView | null;
  /** The code the customer typed ('' when none). */
  code: string;
  /** Why the typed code does not work, in words. */
  problem: string | null;
  loading: boolean;
  onApply: (code: string) => void;
  onRemove: () => void;
}

/**
 * The offer block of a review screen: the offer the server chose (with the money it saves, or the free gift), and a place to type
 * a code. The phone only shows and asks; the server decides which offer applies and every amount.
 */
export function OfferCodeBox({ applied, code, language, loading, onApply, onRemove, problem }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const typed = draft.trim().toUpperCase();

  return (
    <CheckoutSection title={t("offers.section")}>
      <View style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
        {applied ? (
          <View accessibilityLiveRegion="polite" style={{ gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorAccentTint, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorAccentBorder }}>
            <ThemedText variant="bodySmall" weight="semibold" style={{ color: theme.colors.colorAccent }}>{t("offers.applied", { title: localized(applied.title, applied.titleGu, language) })}</ThemedText>
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>
              {applied.discountPaise > 0 ? t("offers.youSave", { amount: formatRupees(applied.discountPaise) }) : applied.hasGift ? t("offers.giftIncluded") : ""}
            </ThemedText>
          </View>
        ) : null}

        {code !== "" ? (
          <Pressable accessibilityRole="button" onPress={() => { setDraft(""); onRemove(); }} hitSlop={theme.spacing.sm}>
            <ThemedText variant="caption" weight="semibold" style={{ textDecorationLine: "underline" }}>{t("offers.remove")} · {code}</ThemedText>
          </Pressable>
        ) : open ? (
          <View style={{ flexDirection: "row", gap: theme.spacing.sm, alignItems: "center" }}>
            <AppInput
              accessibilityLabel={t("offers.codeLabel")}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20}
              onChangeText={(value) => setDraft(value.replace(/[^a-zA-Z0-9]/g, ""))}
              placeholder={t("offers.codePlaceholder")}
              style={{ flex: 1 }}
              value={draft}
            />
            <Button disabled={typed.length < 3 || loading} loading={loading} onPress={() => onApply(typed)}>{t("offers.apply")}</Button>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setOpen(true)} hitSlop={theme.spacing.sm}>
            <ThemedText variant="bodySmall" weight="semibold" style={{ color: theme.colors.colorPrimary }}>{t("offers.haveCode")}</ThemedText>
          </Pressable>
        )}

        {problem ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>{problem}</ThemedText> : null}
      </View>
    </CheckoutSection>
  );
}
