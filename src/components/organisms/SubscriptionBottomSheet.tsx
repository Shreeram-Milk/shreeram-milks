import type { PropsWithChildren } from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { ToastHost } from "../../providers/ToastProvider";
import { useTheme } from "../../theme";
import { AppIcon } from "../atoms/AppIcon";
import { CloseIcon } from "../../icons/appIcons";
import { KeyboardAwareBottomDrawer } from "./KeyboardAwareBottomDrawer";

interface SubscriptionBottomSheetProps {
  onClose: () => void;
  visible: boolean;
}

export function SubscriptionBottomSheet({
  children,
  onClose,
  visible,
}: PropsWithChildren<SubscriptionBottomSheetProps>) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const [translateY] = useState(() => new Animated.Value(height));
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [mounted, setMounted] = useState(visible);
  const opened = useRef(false);
  useEffect(() => {
    if (visible) {
      if (opened.current) return;
      opened.current = true;
      setMounted(true);
      translateY.setValue(height);
      backdropOpacity.setValue(0);
      Animated.spring(translateY, {
        toValue: 0,
        ...theme.motion.spring.sheet,
        useNativeDriver: true,
      }).start();
      Animated.timing(backdropOpacity, {
        toValue: theme.motion.overlayOpacity,
        duration: theme.motion.duration.overlay,
        easing: Easing.bezier(...theme.motion.easing.decelerate),
        useNativeDriver: true,
      }).start();
    } else if (opened.current) {
      opened.current = false;
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: height,
          ...theme.motion.spring.sheet,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: theme.motion.duration.overlay,
          easing: Easing.bezier(...theme.motion.easing.accelerate),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [
    backdropOpacity,
    height,
    theme.motion.duration.overlay,
    theme.motion.easing.accelerate,
    theme.motion.easing.decelerate,
    theme.motion.overlayOpacity,
    theme.motion.spring.sheet,
    translateY,
    visible,
  ]);

  const close = () => {
    if (!opened.current) return;
    opened.current = false;
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: height,
        ...theme.motion.spring.sheet,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: theme.motion.duration.overlay,
        easing: Easing.bezier(...theme.motion.easing.accelerate),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
        onClose();
      }
    });
  };
  return (
    <Modal
      animationType="none"
      transparent
      visible={mounted}
      onRequestClose={close}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme.colors.colorOverlay,
              opacity: backdropOpacity,
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("bottomSheet.closeDrawer")}
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAwareBottomDrawer>
          <Animated.View
            style={[
              {
                overflow: "hidden",
                padding: theme.spacing.lg,
                paddingBottom: theme.spacing.xl,
                borderTopLeftRadius: theme.radii.lg,
                borderTopRightRadius: theme.radii.lg,
                backgroundColor: theme.colors.colorSurface,
                transform: [{ translateY }],
              },
              theme.elevation.lg,
            ]}
          >
            <View
              style={{
                alignSelf: "center",
                width: theme.spacing.xxl,
                height: theme.spacing.xs,
                borderRadius: theme.radii.pill,
                marginBottom: theme.spacing.md,
                backgroundColor: theme.colors.colorBorder,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("bottomSheet.close")}
              onPress={close}
              style={{
                position: "absolute",
                top: theme.spacing.md,
                right: theme.spacing.md,
                width: theme.layout.touchTargetMin,
                height: theme.layout.touchTargetMin,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon
                icon={CloseIcon}
                accessibilityLabel=""
                size="sm"
                tone="secondary"
              />
            </Pressable>
            {children}
          </Animated.View>
        </KeyboardAwareBottomDrawer>
        {/* The sheet opens in its own window above the app, so it carries its own copy of the toast. */}
        <ToastHost />
      </View>
    </Modal>
  );
}
