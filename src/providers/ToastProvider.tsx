import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Pressable, View } from "react-native";
import Animated, { Easing, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming, type SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon, type IconSvgElement } from "../components/atoms/AppIcon";
import { ThemedText } from "../components/atoms/ThemedText";
import { AlertCircleIcon, CartIcon, CheckIcon } from "../icons/appIcons";
import { motion } from "../theme/motion";
import { useTheme } from "../theme";

/** success: something worked (added, skipped). info: a neutral change (removed). error: something went wrong. */
export type ToastTone = "success" | "info" | "error";

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

interface ToastState {
  message: string;
  tone: ToastTone;
  /** Changes for every new toast, so a second message while one is showing still gets its own little bump. */
  id: number;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** What a ToastHost needs to draw the current toast. Kept apart from showToast so screens never re-render for it. */
interface ToastView {
  toast: ToastState | null;
  hide: () => void;
  offset: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  iconScale: SharedValue<number>;
}
const ToastViewContext = createContext<ToastView | null>(null);

const VISIBLE_MS = 2400;
const DROP_FROM = -90;
const DROP_SPRING = { damping: 17, stiffness: 230, mass: 0.8, reduceMotion: ReduceMotion.System };
const ICON_SPRING = { damping: 11, stiffness: 260, mass: 0.6, reduceMotion: ReduceMotion.System };
const EXIT_MS = 220;

/**
 * Short messages as a dark floating pill that drops in from the top with a soft spring, like a phone's own notice, its icon
 * popping in just after. It lifts away on its own after a moment, or straight away when tapped. All on the phone's UI thread.
 */
export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offset = useSharedValue(DROP_FROM);
  const scale = useSharedValue(0.86);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(0);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const hide = useCallback(() => {
    clearTimer();
    const exit = { duration: EXIT_MS, easing: Easing.bezier(...motion.easing.accelerate), reduceMotion: ReduceMotion.System };
    offset.set(withTiming(DROP_FROM / 2, exit));
    scale.set(withTiming(0.92, exit));
    opacity.set(withTiming(0, exit, (finished) => {
      if (finished) runOnJS(setToast)(null);
    }));
  }, [offset, opacity, scale]);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    nextId.current += 1;
    setToast({ message, tone, id: nextId.current });
  }, []);

  // Each new toast drops in (or, if one is already up, gives a small bump), then lifts away after a moment.
  useEffect(() => {
    if (!toast) return;
    const alreadyShowing = opacity.get() > 0.5;
    if (alreadyShowing) {
      scale.set(withSequence(withTiming(1.04, { duration: motion.duration.instant }), withSpring(1, DROP_SPRING)));
    } else {
      offset.set(DROP_FROM);
      scale.set(0.86);
      opacity.set(0);
      offset.set(withSpring(0, DROP_SPRING));
      scale.set(withSpring(1, DROP_SPRING));
      opacity.set(withTiming(1, { duration: motion.duration.fast, reduceMotion: ReduceMotion.Never }));
    }
    iconScale.set(0);
    iconScale.set(withDelay(motion.duration.instant, withSpring(1, ICON_SPRING)));
    clearTimer();
    timer.current = setTimeout(hide, VISIBLE_MS);
    return clearTimer;
  }, [hide, iconScale, offset, opacity, scale, toast]);

  const view: ToastView = { toast, hide, offset, scale, opacity, iconScale };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ToastViewContext.Provider value={view}>
        {children}
        <ToastHost />
      </ToastViewContext.Provider>
    </ToastContext.Provider>
  );
}

/**
 * Draws the current toast. The app has one at the top level; a pop-up sheet (which opens in its own window, above everything)
 * puts another inside itself, so a toast shown while a sheet is open is still seen.
 */
export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const view = useContext(ToastViewContext);
  const offset = view?.offset;
  const scale = view?.scale;
  const opacity = view?.opacity;
  const iconScale = view?.iconScale;
  const pillStyle = useAnimatedStyle(() => ({ opacity: opacity?.value ?? 0, transform: [{ translateY: offset?.value ?? 0 }, { scale: scale?.value ?? 1 }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale?.value ?? 1 }] }));
  const toast = view?.toast;
  if (!view || !toast) return null;

  const look: Record<ToastTone, { icon: IconSvgElement; background: string }> = {
    success: { icon: CheckIcon, background: theme.colors.colorAccent },
    info: { icon: CartIcon, background: theme.colors.colorNavigationText },
    error: { icon: AlertCircleIcon, background: theme.colors.colorDanger },
  };
  const current = look[toast.tone];

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top: insets.top + theme.spacing.sm, left: 0, right: 0, alignItems: "center", zIndex: theme.zIndex.toast }}>
      <Animated.View style={[{ maxWidth: "92%", borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorNavigation, ...theme.elevation.lg }, pillStyle]}>
        <Pressable accessibilityRole="alert" accessibilityLiveRegion="polite" onPress={view.hide} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm + 2, paddingLeft: theme.spacing.sm, paddingRight: theme.spacing.md + 2, paddingVertical: theme.spacing.sm }}>
          <Animated.View style={[{ width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: current.background }, iconStyle]}>
            <AppIcon icon={current.icon} accessibilityLabel="" size="sm" color={theme.colors.colorTextInverse} strong />
          </Animated.View>
          <ThemedText variant="bodySmall" weight="semibold" numberOfLines={2} style={{ flexShrink: 1, color: theme.colors.colorTextInverse }}>{toast.message}</ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
