import type { DeliveryPlace } from '../types/models';
import { ApiRequestError, apiGet, hasApi } from './apiClient';

/** A bounded list of shared names, never customer names, phone numbers or house addresses. */
export type DirectoryStatus = 'ready' | 'unavailable' | 'limited' | 'not-configured';

export async function fetchDeliveryPlaces(pinCode: string, kind: DeliveryPlace['kind'], search: string): Promise<{ places: DeliveryPlace[]; directoryStatus: DirectoryStatus }> {
  if (!hasApi()) throw new ApiRequestError('NETWORK_ERROR', 0);
  const query = new URLSearchParams({ external: '1', pinCode, kind, search: search.trim().slice(0, 100) });
  const response = await apiGet<unknown>(`/customer/delivery-places?${query}`, { auth: true });
  if (typeof response !== 'object' || response === null || !('places' in response) || !Array.isArray(response.places)) throw new ApiRequestError('UNKNOWN_ERROR', 0);
  const status = 'directoryStatus' in response ? response.directoryStatus : 'not-configured';
  const directoryStatus: DirectoryStatus = status === 'ready' || status === 'unavailable' || status === 'limited' ? status : 'not-configured';
  const places = response.places.slice(0, 20).map((value): DeliveryPlace => {
    if (typeof value !== 'object' || value === null) throw new ApiRequestError('UNKNOWN_ERROR', 0);
    const row = value as Record<string, unknown>;
    if (typeof row.id !== 'string' || typeof row.name !== 'string' || !row.name.trim() || typeof row.locality !== 'string' || row.pinCode !== pinCode || row.kind !== kind || (row.status !== 'pending' && row.status !== 'approved')) throw new ApiRequestError('UNKNOWN_ERROR', 0);
    return { source: row.source === 'geoapify' ? 'geoapify' : undefined, id: row.id, name: row.name, locality: row.locality, pinCode, kind, status: row.status };
  });
  return { places, directoryStatus };
}
