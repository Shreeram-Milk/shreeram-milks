import { Image } from "expo-image";
import { View } from "react-native";

import { localized } from "../../lib/contentLocalization";
import { remoteImage } from "../../lib/remoteImage";
import { useTheme } from "../../theme";
import type { BannerContent, BannerType } from "../../types/content";
import type { AppLanguage } from "../../types/models";
import { ThemedText } from "../atoms/ThemedText";

const NOTICE_ORDER: readonly BannerType[] = ["warning", "maintenance", "informational"];

type Props = { banners: BannerContent[] | undefined; language: AppLanguage };

/**
 * Warnings, maintenance and information notices under Home's top banner: plain text, with an optional small icon on the last two.
 * (Promotions are shown in the top banner itself.)
 */
export function HomeNotices({ banners, language }: Props) {
  const theme = useTheme();
  const notices = NOTICE_ORDER.flatMap((type) => (banners ?? []).filter((item) => item.type === type));
  if (notices.length === 0) return null;
  const noticeStyle = (type: BannerType) =>
    type === "warning"
      ? { backgroundColor: theme.colors.colorWarningTint, borderColor: theme.colors.colorWarning }
      : type === "maintenance"
        ? { backgroundColor: theme.colors.colorDangerTint, borderColor: theme.colors.colorDanger }
        : { backgroundColor: theme.colors.colorInfoTint, borderColor: theme.colors.colorInfo };
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {notices.map((notice) => {
        const message = localized(notice.messageEn, notice.messageGu, language);
        return (
          <View key={notice.id} accessibilityRole="alert" style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, padding: theme.spacing.md, ...noticeStyle(notice.type) }}>
            {notice.imageUrl ? <Image source={remoteImage(notice.imageUrl)} contentFit="contain" accessibilityLabel="" style={{ width: 28, height: 28 }} /> : null}
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <ThemedText variant="bodySmall" weight="semibold" style={{ color: theme.colors.colorTextPrimary }}>{localized(notice.titleEn, notice.titleGu, language)}</ThemedText>
              {message ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{message}</ThemedText> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
