import { Image } from "expo-image";
import { View } from "react-native";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../../theme";
import { remoteImage } from "../../lib/remoteImage";
type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  imageUrl?: string;
  initials: string;
  size?: AvatarSize;
}

export function Avatar({ imageUrl, initials, size = "md" }: AvatarProps) {
  const theme = useTheme();
  const dimension =
    size === "sm"
      ? theme.sizes.avatarSm
      : size === "lg"
        ? theme.sizes.avatarLg
        : theme.sizes.avatarMd;
  const containerStyle = {
    width: dimension,
    height: dimension,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.colorAccentTint,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
  };
  return (
    <View accessibilityLabel={initials} style={containerStyle}>
      {imageUrl ? (
        <Image
          accessibilityLabel={initials}
          contentFit="cover"
          source={remoteImage(imageUrl)}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <ThemedText
          variant={size === "lg" ? "h2" : "caption"}
          weight="extrabold"
          style={{ color: theme.colors.colorAccent }}
        >
          {initials}
        </ThemedText>
      )}
    </View>
  );
}
