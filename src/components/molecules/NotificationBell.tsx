import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useUnreadCount } from "../../hooks/useNotifications";
import { NotificationIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";
import { IconButton } from "../atoms/IconButton";
import { ThemedText } from "../atoms/ThemedText";

/** The bell on Home: opens the customer's messages, with a small orange badge when some are unread. */
export function NotificationBell() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: unread = 0 } = useUnreadCount();
  return (
    <View>
      <IconButton icon={NotificationIcon} label={unread > 0 ? t("inbox.bellUnread", { count: unread }) : t("home.notifications")} filled onPress={() => router.push("/notifications")} />
      {unread > 0 ? (
        <View pointerEvents="none" style={{ position: "absolute", top: 2, right: 2, minWidth: 18, height: 18, paddingHorizontal: 4, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorPrimary }}>
          <ThemedText variant="caption" weight="bold" style={{ color: theme.colors.colorTextInverse, fontSize: 10, lineHeight: 13 }}>{unread > 9 ? "9+" : unread}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}
