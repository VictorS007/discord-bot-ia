import type { NewTicket, Ticket } from './Ticket.js';

export interface TicketRepository {
  create(input: NewTicket): Promise<Ticket>;
  findOpenByUserAndOption(guildId: string, userId: string, optionId: number): Promise<Ticket | null>;
  findOpenByChannelId(channelId: string): Promise<Ticket | null>;
  close(ticketId: number): Promise<void>;
  deleteByGuildId(guildId: string): Promise<void>;
}
