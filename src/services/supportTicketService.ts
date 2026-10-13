import type { CustomerTicket, TicketMessage, TicketStatus, TicketThread } from '../types/support';
import { ApiRequestError, apiGet, apiSend, hasApi } from './apiClient';

const record = (value: unknown): Record<string, unknown> | null => (typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null);
const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const STATUSES: readonly TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

/** Reports need the real backend and a signed-in customer; there is no sample list to fall back on. */
const requireApi = (): void => {
  if (!hasApi()) throw new ApiRequestError('NETWORK_ERROR', 0);
};

export function parseTicket(raw: unknown): CustomerTicket | null {
  const item = record(raw);
  const id = text(item?.id);
  const status = STATUSES.find((candidate) => candidate === item?.status);
  if (!item || !id || !status || !text(item.reference)) return null;
  return { id, reference: text(item.reference), category: text(item.category), status, messageCount: typeof item.messageCount === 'number' ? item.messageCount : 0, createdAt: text(item.createdAt), updatedAt: text(item.updatedAt) };
}

function parseThread(raw: unknown): TicketThread {
  const body = record(raw);
  const ticket = parseTicket(body?.ticket);
  if (!ticket) throw new ApiRequestError('UNKNOWN_ERROR', 0);
  const messages = Array.isArray(body?.messages)
    ? body.messages.flatMap((entry): TicketMessage[] => {
        const message = record(entry);
        const id = text(message?.id);
        return message && id && text(message.body) ? [{ id, author: message.author === 'support' ? 'support' : 'customer', body: text(message.body), createdAt: text(message.createdAt) }] : [];
      })
    : [];
  return { ticket, messages };
}

export async function sendReport(input: { category: string; description: string }): Promise<CustomerTicket> {
  requireApi();
  const ticket = parseTicket(record(await apiSend<unknown>('POST', '/customer/support/tickets', input, { auth: true }))?.ticket);
  if (!ticket) throw new ApiRequestError('UNKNOWN_ERROR', 0);
  return ticket;
}

export async function fetchMyTickets(): Promise<CustomerTicket[]> {
  requireApi();
  const body = record(await apiGet<unknown>('/customer/support/tickets?pageSize=50', { auth: true }));
  return Array.isArray(body?.rows) ? body.rows.map(parseTicket).filter((ticket): ticket is CustomerTicket => ticket !== null) : [];
}

export async function fetchMyTicket(id: string): Promise<TicketThread> {
  requireApi();
  return parseThread(await apiGet<unknown>(`/customer/support/tickets/${encodeURIComponent(id)}`, { auth: true }));
}

export async function replyToTicket(id: string, body: string): Promise<TicketThread> {
  requireApi();
  return parseThread(await apiSend<unknown>('POST', `/customer/support/tickets/${encodeURIComponent(id)}/messages`, { body }, { auth: true }));
}
