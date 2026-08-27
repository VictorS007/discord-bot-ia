/**
 * Abre um ticket em duas etapas: valida a opção, depois registra o canal criado.
 */
import type { NewTicket, Ticket } from '../domain/ticket/Ticket.js';
import type { TicketOption } from '../domain/ticket/TicketOption.js';
import type { TicketOptionRepository } from '../domain/ticket/TicketOptionRepository.js';
import type { TicketRepository } from '../domain/ticket/TicketRepository.js';
import { AppError, TicketAlreadyOpenError } from '../shared/errors.js';

export class OpenTicketUseCase {
  constructor(
    private readonly options: TicketOptionRepository,
    private readonly tickets: TicketRepository,
  ) {}

  async prepare(optionId: number, guildId: string, userId: string): Promise<TicketOption> {
    const option = await this.options.findById(optionId);

    if (!option || option.guildId !== guildId) {
      throw new AppError(
        'Opção de ticket inválida',
        'Essa opção de ticket não existe mais. Peça para o dono do bot republicar o painel.',
      );
    }

    const open = await this.tickets.findOpenByUserAndOption(guildId, userId, optionId);

    if (open) {
      throw new TicketAlreadyOpenError(open.channelId);
    }

    return option;
  }

  async register(input: NewTicket): Promise<Ticket> {
    return this.tickets.create(input);
  }
}
