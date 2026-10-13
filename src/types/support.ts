export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/** One report the signed-in customer sent. No staff names or internal fields ever reach the phone. */
export interface CustomerTicket {
  id: string;
  /** What the customer and support quote, like TKT-1001. */
  reference: string;
  category: string;
  status: TicketStatus;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  author: 'customer' | 'support';
  body: string;
  createdAt: string;
}

export interface TicketThread {
  ticket: CustomerTicket;
  messages: TicketMessage[];
}
