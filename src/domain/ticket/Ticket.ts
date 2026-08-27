export type TicketStatus = 'open' | 'closed';

export interface Ticket {
  id: number;
  guildId: string;
  optionId: number;
  channelId: string;
  userId: string;
  status: TicketStatus;
  createdAt: string;
  closedAt: string | null;
}

export interface NewTicket {
  guildId: string;
  optionId: number;
  channelId: string;
  userId: string;
}
