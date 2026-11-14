import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

import { localized } from "../../lib/contentLocalization";
import { remoteImage } from "../../lib/remoteImage";
import { useTheme } from "../../theme";
import type { CatalogCategory } from "../../types/catalog";
import type { AppLanguage } from "../../types/models";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";

interface CategoryChipsProps {
  categories: CatalogCategory[];
  language: AppLanguage;
  /** The chosen shelf's id, or null for "All". */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const TILE_WIDTH = 64;
const TILE_HEIGHT = 80;

/**
 * One shelf as an arched picture tile with its name underneath. The chosen one gets a saffron outline and a small dot under
 * the name; its text stays in the normal colour. A shelf without a picture shows its first letter on a warm tile.
 */
function CategoryTile({ imageUrl, label, onPress, selected, fallback }: { imageUrl: string | null; label: string; onPress: () => void; selected: boolean; fallback: string }) {
  const theme = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress} pressScale={theme.motion.pressScale.control} style={{ width: TILE_WIDTH, alignItems: "center", gap: theme.spacing.xs + 2 }}>
      <View
        style={{
          width: TILE_WIDTH, height: TILE_HEIGHT, overflow: "hidden", alignItems: "center", justifyContent: "center",
          borderTopLeftRadius: TILE_WIDTH / 2, borderTopRightRadius: TILE_WIDTH / 2, borderBottomLeftRadius: theme.radii.md, borderBottomRightRadius: theme.radii.md,
          borderWidth: selected ? theme.borderWidths.medium : theme.borderWidths.none, borderColor: theme.colors.colorSelectionBorder,
          backgroundColor: imageUrl ? theme.colors.colorSurfaceTile : theme.colors.colorBrandTint,
        }}
      >
        {imageUrl ? <Image source={remoteImage(imageUrl)} contentFit="cover" cachePolicy="memory-disk" transition={theme.motion.duration.fast} style={{ width: "100%", height: "100%" }} accessibilityIgnoresInvertColors />
          : <ThemedText variant="h1" style={{ color: theme.colors.colorBrandText }}>{fallback}</ThemedText>}
      </View>
      <ThemedText variant="caption" weight={selected ? "bold" : "medium"} numberOfLines={1} style={{ color: selected ? theme.colors.colorTextPrimary : theme.colors.colorTextSecondary }}>{label}</ThemedText>
      <View style={{ width: 5, height: 5, borderRadius: theme.radii.pill, backgroundColor: selected ? theme.colors.colorBrand : theme.colors.colorTransparent }} />
    </PressableScale>
  );
}

/** "All" followed by the shelves the admin has switched on, in the admin's order, as picture tiles. */
export function CategoryChips({ categories, language, selectedId, onSelect }: CategoryChipsProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const all = t("home.categories.all");
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -theme.layout.screenHorizontalPadding }} contentContainerStyle={{ gap: theme.spacing.md, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
      <CategoryTile imageUrl={null} fallback={all.slice(0, 1)} label={all} selected={selectedId === null} onPress={() => onSelect(null)} />
      {categories.map((category) => {
        const name = localized(category.name, category.nameGu, language);
        return <CategoryTile key={category.id} imageUrl={category.imageUrl ?? null} fallback={name.slice(0, 1).toUpperCase()} label={name} selected={selectedId === category.id} onPress={() => onSelect(category.id)} />;
      })}
    </ScrollView>
  );
}
