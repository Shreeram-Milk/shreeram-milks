import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDeliveryPlaces } from '../services/deliveryPlaceService';
import { useSessionStore } from '../store/useSessionStore';
import type { DeliveryPlace } from '../types/models';
import { queryKeys } from '../services/queryKeys';

export function useDeliveryPlaces(pinCode: string, kind: DeliveryPlace['kind'], search: string, enabled: boolean) {
  const customerId = useSessionStore(state => state.customer?.id ?? '');
  const [debounced, setDebounced] = useState(search.trim());
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  const ready = debounced === search.trim();
  const result = useQuery({
    queryKey: queryKeys.deliveryPlaces(customerId, pinCode, kind, debounced),
    queryFn: () => fetchDeliveryPlaces(pinCode, kind, debounced),
    enabled: enabled && customerId !== '' && /^[1-9]\d{5}$/.test(pinCode) && ready,
    staleTime: 30_000,
  });
  return { ...result, data: ready ? result.data : undefined, isDebouncing: !ready };
}
