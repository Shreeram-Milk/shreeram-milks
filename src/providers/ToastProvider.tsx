import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Animated, Easing, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "../components/atoms/ThemedText";
import { AppIcon } from "../components/atoms/AppIcon";
import { CheckIcon } from "../icons/appIcons";
import { useTheme } from "../theme";

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(
    () => new Animated.Value(-theme.motion.entranceOffset),
  );
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      opacity.stopAnimation();
      translateY.stopAnimation();
    },
    [opacity, translateY],
  );

  const showToast = useCallback(
    (nextMessage: string) => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      opacity.stopAnimation();
      translateY.stopAnimation();
      opacity.setValue(0);
      translateY.setValue(-theme.motion.entranceOffset);
      setMessage(nextMessage);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: theme.motion.duration.normal,
          easing: Easing.bezier(...theme.motion.easing.decelerate),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: theme.motion.duration.normal,
          easing: Easing.bezier(...theme.motion.easing.decelerate),
          useNativeDriver: true,
        }),
      ]).start();

      dismissTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: theme.motion.duration.normal,
            easing: Easing.bezier(...theme.motion.easing.accelerate),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -theme.motion.entranceOffset,
            duration: theme.motion.duration.normal,
            easing: Easing.bezier(...theme.motion.easing.accelerate),
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) setMessage(null);
        });
        dismissTimer.current = null;
      }, 2200);
    },
    [
      opacity,
      theme.motion.duration.normal,
      theme.motion.easing.accelerate,
      theme.motion.easing.decelerate,
      theme.motion.entranceOffset,
      translateY,
    ],
  );

  const contextValue = { showToast };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {message ? (
        <Animated.View
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          pointerEvents="none"
          style={{
            position: "absolute",
            top: insets.top + theme.spacing.md,
            left: theme.layout.screenHorizontalPadding,
            right: theme.layout.screenHorizontalPadding,
            zIndex: theme.zIndex.toast,
            minHeight: theme.sizes.avatarSm + theme.spacing.sm * 2,
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: theme.spacing.md + theme.sizes.avatarSm + theme.spacing.sm,
            paddingRight: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.colorSuccessTint,
            opacity,
            transform: [{ translateY }],
            ...theme.elevation.card,
          }}
        >
          <View
            accessible={false}
            style={{
              position: "absolute",
              left: theme.spacing.md,
              top: theme.spacing.sm,
              width: theme.sizes.avatarSm,
              height: theme.sizes.avatarSm,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.colorSuccess,
            }}
          >
            <AppIcon icon={CheckIcon} accessibilityLabel="" size="sm" tone="onPrimary" />
          </View>
          <ThemedText
            variant="bodySmall"
            weight="semibold"
            style={{ color: theme.colors.colorSuccess, flexShrink: 1 }}
          >
            {message}
          </ThemedText>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
