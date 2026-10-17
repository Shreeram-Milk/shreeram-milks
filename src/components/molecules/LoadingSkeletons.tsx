import { View } from "react-native";

import { Skeleton } from "../atoms/Skeleton";
import { useTheme } from "../../theme";

/** Two-column product cards while the catalogue loads, the same shape as CatalogProductCard. */
export function ProductGridSkeleton({ rows = 2 }: { rows?: number }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md }}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          {[0, 1].map((column) => (
            <View key={column} style={{ flex: 1, gap: theme.spacing.sm }}>
              <Skeleton height={150} radius={theme.radii.lg} />
              <Skeleton height={14} width="70%" />
              <Skeleton height={12} width="40%" />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Stacked rows (orders, plans, settings) while a list loads. */
export function ListSkeleton({ count = 4, rowHeight = 84 }: { count?: number; rowHeight?: number }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md }}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={rowHeight} radius={theme.radii.lg} />
      ))}
    </View>
  );
}

/** A product page while its details load: big photo, title lines and the size tiles. Compact skips the photo and title when they are already shown. */
export function ProductDetailSkeleton({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md }}>
      {compact ? null : (
        <>
          <Skeleton height={300} radius={theme.radii.xl} />
          <Skeleton height={22} width="60%" />
          <Skeleton height={14} width="35%" />
        </>
      )}
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} height={56} radius={theme.radii.md} style={{ flex: 1 }} width="auto" />
        ))}
      </View>
      <Skeleton height={64} radius={theme.radii.lg} />
    </View>
  );
}
