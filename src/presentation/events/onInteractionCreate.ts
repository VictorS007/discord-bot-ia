/**
 * Roteia interações de slash command para o handler correspondente.
 */
import type { Interaction } from 'discord.js';
import type { AppDependencies } from '../../container.js';
import { errorEmbed } from '../embeds.js';
import { commandsByName } from '../commands/registry.js';

export async function onInteractionCreate(
  interaction: Interaction,
  deps: AppDependencies,
): Promise<void> {
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

  try {
    await command.execute(interaction, deps);
  } catch (error) {
    deps.logger.error('Erro não tratado em slash command', {
      command: interaction.commandName,
      error: error instanceof Error ? error.message : String(error),
    });

    const payload = { embeds: [errorEmbed('Não consegui executar esse comando.')], ephemeral: true };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
      return;
    }

    await interaction.reply(payload);
  }
}
