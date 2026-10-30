import { useEffect } from 'react';

import { useAppStore } from '../store/useAppStore';
import { pickDefaultAddress, useAddresses } from './useAddresses';

/**
 * The delivery PIN code is the one on the customer's saved default address: product pages, delivery windows and prices all follow it,
 * and it is never typed on its own. Changing the default address changes it.
 */
export function useSavedDeliveryPin() {
  const { data: addresses } = useAddresses();
  const pin = pickDefaultAddress(addresses)?.pincode ?? '';
  useEffect(() => {
    if (pin && useAppStore.getState().deliveryPin !== pin) useAppStore.getState().setDeliveryPin(pin);
  }, [pin]);
}
