import type { DeliveryAddress, DeliveryDetails } from '../types/models';

export const emptyDeliveryDetails = (): DeliveryDetails => ({ building: '', towerWing: '', floor: '', unit: '', lane: '' });

/** No guessed house, wing or floor: unknown details stay blank. */
export function parseDeliveryDetails(raw: unknown): DeliveryDetails {
  const input = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
  return Object.fromEntries(Object.keys(emptyDeliveryDetails()).map(key => [key, typeof input[key] === 'string' ? input[key] : ''])) as DeliveryDetails;
}

export function deliveryDetailsBody(address: Pick<DeliveryAddress, 'deliveryDetails' | 'deliveryDetailsConfirmed'>) {
  const parsed = parseDeliveryDetails(address.deliveryDetails);
  return {
    deliveryDetails: Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, value.trim()])),
    deliveryDetailsConfirmed: address.deliveryDetailsConfirmed === true,
  };
}

/** Applies to starting a new checkout only, never reconciliation of an existing payment. */
export const needsDeliveryClarification = (address: Pick<DeliveryAddress, 'deliveryDetailsConfirmed'> | undefined) => Boolean(address && address.deliveryDetailsConfirmed !== true);

/** Suggestions can fill blanks only. They cannot replace a detail the customer already typed. */
export function fillMissingDeliveryDetails(current: DeliveryDetails, suggestion: DeliveryDetails): DeliveryDetails {
  return Object.fromEntries(Object.entries(current).map(([key, value]) => [key, value.trim() ? value : suggestion[key as keyof DeliveryDetails]])) as DeliveryDetails;
}
