import { Image } from "expo-image";
import { useState } from "react";
import { FlatList, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { useTheme } from "../../theme";

interface ProductImageCarouselProps {
  /** The main picture first, then the gallery. May be empty. */
  imageUrls: string[];
  accessibilityLabel: string;
}

/** The product's pictures, one per swipe, with dots under them when there is more than one. */
export function ProductImageCarousel({ imageUrls, accessibilityLabel }: ProductImageCarouselProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const height = theme.sizes.productCardImageSize * 3;
  const slides = imageUrls.length > 0 ? imageUrls : [null];
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width));

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, position) => item ?? `empty-${position}`}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_data, position) => ({ length: width, offset: width * position, index: position })}
        renderItem={({ item }) => (
          <View style={{ width, height, overflow: "hidden", backgroundColor: theme.colors.colorPrimaryTint }}>
            <Image accessibilityLabel={accessibilityLabel} source={{ uri: item ?? undefined }} contentFit="cover" transition={theme.motion.duration.normal} style={{ width: "100%", height: "100%" }} />
          </View>
        )}
      />
      {slides.length > 1 ? (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: theme.spacing.xs }}>
          {slides.map((item, position) => (
            <View
              key={item ?? `dot-${position}`}
              style={{
                width: position === index ? theme.spacing.lg : theme.spacing.xs,
                height: theme.spacing.xs,
                borderRadius: theme.radii.pill,
                backgroundColor: position === index ? theme.colors.colorPrimary : theme.colors.colorBorder,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
