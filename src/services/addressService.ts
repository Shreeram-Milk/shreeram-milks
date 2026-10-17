import type { AddressType, DeliveryAddress, DoorstepInstructions } from '../types/models';
import { ApiRequestError, apiGet, apiSend, hasApi } from './apiClient';

const record = (value: unknown): Record<string, unknown> | null => (typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null);
const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const ADDRESS_TYPES: readonly AddressType[] = ['home', 'work', 'other'];
const DROP_LOCATIONS: readonly DoorstepInstructions['dropLocation'][] = ['front-door', 'side-gate', 'milk-box', 'security-desk'];
const HANDOFFS: readonly DoorstepInstructions['handoff'][] = ['hand-to-me', 'leave-at-door', 'milk-box', 'security'];

/** Addresses need the real backend and a signed-in customer; there is no sample list to fall back on. */
const requireApi = (): void => {
  if (!hasApi()) throw new ApiRequestError('NETWORK_ERROR', 0);
};

/** "+919824612345" -> "9824612345": the form works with the 10 digits a customer types. */
const tenDigits = (phone: string): string => phone.replace(/^\+91/, '').replace(/\D/g, '');

/** Checks one address from the server. A malformed record is dropped rather than shown half-filled. */
export function parseAddress(raw: unknown): DeliveryAddress | null {
  const item = record(raw);
  const id = text(item?.id);
  const type = ADDRESS_TYPES.find((candidate) => candidate === item?.label);
  if (!item || !id || !type) return null;
  return {
    id,
    addressType: type,
    fullName: text(item.recipientName),
    phone: tenDigits(text(item.recipientPhone)),
    line1: text(item.line1),
    line2: text(item.line2),
    landmark: text(item.landmark),
    city: text(item.city),
    pincode: text(item.pinCode),
    isDefault: item.isDefault === true,
  };
}

export function parseInstructions(raw: unknown): DoorstepInstructions {
  const item = record(raw);
  return {
    dropLocation: DROP_LOCATIONS.find((candidate) => candidate === item?.dropLocation) ?? 'front-door',
    handoff: HANDOFFS.find((candidate) => candidate === item?.handoff) ?? 'leave-at-door',
    noDoorbell: item?.noDoorbell === true,
    noCall: item?.noCall === true,
    notifyAfterDelivery: item?.notifyAfterDelivery !== false,
    additionalInstructions: text(item?.additionalInstructions),
  };
}

export type AddressDraft = Omit<DeliveryAddress, 'id'>;

const toBody = (draft: AddressDraft) => ({
  label: draft.addressType,
  recipientName: draft.fullName.trim(),
  recipientPhone: `+91${draft.phone.replace(/\D/g, '')}`,
  line1: draft.line1.trim(),
  line2: draft.line2.trim(),
  landmark: draft.landmark.trim(),
  city: draft.city.trim(),
  pinCode: draft.pincode.trim(),
  isDefault: draft.isDefault,
});

export async function fetchAddresses(): Promise<DeliveryAddress[]> {
  requireApi();
  const body = record(await apiGet<unknown>('/customer/addresses', { auth: true }));
  return Array.isArray(body?.addresses) ? body.addresses.map(parseAddress).filter((address): address is DeliveryAddress => address !== null) : [];
}

export async function saveAddress(draft: AddressDraft, id?: string): Promise<DeliveryAddress> {
  requireApi();
  const body = record(await (id ? apiSend<unknown>('PUT', `/customer/addresses/${encodeURIComponent(id)}`, toBody(draft), { auth: true }) : apiSend<unknown>('POST', '/customer/addresses', toBody(draft), { auth: true })));
  const address = parseAddress(body?.address);
  if (!address) throw new ApiRequestError('UNKNOWN_ERROR', 0);
  return address;
}

export async function removeAddress(id: string): Promise<void> {
  requireApi();
  await apiSend('DELETE', `/customer/addresses/${encodeURIComponent(id)}`, undefined, { auth: true });
}

export async function fetchInstructions(): Promise<DoorstepInstructions> {
  requireApi();
  return parseInstructions(record(await apiGet<unknown>('/customer/doorstep-instructions', { auth: true }))?.instructions);
}

export async function saveInstructions(instructions: DoorstepInstructions): Promise<DoorstepInstructions> {
  requireApi();
  return parseInstructions(record(await apiSend<unknown>('PUT', '/customer/doorstep-instructions', instructions, { auth: true }))?.instructions);
}
