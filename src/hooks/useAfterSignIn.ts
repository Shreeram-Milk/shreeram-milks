import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { fetchAddresses } from '../services/addressService';
import { queryKeys } from '../services/queryKeys';
import { useAppStore } from '../store/useAppStore';
import type { CustomerProfile } from '../types/customer';
import { pickDefaultAddress } from './useAddresses';

/**
 * Where a customer goes right after signing in, by email code or by Google: a new customer first fills in their name; one who has
 * already set up a delivery address skips the location step (their default address becomes the delivery PIN) and lands on Home.
 */
export function useAfterSignIn() {
  const client = useQueryClient();
  const [routing, setRouting] = useState(false);

  const continueAfterSignIn = async (customer: CustomerProfile) => {
    if (customer.needsProfile) {
      router.replace({ pathname: '/edit-profile', params: { first: '1' } });
      return;
    }
    setRouting(true);
    try {
      const address = pickDefaultAddress(await client.fetchQuery({ queryKey: queryKeys.addresses(customer.id), queryFn: fetchAddresses, staleTime: 15_000 }));
      if (address) {
        useAppStore.getState().setDeliveryPin(address.pincode);
        router.replace('/home');
        return;
      }
    } catch {
      // The address list could not be loaded; the location step still works, so carry on there.
    }
    router.replace('/location');
  };

  return { routing, continueAfterSignIn };
}
