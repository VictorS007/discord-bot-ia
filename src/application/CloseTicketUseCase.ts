/**
 * Encerra um ticket aberto (pelo canal ou pelo id).
 */
import type { Ticket } from '../domain/ticket/Ticket.js';
import type { TicketRepository } from '../domain/ticket/TicketRepository.js';
import { TicketNotFoundError } from '../shared/errors.js';

export class CloseTicketUseCase {
  constructor(private readonly tickets: TicketRepository) {}

  async findOpenByChannel(channelId: string): Promise<Ticket> {
    const ticket = await this.tickets.findOpenByChannelId(channelId);

    if (!ticket) {
      throw new TicketNotFoundError();
    }

    return ticket;
  }

  async executeByChannel(channelId: string): Promise<Ticket> {
    const ticket = await this.findOpenByChannel(channelId);
    await this.tickets.close(ticket.id);
    return ticket;
  }
}
