/**
 * Se o canal for um ticket aberto, devolve o ticket e a opção correspondente.
 */
import type { Ticket } from '../domain/ticket/Ticket.js';
import type { TicketOption } from '../domain/ticket/TicketOption.js';
import type { TicketOptionRepository } from '../domain/ticket/TicketOptionRepository.js';
import type { TicketRepository } from '../domain/ticket/TicketRepository.js';

export interface TicketChannelContext {
  ticket: Ticket;
  option: TicketOption | null;
}

export class ResolveTicketChannelUseCase {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly options: TicketOptionRepository,
  ) {}

  async execute(channelId: string): Promise<TicketChannelContext | null> {
    const ticket = await this.tickets.findOpenByChannelId(channelId);
    if (!ticket) {
      return null;
    }

    const option = await this.options.findById(ticket.optionId);
    return { ticket, option };
  }
}
