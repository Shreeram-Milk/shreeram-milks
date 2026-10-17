import type { CustomerProfile, ProfileInput, SignInResult } from '../types/customer';
import { ApiRequestError, apiGet, apiSend, hasApi } from './apiClient';

const record = (value: unknown): Record<string, unknown> | null => (typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null);
const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Checks the customer the server describes; a malformed answer is an error, never a half-filled profile. */
export function parseCustomer(raw: unknown): CustomerProfile {
  const item = record(raw);
  const id = text(item?.id);
  if (!item || !id) throw new ApiRequestError('UNKNOWN_ERROR', 0);
  return { id, email: text(item.email), phone: text(item.phone), name: text(item.name), language: item.language === 'gu' ? 'gu' : 'en', needsProfile: item.needsProfile === true };
}

/** Sign-in needs the real backend; there is no sample sign-in, so a missing address reads as "no connection". */
const requireApi = (): void => {
  if (!hasApi()) throw new ApiRequestError('NETWORK_ERROR', 0);
};

export async function requestSignInCode(email: string): Promise<void> {
  requireApi();
  await apiSend('POST', '/customer/auth/request-code', { email });
}

export async function verifySignInCode(email: string, code: string, deviceLabel: string): Promise<SignInResult> {
  requireApi();
  const body = record(await apiSend<unknown>('POST', '/customer/auth/verify', { email, code, deviceLabel }));
  const token = text(body?.token);
  if (!body || !token) throw new ApiRequestError('UNKNOWN_ERROR', 0);
  return { token, customer: parseCustomer(body.customer), isNewCustomer: body.isNewCustomer === true };
}

export async function fetchMyProfile(): Promise<CustomerProfile> {
  requireApi();
  return parseCustomer(record(await apiGet<unknown>('/customer/me', { auth: true }))?.customer);
}

export async function saveMyProfile(input: ProfileInput): Promise<CustomerProfile> {
  requireApi();
  return parseCustomer(record(await apiSend<unknown>('PUT', '/customer/me', input, { auth: true }))?.customer);
}

export async function signOutOnServer(): Promise<void> {
  if (!hasApi()) return;
  await apiSend('POST', '/customer/auth/logout', undefined, { auth: true });
}

export async function deleteMyAccount(): Promise<void> {
  requireApi();
  await apiSend('DELETE', '/customer/me', undefined, { auth: true });
}
