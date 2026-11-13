import { Image } from "expo-image";
import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { remoteImage } from "../../lib/remoteImage";
import { useTheme } from "../../theme";
import { ThemedText } from "../atoms/ThemedText";

type Props = PropsWithChildren<{
  imageUrl: string | null;
  width: number;
  height: number;
  /** False: the picture shows alone (it already carries its own words). */
  showText: boolean;
  /** Lightens the artwork behind dark status-bar icons on edge-to-edge screens. */
  showStatusBarWash?: boolean;
  label?: string;
  title: string;
  message?: string;
  /** Room kept free under the text (for the slide dots). */
  bottomSpace?: number;
}>;

/**
 * One big picture with its words on top, as on Home's top banner and an offer page. The words sit on a soft dark shade at the
 * bottom, so they read on any picture. Without a picture, a warm cream-to-peach background with dark words is shown instead.
 */
export function CurvedHero({ imageUrl, width, height, showText, showStatusBarWash = false, label, title, message, bottomSpace = 0, children }: Props) {
  const theme = useTheme();
  const hasImage = Boolean(imageUrl);
  const textColor = hasImage ? theme.colors.colorTextInverse : theme.colors.colorTextPrimary;
  return (
    <View style={{ width, height, backgroundColor: theme.colors.colorPrimaryTint }}>
      {hasImage ? (
        <Image source={remoteImage(imageUrl)} contentFit="cover" transition={theme.motion.duration.normal} style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />
      ) : (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="warm" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={theme.colors.colorHighlightTint} />
              <Stop offset="1" stopColor={theme.colors.colorPrimaryTint} />
            </LinearGradient>
          </Defs>
          <Rect width={width} height={height} fill="url(#warm)" />
        </Svg>
      )}
      {showStatusBarWash ? (
        <Svg width={width} height={120} style={{ position: "absolute", top: 0, left: 0 }} pointerEvents="none">
          <Defs>
            <LinearGradient id="top" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width={width} height={120} fill="url(#top)" />
        </Svg>
      ) : null}
      {showText && hasImage ? (
        <Svg width={width} height={height * 0.6} style={{ position: "absolute", left: 0, bottom: 0 }} pointerEvents="none">
          <Defs>
            <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000000" stopOpacity={0} />
              <Stop offset="0.55" stopColor="#1F1C18" stopOpacity={0.38} />
              <Stop offset="1" stopColor="#1F1C18" stopOpacity={0.72} />
            </LinearGradient>
          </Defs>
          <Rect width={width} height={height * 0.6} fill="url(#shade)" />
        </Svg>
      ) : null}
      {showText ? (
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, gap: theme.spacing.xs, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg + bottomSpace }}>
          {label ? (
            <View style={{ alignSelf: "flex-start", borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm + 2, paddingVertical: 3, backgroundColor: theme.colors.colorHighlight }}>
              <ThemedText variant="caption" weight="bold" style={{ color: theme.colors.colorOnHighlight, letterSpacing: 0.4 }}>{label}</ThemedText>
            </View>
          ) : null}
          <ThemedText variant="display" numberOfLines={2} style={{ color: textColor, fontSize: 25, lineHeight: 31, maxWidth: 520 }}>{title}</ThemedText>
          {message ? <ThemedText variant="bodySmall" numberOfLines={2} style={{ color: textColor, opacity: hasImage ? 0.92 : 0.8, maxWidth: 520 }}>{message}</ThemedText> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}
