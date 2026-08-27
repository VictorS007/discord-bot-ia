/**
 * Se alguém apagar o canal do ticket, marca o registro como fechado.
 */
import type { DMChannel, NonThreadGuildBasedChannel } from 'discord.js';
import type { AppDependencies } from '../../container.js';
import { TicketNotFoundError } from '../../shared/errors.js';

export async function onChannelDelete(
  channel: DMChannel | NonThreadGuildBasedChannel,
  deps: AppDependencies,
): Promise<void> {
  try {
    await deps.closeTicket.executeByChannel(channel.id);
  } catch (error) {
    if (error instanceof TicketNotFoundError) {
      return;
    }

    deps.logger.error('Falha ao encerrar ticket após exclusão do canal', {
      channelId: channel.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
