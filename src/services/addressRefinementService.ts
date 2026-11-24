import { ApiRequestError, apiGet, apiSend } from './apiClient';
import { parseDeliveryDetails } from '../lib/deliveryDetails';
import type { DeliveryDetails } from '../types/models';

export async function fetchAddressRefinementStatus(): Promise<boolean> {
  const response = await apiGet<unknown>('/customer/address-refinement/status', { auth: true });
  if (typeof response !== 'object' || response === null || !('available' in response) || typeof response.available !== 'boolean') throw new ApiRequestError('UNKNOWN_ERROR', 0);
  return response.available;
}

export async function requestAddressRefinement(addressId: string): Promise<{ deliveryDetails: DeliveryDetails; addressFingerprint: string } | null> {
  const response = await apiSend<unknown>('POST', `/customer/addresses/${encodeURIComponent(addressId)}/refinement`, { consented: true }, { auth: true });
  if (typeof response !== 'object' || response === null || !('available' in response)) throw new ApiRequestError('UNKNOWN_ERROR', 0);
  if (response.available === false) return null;
  const row = response as Record<string, unknown>;
  const suggestion = typeof row.suggestion === 'object' && row.suggestion !== null ? row.suggestion as Record<string, unknown> : null;
  const details = suggestion?.deliveryDetails;
  if (row.available !== true || row.requiresReview !== true || typeof row.addressFingerprint !== 'string' || typeof details !== 'object' || details === null) throw new ApiRequestError('UNKNOWN_ERROR', 0);
  for (const key of Object.keys(parseDeliveryDetails({}))) {
    const value = (details as Record<string, unknown>)[key];
    if (typeof value !== 'string' || value.length > 100) throw new ApiRequestError('UNKNOWN_ERROR', 0);
  }
  return { deliveryDetails: parseDeliveryDetails(details), addressFingerprint: row.addressFingerprint };
}
