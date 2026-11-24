import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAddressRefinement } from '../../hooks/useAddressRefinement';
import { fillMissingDeliveryDetails } from '../../lib/deliveryDetails';
import { describeError } from '../../services/errorMapper';
import { useTheme } from '../../theme';
import type { DeliveryDetails } from '../../types/models';
import { Button } from '../atoms/Button';
import { ThemedText } from '../atoms/ThemedText';
import { SubscriptionBottomSheet } from './SubscriptionBottomSheet';

/** Optional help is offered only when enabled. Suggestions stay in this review sheet until explicitly accepted. */
export function AddressRefinement({ addressId, current, disabled, onAccept }: { addressId: string; current: DeliveryDetails; disabled: boolean; onAccept: (details: DeliveryDetails) => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { available, proposal } = useAddressRefinement(addressId);
  const [open, setOpen] = useState(false);
  if (!available) return null;
  const close = () => { setOpen(false); proposal.reset(); };
  const suggested = proposal.data?.deliveryDetails;
  const nonempty = suggested ? Object.entries(suggested).filter(([, value]) => value.trim()) : [];
  return <>
    <Button variant="secondary" disabled={disabled} onPress={() => setOpen(true)}>{t('addresses.refinementHelp')}</Button>
    {disabled ? <ThemedText variant="caption">{t('addresses.refinementSaveFirst')}</ThemedText> : null}
    <SubscriptionBottomSheet visible={open} onClose={close}>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.lg }}>
        <ThemedText variant="h2">{t(suggested ? 'addresses.refinementReview' : 'addresses.refinementHelp')}</ThemedText>
        {suggested ? <>
          <ThemedText variant="bodySmall">{t('addresses.refinementReviewHint')}</ThemedText>
          {nonempty.map(([key, value]) => <View key={key} style={{ gap: theme.spacing.xs }}><ThemedText variant="caption">{t(`addresses.detail_${key}`)}</ThemedText><ThemedText variant="bodySmall">{value}</ThemedText></View>)}
          {nonempty.length === 0 ? <ThemedText variant="bodySmall">{t('addresses.refinementEmpty')}</ThemedText> : null}
          <Button onPress={() => { onAccept(fillMissingDeliveryDetails(current, suggested)); close(); }}>{t('addresses.refinementAccept')}</Button>
        </> : <>
          <ThemedText variant="bodySmall">{t('addresses.refinementConsent')}</ThemedText>
          {proposal.isError || proposal.data === null ? <ThemedText variant="caption" style={{ color: theme.colors.colorDanger }}>{proposal.isError ? describeError(proposal.error) : t('addresses.refinementUnavailable')}</ThemedText> : null}
          <Button loading={proposal.isPending} onPress={() => proposal.mutate()}>{t('addresses.refinementSend')}</Button>
        </>}
        <Button variant="secondary" onPress={close}>{t('addresses.refinementManual')}</Button>
      </ScrollView>
    </SubscriptionBottomSheet>
  </>;
}
