import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../atoms/Button';
import { ThemedText } from '../atoms/ThemedText';
import { FormField } from '../molecules/FormField';
import { useTheme } from '../../theme';
import type { DeliveryPlace } from '../../types/models';

type Props = {
  kind: DeliveryPlace['kind']; name: string; selected: boolean; pinValid: boolean;
  places: DeliveryPlace[]; loading: boolean; failed: boolean; error?: string;
  onChange: (name: string) => void; onPick: (place: DeliveryPlace) => void;
  onAdd: () => void; onClear: () => void; onRetry: () => void;
};

/** Directory suggestions are supplied by the form's query hook; this component only renders and dispatches choices. */
export function DeliveryPlacePicker({ kind, name, selected, pinValid, places, loading, failed, error, onChange, onPick, onAdd, onClear, onRetry }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  // The same name may belong to a different society in another locality of this PIN.
  // Confirmation plus the locality field distinguishes it; the server reuses an exact name/locality match.
  const canAdd = pinValid && name.trim().length >= 2;
  return <View style={{ gap: theme.spacing.sm }}>
    {selected ? <View style={{ gap: theme.spacing.sm, padding: theme.spacing.md, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, borderRadius: theme.radii.md }}>
      <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t(kind === 'society' ? 'addresses.society' : 'addresses.localityGroup')}</ThemedText>
      <ThemedText variant="bodySmall" weight="semibold">{name}</ThemedText>
      <Button variant="secondary" onPress={onClear}>{t('addresses.changePlace')}</Button>
    </View> : <>
      <FormField label={t(kind === 'society' ? 'addresses.society' : 'addresses.localityGroup')} value={name} onChangeText={onChange} maxLength={150} error={error} helper={t(pinValid ? 'addresses.placeHelp' : 'addresses.enterPinFirst')} editable={pinValid} />
      {pinValid && loading ? <ThemedText variant="caption" accessibilityLiveRegion="polite">{t('addresses.findingPlaces')}</ThemedText> : null}
      {pinValid && failed ? <View style={{ gap: theme.spacing.sm }}><ThemedText variant="caption" style={{ color: theme.colors.colorDanger }}>{t('addresses.placesFailed')}</ThemedText><Button variant="secondary" onPress={onRetry}>{t('addresses.retry')}</Button></View> : null}
      {pinValid && !loading && !failed && places.length === 0 && name.trim().length >= 2 ? <ThemedText variant="caption">{t('addresses.noPlaceMatches')}</ThemedText> : null}
      {/* A fixed maximum of six suggestions keeps this inside the keyboard-aware form without a nested virtualized list. Refine the search for other names. */}
      {pinValid && places.length > 0 ? <View style={{ borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, borderRadius: theme.radii.md }}>
        {places.slice(0, 6).map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.name} onPress={() => onPick(item)} style={({ pressed }) => ({ minHeight: theme.layout.touchTargetMin, justifyContent: 'center', gap: theme.spacing.xs, padding: theme.spacing.md, backgroundColor: pressed ? theme.colors.colorSurfaceMuted : theme.colors.colorSurface })}>
          <ThemedText variant="bodySmall" weight="medium">{item.name}</ThemedText>
          {item.locality ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{item.locality}</ThemedText> : null}
        </Pressable>)}
      </View> : null}
      {canAdd ? <Button variant="secondary" onPress={onAdd}>{t('addresses.addPlace', { name: name.trim() })}</Button> : null}
    </>}
  </View>;
}
