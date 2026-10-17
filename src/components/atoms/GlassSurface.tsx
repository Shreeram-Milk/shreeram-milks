import { BlurView } from "expo-blur";
import type { PropsWithChildren, RefObject } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

interface GlassSurfaceProps {
  /** On Android, the content to blur must be wrapped in a BlurTargetView; pass its ref here. */
  blurTarget: RefObject<View | null>;
  intensity?: number;
  /** A faint tint over the blur so text on top stays readable without hiding the page. */
  wash?: string;
  /** The tint used where live blur is off (Android); stronger, since nothing is blurred behind it. */
  androidWash?: string;
  /** Adds the bright light-catching rim of Apple-style glass. Off for full-screen backdrops. */
  highlight?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Live blur on Android turns flat grey while the page scrolls under it, so Android gets a bright see-through panel instead.
const liveBlur = Platform.OS === "ios";

/** Clear glass: a light blur of what is behind (iPhone), a faint tint and a bright rim. */
export function GlassSurface({ androidWash = "rgba(255, 255, 255, 0.86)", blurTarget, children, highlight = true, intensity = 14, wash = "rgba(255, 255, 255, 0.55)", style }: PropsWithChildren<GlassSurfaceProps>) {
  const borderRadius = StyleSheet.flatten(style)?.borderRadius;
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      {liveBlur ? <BlurView blurTarget={blurTarget} intensity={intensity} tint="light" style={StyleSheet.absoluteFill} /> : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: liveBlur ? wash : androidWash }]} />
      {highlight ? (
        <>
          {/* The blur fades slightly at the edges on Android; a soft bright rim covers that and reads as light on the glass edge. */}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius, borderWidth: 10, borderColor: "rgba(255, 255, 255, 0.5)" }]} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius, borderWidth: 1.5, borderColor: "rgba(255, 255, 255, 0.95)" }]} />
        </>
      ) : null}
      {/* The native blur can draw above later siblings on Android, so the content is lifted over it explicitly. */}
      <View style={{ zIndex: 2, elevation: 2 }}>{children}</View>
    </View>
  );
}
