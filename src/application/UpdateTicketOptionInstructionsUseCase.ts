/**
 * Atualiza as instruções de IA de uma opção de ticket.
 */
import type { TicketOption } from '../domain/ticket/TicketOption.js';
import type { TicketOptionRepository } from '../domain/ticket/TicketOptionRepository.js';
import { AppError } from '../shared/errors.js';

export class UpdateTicketOptionInstructionsUseCase {
  constructor(private readonly options: TicketOptionRepository) {}

  async execute(id: number, guildId: string, aiInstructions: string | null): Promise<TicketOption> {
    const option = await this.options.findById(id);

    if (!option || option.guildId !== guildId) {
      throw new AppError('Opção de ticket inexistente', 'Não achei essa opção neste servidor.');
    }

    const next: TicketOption = {
      ...option,
      aiInstructions,
      updatedAt: new Date().toISOString(),
    };

    await this.options.update(next);
    return next;
  }
}
