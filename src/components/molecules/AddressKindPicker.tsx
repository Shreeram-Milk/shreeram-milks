import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '../atoms/ThemedText';
import { useTheme } from '../../theme';
import type { AddressKind } from '../../types/models';

export function AddressKindPicker({ value, showLegacy, onChange }: { value: AddressKind; showLegacy: boolean; onChange: (kind: AddressKind) => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const choices: AddressKind[] = showLegacy ? ['society', 'independent', 'unspecified'] : ['society', 'independent'];
  return <View style={{ gap: theme.spacing.sm }}>
    <ThemedText variant="bodySmall">{t('addresses.buildingType')}</ThemedText>
    <View accessibilityRole="radiogroup" style={{ gap: theme.spacing.sm }}>
      {choices.map(kind => <Pressable key={kind} accessibilityRole="radio" accessibilityState={{ checked: value === kind }} onPress={() => onChange(kind)} style={{ minHeight: theme.layout.touchTargetMin, justifyContent: 'center', padding: theme.spacing.md, borderWidth: theme.borderWidths.hairline, borderRadius: theme.radii.md, borderColor: value === kind ? theme.colors.colorPrimary : theme.colors.colorBorder, backgroundColor: value === kind ? theme.colors.colorPrimaryTint : theme.colors.colorSurface }}>
        <ThemedText variant="bodySmall" weight={value === kind ? 'semibold' : 'regular'}>{t(`addresses.kind_${kind}`)}</ThemedText>
      </Pressable>)}
    </View>
  </View>;
}
