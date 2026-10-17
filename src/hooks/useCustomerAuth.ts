import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { deleteMyAccount, requestSignInCode, saveMyProfile, verifySignInCode } from '../services/customerService';
import { useSessionStore } from '../store/useSessionStore';
import type { ProfileInput } from '../types/customer';

export const useRequestCode = () => useMutation({ mutationFn: (email: string) => requestSignInCode(email) });

export function useVerifyCode() {
  const startSession = useSessionStore((state) => state.startSession);
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => verifySignInCode(email, code, Platform.OS),
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
