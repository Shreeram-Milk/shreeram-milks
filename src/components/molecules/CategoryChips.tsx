import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

import { localized } from "../../lib/contentLocalization";
import { useTheme } from "../../theme";
import type { CatalogCategory } from "../../types/catalog";
import type { AppLanguage } from "../../types/models";
import { Chip } from "../atoms/Chip";

interface CategoryChipsProps {
  categories: CatalogCategory[];
  language: AppLanguage;
  /** The chosen shelf's id, or null for "All". */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** "All" followed by the shelves the admin has switched on, in the admin's order. */
export function CategoryChips({ categories, language, selectedId, onSelect }: CategoryChipsProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
      <Chip onPress={() => onSelect(null)} selected={selectedId === null}>{t("home.categories.all")}</Chip>
      {categories.map((category) => (
        <Chip key={category.id} onPress={() => onSelect(category.id)} selected={selectedId === category.id}>{localized(category.name, category.nameGu, language)}</Chip>
      ))}
    </ScrollView>
  );
}
