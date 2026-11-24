import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchAddressRefinementStatus, requestAddressRefinement } from '../services/addressRefinementService';
import { useSessionStore } from '../store/useSessionStore';

export function useAddressRefinement(addressId: string) {
  const customerId = useSessionStore(state => state.customer?.id ?? '');
  const status = useQuery({ queryKey: ['address-refinement-status', customerId], queryFn: fetchAddressRefinementStatus, enabled: customerId !== '' && addressId !== '', staleTime: 60_000 });
  const proposal = useMutation({ mutationFn: () => requestAddressRefinement(addressId) });
  return { available: status.data === true, proposal };
}
