import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FormField } from '../molecules/FormField';
import { ThemedText } from '../atoms/ThemedText';
import { useTheme } from '../../theme';
import type { AddressKind, DeliveryDetails } from '../../types/models';

export function DeliveryDetailsFields({ kind, value, onChange, confirmed, onConfirm, error }: { kind: AddressKind; value: DeliveryDetails; onChange: (details: DeliveryDetails) => void; confirmed: boolean; onConfirm: (confirmed: boolean) => void; error?: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const fields: (keyof DeliveryDetails)[] = kind === 'society' ? ['building', 'towerWing', 'floor', 'unit'] : ['lane', 'unit', 'floor'];
  return <View style={{ gap: theme.spacing.md }}>
    <ThemedText variant="bodySmall" weight="semibold">{t('addresses.detailsTitle')}</ThemedText>
    <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t('addresses.detailsHint')}</ThemedText>
    {fields.map(field => <FormField key={field} label={t(`addresses.detail_${field}`)} maxLength={100} value={value[field]} onChangeText={text => onChange({ ...value, [field]: text })} />)}
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: confirmed }} onPress={() => onConfirm(!confirmed)} style={{ minHeight: theme.layout.touchTargetMin, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, borderWidth: theme.borderWidths.hairline, borderColor: confirmed ? theme.colors.colorPrimary : theme.colors.colorBorder, borderRadius: theme.radii.md, backgroundColor: confirmed ? theme.colors.colorPrimaryTint : theme.colors.colorSurface }}>
      <ThemedText variant="bodySmall" weight="semibold">{confirmed ? '✓' : '○'}</ThemedText>
      <ThemedText variant="bodySmall" style={{ flex: 1 }}>{t('addresses.detailsConfirm')}</ThemedText>
    </Pressable>
    {error ? <ThemedText variant="caption" accessibilityRole="alert" style={{ color: theme.colors.colorDanger }}>{error}</ThemedText> : null}
  </View>;
}
