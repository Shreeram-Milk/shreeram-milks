import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchAddresses, fetchInstructions, removeAddress, saveAddress, saveInstructions, type AddressDraft } from '../services/addressService';
import { queryKeys } from '../services/queryKeys';
import { useSessionStore } from '../store/useSessionStore';
import type { DeliveryAddress, DoorstepInstructions } from '../types/models';

/** The signed-in customer's saved addresses. Never cached for long: whether a PIN is served can change in the admin. */
export function useAddresses() {
  const customerId = useSessionStore((state) => state.customer?.id ?? '');
  return useQuery({ queryKey: queryKeys.addresses(customerId), queryFn: fetchAddresses, enabled: customerId !== '', staleTime: 15_000 });
}

/** The default address, or the first one if none is marked (the server always marks one). */
export const pickDefaultAddress = (addresses: DeliveryAddress[] | undefined): DeliveryAddress | undefined => addresses?.find((address) => address.isDefault) ?? addresses?.[0];

export function useSaveAddress() {
  const client = useQueryClient();
  const customerId = useSessionStore((state) => state.customer?.id ?? '');
  return useMutation({
    mutationFn: ({ draft, id }: { draft: AddressDraft; id?: string }) => saveAddress(draft, id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.addresses(customerId) }),
  });
}

export function useRemoveAddress() {
  const client = useQueryClient();
  const customerId = useSessionStore((state) => state.customer?.id ?? '');
  return useMutation({ mutationFn: (id: string) => removeAddress(id), onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.addresses(customerId) }) });
}

export function useDoorstepInstructions() {
  const customerId = useSessionStore((state) => state.customer?.id ?? '');
  return useQuery({ queryKey: queryKeys.instructions(customerId), queryFn: fetchInstructions, enabled: customerId !== '', staleTime: 60_000 });
}

export function useSaveDoorstepInstructions() {
  const client = useQueryClient();
  const customerId = useSessionStore((state) => state.customer?.id ?? '');
  return useMutation({
    mutationFn: (instructions: DoorstepInstructions) => saveInstructions(instructions),
    onSuccess: (saved) => client.setQueryData(queryKeys.instructions(customerId), saved),
  });
}
