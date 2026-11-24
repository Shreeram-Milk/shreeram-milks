import type { AddressKind, DeliveryAddress } from '../types/models';

const text = (value: unknown): string => typeof value === 'string' ? value : '';
const kinds: readonly AddressKind[] = ['society', 'independent', 'unspecified'];

/** Older API responses remain usable; missing grouping never invents a society. */
export function parseAddressGrouping(item: Record<string, unknown>) {
  return {
    addressKind: kinds.find(kind => kind === item.addressKind) ?? 'unspecified',
    deliveryPlaceId: typeof item.deliveryPlaceId === 'string' && item.deliveryPlaceId ? item.deliveryPlaceId : null,
    deliveryPlaceName: text(item.deliveryPlaceName),
    locality: text(item.locality),
  };
}

export function addressGroupingBody(address: Pick<DeliveryAddress, 'addressKind' | 'deliveryPlaceId' | 'deliveryPlaceName' | 'locality'>) {
  const addressKind = address.addressKind ?? 'unspecified';
  return {
    addressKind,
    deliveryPlaceId: addressKind === 'unspecified' ? null : address.deliveryPlaceId || null,
    deliveryPlaceName: addressKind === 'unspecified' ? '' : (address.deliveryPlaceName ?? '').trim(),
    locality: (address.locality ?? '').trim(),
  };
}

/** Keep delivery directions and the original address visible alongside the structured group. */
export function addressLines(address: Pick<DeliveryAddress, 'line1' | 'line2' | 'deliveryPlaceName' | 'locality' | 'landmark' | 'deliveryDetails'>): string {
  const seen = new Set<string>();
  return [address.line1, address.deliveryPlaceName, address.deliveryDetails?.building, address.deliveryDetails?.towerWing, address.deliveryDetails?.unit, address.deliveryDetails?.floor, address.deliveryDetails?.lane, address.line2, address.locality, address.landmark].filter((value): value is string => {
    if (!value?.trim()) return false;
    const key = value.trim().toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(value => value.trim()).join(', ');
}
