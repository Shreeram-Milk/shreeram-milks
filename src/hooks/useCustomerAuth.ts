import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { deleteMyAccount, requestSignInCode, saveMyProfile, signInWithGoogleToken, verifySignInCode } from '../services/customerService';
import { getGoogleIdToken } from '../services/googleSignIn';
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

/** Opens Google's account chooser, then signs in with what Google returns. Resolves to null when the customer closes the chooser. */
export function useGoogleSignIn() {
  const startSession = useSessionStore((state) => state.startSession);
  return useMutation({
    mutationFn: async () => {
      const idToken = await getGoogleIdToken();
      return idToken ? signInWithGoogleToken(idToken, Platform.OS) : null;
    },
    onSuccess: (result) => { if (result) startSession(result.token, result.customer); },
  });
}

export function useDeleteAccount() {
  const endSessionLocally = useSessionStore((state) => state.endSessionLocally);
  return useMutation({ mutationFn: deleteMyAccount, onSuccess: endSessionLocally });
}
