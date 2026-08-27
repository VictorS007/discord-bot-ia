/**
 * Cadastra uma opção de ticket no painel de um canal.
 */
import type { NewTicketOption, TicketOption } from '../domain/ticket/TicketOption.js';
import { TICKET_OPTIONS_PER_CHANNEL_LIMIT } from '../domain/ticket/TicketOption.js';
import type { TicketOptionRepository } from '../domain/ticket/TicketOptionRepository.js';
import { DuplicateTicketOptionError, TicketOptionLimitError } from '../shared/errors.js';

export class AddTicketOptionUseCase {
  constructor(private readonly options: TicketOptionRepository) {}

  async execute(input: NewTicketOption): Promise<TicketOption> {
    const label = input.label.trim();
    const existing = await this.options.listByPanelChannel(input.guildId, input.panelChannelId);

    if (existing.length >= TICKET_OPTIONS_PER_CHANNEL_LIMIT) {
      throw new TicketOptionLimitError(TICKET_OPTIONS_PER_CHANNEL_LIMIT);
    }

    if (existing.some((option) => option.label.toLowerCase() === label.toLowerCase())) {
      throw new DuplicateTicketOptionError(label);
    }

    return this.options.create({ ...input, label });
  }
}
