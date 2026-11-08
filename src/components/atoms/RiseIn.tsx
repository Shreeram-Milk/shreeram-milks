import type { PropsWithChildren } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

interface RiseInProps {
  /** Kept so screens can still say where an item sits in a list; it no longer changes anything. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps list items and sections. It used to fade and lift them in when a screen opened, but on Android a fading card draws its
 * shadow outline before its content, which flashed empty "skeleton" boxes on every tab. Content now simply appears, as it does in
 * well-made shopping apps; movement is kept for the moments that matter (opening a product, scratching a card).
 */
export function RiseIn({ children, style }: PropsWithChildren<RiseInProps>) {
  return <View style={style}>{children}</View>;
}
