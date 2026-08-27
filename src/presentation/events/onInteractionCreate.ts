/**
 * Roteia interações: slash commands, menu de ticket e botão de fechar.
 */
import type { Interaction } from 'discord.js';
import type { AppDependencies } from '../../container.js';
import { errorEmbed } from '../embeds.js';
import { commandsByName } from '../commands/registry.js';
import { TICKET_CLOSE_ID, TICKET_SELECT_ID } from '../tickets/customIds.js';
import { closeCurrentTicket } from '../tickets/closeCurrentTicket.js';
import { onTicketSelect } from '../tickets/onTicketSelect.js';

export async function onInteractionCreate(
  interaction: Interaction,
  deps: AppDependencies,
): Promise<void> {
  try {
    if (interaction.isStringSelectMenu() && interaction.customId === TICKET_SELECT_ID) {
      await onTicketSelect(interaction, deps);
      return;
    }

    if (interaction.isButton() && interaction.customId === TICKET_CLOSE_ID) {
      await closeCurrentTicket(interaction, deps);
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = commandsByName.get(interaction.commandName);

    if (!command) {
      await interaction.reply({
        embeds: [errorEmbed(`Comando desconhecido: \`${interaction.commandName}\``)],
        ephemeral: true,
      });
      return;
    }

    await command.execute(interaction, deps);
  } catch (error) {
    deps.logger.error('Erro não tratado em interação', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (!interaction.isRepliable()) {
      return;
    }

    const payload = { embeds: [errorEmbed('Não consegui processar essa interação.')], ephemeral: true };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
      return;
    }

    await interaction.reply(payload);
  }
}
