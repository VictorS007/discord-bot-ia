/**
 * Apaga opções, tickets e painéis quando o bot sai do servidor.
 */
import type { TicketOptionRepository } from '../domain/ticket/TicketOptionRepository.js';
import type { TicketPanelRepository } from '../domain/ticket/TicketPanel.js';
import type { TicketRepository } from '../domain/ticket/TicketRepository.js';

export class PurgeGuildTicketsUseCase {
  constructor(
    private readonly options: TicketOptionRepository,
    private readonly tickets: TicketRepository,
    private readonly panels: TicketPanelRepository,
  ) {}

  async execute(guildId: string): Promise<void> {
    await this.tickets.deleteByGuildId(guildId);
    await this.panels.deleteByGuildId(guildId);
    await this.options.deleteByGuildId(guildId);
  }
}
