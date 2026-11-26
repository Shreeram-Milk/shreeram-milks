import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '../atoms/ThemedText';
import { AppIcon } from '../atoms/AppIcon';
import { HomeIcon, ProductsIcon, MapPinIcon } from '../../icons/appIcons';
import { useTheme } from '../../theme';
import type { AddressKind } from '../../types/models';

export function AddressKindPicker({ value, showLegacy, onChange }: { value: AddressKind; showLegacy: boolean; onChange: (kind: AddressKind) => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const choices: AddressKind[] = showLegacy ? ['society', 'independent', 'unspecified'] : ['society', 'independent'];
  return <View style={{ gap: theme.spacing.sm }}>
    <ThemedText variant="body" weight="semibold">{t('addresses.buildingType')}</ThemedText>
    <View accessibilityRole="radiogroup" style={{ gap: theme.spacing.sm }}>
      {choices.map(kind => {
        const selected = value === kind;
        return <Pressable key={kind} accessibilityRole="radio" accessibilityLabel={t(`addresses.kind_${kind}`)} accessibilityState={{ checked: selected }} onPress={() => onChange(kind)} style={{ minHeight: theme.layout.touchTargetMin, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.md, borderWidth: theme.borderWidths.medium, borderRadius: theme.radii.lg, borderColor: selected ? theme.colors.colorPrimary : theme.colors.colorBorder, backgroundColor: selected ? theme.colors.colorPrimaryTint : theme.colors.colorSurface }}>
          <View style={{ width: theme.sizes.avatarMd, height: theme.sizes.avatarMd, borderRadius: theme.radii.md, backgroundColor: selected ? theme.colors.colorSurface : theme.colors.colorSurfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon icon={kind === 'society' ? ProductsIcon : kind === 'independent' ? HomeIcon : MapPinIcon} accessibilityLabel="" tone={selected ? 'primary' : 'secondary'} />
          </View>
          <ThemedText variant="bodySmall" weight={selected ? 'semibold' : 'regular'} style={{ flex: 1 }}>{t(`addresses.kind_${kind}`)}</ThemedText>
          <View style={{ width: theme.sizes.iconMd, height: theme.sizes.iconMd, borderRadius: theme.radii.pill, borderWidth: theme.borderWidths.medium, borderColor: selected ? theme.colors.colorPrimary : theme.colors.colorBorder, alignItems: 'center', justifyContent: 'center' }}>
            {selected ? <View style={{ width: theme.sizes.iconSm - theme.spacing.xs, height: theme.sizes.iconSm - theme.spacing.xs, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorPrimary }} /> : null}
          </View>
        </Pressable>;
      })}
    </View>
  </View>;
}
