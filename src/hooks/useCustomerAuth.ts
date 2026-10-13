import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { deleteMyAccount, requestSignInCode, saveMyProfile, verifySignInCode } from '../services/customerService';
import { useSessionStore } from '../store/useSessionStore';
import type { ProfileInput } from '../types/customer';

export const useRequestCode = () => useMutation({ mutationFn: (phone: string) => requestSignInCode(phone) });

export function useVerifyCode() {
  const startSession = useSessionStore((state) => state.startSession);
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => verifySignInCode(phone, code, Platform.OS),
    onSuccess: ({ token, customer }) => startSession(token, customer),
  });
}

export function useSaveProfile() {
  const setCustomer = useSessionStore((state) => state.setCustomer);
  return useMutation({ mutationFn: (input: ProfileInput) => saveMyProfile(input), onSuccess: setCustomer });
}

export function useDeleteAccount() {
  const endSessionLocally = useSessionStore((state) => state.endSessionLocally);
  return useMutation({ mutationFn: deleteMyAccount, onSuccess: endSessionLocally });
}
