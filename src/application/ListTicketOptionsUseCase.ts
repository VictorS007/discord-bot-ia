/**
 * Lista as opções de ticket do servidor, ou só as de um canal do painel.
 */
import type { TicketOption } from '../domain/ticket/TicketOption.js';
import type { TicketOptionRepository } from '../domain/ticket/TicketOptionRepository.js';

export class ListTicketOptionsUseCase {
  constructor(private readonly options: TicketOptionRepository) {}

  async execute(guildId: string, panelChannelId?: string): Promise<TicketOption[]> {
    if (panelChannelId) {
      return this.options.listByPanelChannel(guildId, panelChannelId);
    }

    return this.options.listByGuild(guildId);
  }
}
