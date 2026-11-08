import { useState } from "react";
import { View } from "react-native";
import Svg, { Line } from "react-native-svg";

import { useTheme } from "../../theme";

/** A thin dashed line across the full width, like the tear lines on a printed receipt. */
export function DashedRule({ spacing = 0 }: { spacing?: number }) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ height: 1, marginVertical: spacing }}>
      {width > 0 ? (
        <Svg width={width} height={1}>
          <Line x1={0} y1={0.5} x2={width} y2={0.5} stroke={theme.colors.colorBorder} strokeWidth={1} strokeDasharray="5 4" />
        </Svg>
      ) : null}
    </View>
  );
}
