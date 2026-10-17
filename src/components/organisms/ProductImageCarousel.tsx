import { Image } from "expo-image";
import { useState } from "react";
import { FlatList, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { useTheme } from "../../theme";

interface ProductImageCarouselProps {
  /** The main picture first, then the gallery. May be empty. */
  imageUrls: string[];
  accessibilityLabel: string;
}

/** The product's pictures as full-width squares, one per swipe, with small dots on the photo when there is more than one. */
export function ProductImageCarousel({ imageUrls, accessibilityLabel }: ProductImageCarouselProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const slides = imageUrls.length > 0 ? imageUrls : [null];
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width));

  return (
    <View style={{ width, height: width, backgroundColor: theme.colors.colorSurfaceMuted }}>
      <FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, position) => item ?? `empty-${position}`}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_data, position) => ({ length: width, offset: width * position, index: position })}
        renderItem={({ item }) => (
          <Image accessibilityLabel={accessibilityLabel} source={{ uri: item ?? undefined }} contentFit="cover" transition={theme.motion.duration.fast} style={{ width, height: width }} />
        )}
      />
      {slides.length > 1 ? (
        <View pointerEvents="none" style={{ position: "absolute", bottom: theme.spacing.md, alignSelf: "center", flexDirection: "row", gap: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs + 1, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorNavigation }}>
          {slides.map((item, position) => (
            <View key={item ?? `dot-${position}`} style={{ width: position === index ? 14 : 5, height: 5, borderRadius: theme.radii.pill, backgroundColor: position === index ? theme.colors.colorTextInverse : theme.colors.colorNavigationText }} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
