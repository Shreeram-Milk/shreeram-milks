import type { DeliveryPlace } from '../types/models';
import { ApiRequestError, apiGet, hasApi } from './apiClient';

/** A bounded list of shared names, never customer names, phone numbers or house addresses. */
export async function fetchDeliveryPlaces(pinCode: string, kind: DeliveryPlace['kind'], search: string): Promise<DeliveryPlace[]> {
  if (!hasApi()) throw new ApiRequestError('NETWORK_ERROR', 0);
  const query = new URLSearchParams({ pinCode, kind, search: search.trim().slice(0, 100) });
  const response = await apiGet<unknown>(`/customer/delivery-places?${query}`, { auth: true });
  if (typeof response !== 'object' || response === null || !('places' in response) || !Array.isArray(response.places)) throw new ApiRequestError('UNKNOWN_ERROR', 0);
  return response.places.slice(0, 20).map((value): DeliveryPlace => {
    if (typeof value !== 'object' || value === null) throw new ApiRequestError('UNKNOWN_ERROR', 0);
    const row = value as Record<string, unknown>;
    if (typeof row.id !== 'string' || typeof row.name !== 'string' || !row.name.trim() || typeof row.locality !== 'string' || row.pinCode !== pinCode || row.kind !== kind || (row.status !== 'pending' && row.status !== 'approved')) throw new ApiRequestError('UNKNOWN_ERROR', 0);
    return { id: row.id, name: row.name, locality: row.locality, pinCode, kind, status: row.status };
  });
}
