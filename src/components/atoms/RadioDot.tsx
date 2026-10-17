import { View } from "react-native";

import { useTheme } from "../../theme";

/** A quiet round selection marker: an empty ring, or a dark ring with a dot when chosen. */
export function RadioDot({ selected }: { selected: boolean }) {
  const theme = useTheme();
  const size = theme.spacing.md + theme.spacing.xs;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.radii.pill,
        borderWidth: theme.borderWidths.medium,
        borderColor: selected ? theme.colors.colorTextPrimary : theme.colors.colorTextDisabled,
      }}
    >
      {selected ? (
        <View style={{ width: theme.spacing.sm + 2, height: theme.spacing.sm + 2, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorTextPrimary }} />
      ) : null}
    </View>
  );
}
