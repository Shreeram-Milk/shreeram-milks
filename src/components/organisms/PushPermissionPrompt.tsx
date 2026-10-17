import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { NotificationIcon } from "../../icons/appIcons";
import { useToast } from "../../providers/ToastProvider";
import { registerPushToken } from "../../services/notificationService";
import { askForPushToken, pushPermission } from "../../services/pushNative";
import { useAppStore } from "../../store/useAppStore";
import { useSessionStore } from "../../store/useSessionStore";
import { ConfirmSheet } from "./ConfirmSheet";

const ASKED_AT_KEY = "pushAskedAt";
// "Not now" is respected for a week before the friendly question comes back.
const ASK_AGAIN_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
// A short pause after Home appears, so the question does not jump in front of the first screen.
const SHOW_AFTER_MS = 900;

/**
 * The friendly question before the phone's own permission pop-up, shown on Home soon after sign-up: it says what the messages
 * are for, so the customer can say yes knowingly. Only when the app may still ask; never again once allowed or refused for good.
 */
export function PushPermissionPrompt() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const signedIn = useSessionStore((state) => Boolean(state.customer));
  const language = useAppStore((state) => state.language);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if ((await pushPermission()) !== "ask") return;
        const askedAt = Number((await AsyncStorage.getItem(ASKED_AT_KEY).catch(() => null)) ?? 0);
        if (!cancelled && Date.now() - askedAt > ASK_AGAIN_AFTER_MS) setVisible(true);
      })();
    }, SHOW_AFTER_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [signedIn]);

  const later = () => {
    setVisible(false);
    void AsyncStorage.setItem(ASKED_AT_KEY, String(Date.now())).catch(() => undefined);
  };

  const turnOn = async () => {
    setBusy(true);
    const token = await askForPushToken();
    void AsyncStorage.setItem(ASKED_AT_KEY, String(Date.now())).catch(() => undefined);
    if (token) {
      try {
        await registerPushToken(token, language);
      } catch {
        // Saved on the phone side; the address is sent again the next time the app opens.
      }
      showToast(t("inbox.onToast"));
    }
    setBusy(false);
    setVisible(false);
  };

  return (
    <ConfirmSheet
      visible={visible}
      icon={NotificationIcon}
      title={t("inbox.askTitle")}
      description={t("inbox.askDetail")}
      confirmLabel={t("inbox.askOn")}
      cancelLabel={t("inbox.askLater")}
      loading={busy}
      onCancel={later}
      onConfirm={() => void turnOn()}
    />
  );
}
