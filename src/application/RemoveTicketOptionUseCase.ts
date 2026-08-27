/**
 * Remove uma opção de ticket deste servidor.
 */
import type { TicketOption } from '../domain/ticket/TicketOption.js';
import type { TicketOptionRepository } from '../domain/ticket/TicketOptionRepository.js';
import { AppError } from '../shared/errors.js';

export class RemoveTicketOptionUseCase {
  constructor(private readonly options: TicketOptionRepository) {}

  async execute(id: number, guildId: string): Promise<TicketOption> {
    const option = await this.options.findById(id);

    if (!option || option.guildId !== guildId) {
      throw new AppError('Opção de ticket inexistente', 'Não achei essa opção neste servidor.');
    }

    await this.options.delete(id, guildId);
    return option;
  }
}
