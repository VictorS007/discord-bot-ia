import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { AppDependencies } from '../../container.js';
import { conversationKeyForChannel } from '../ai/resolveAiSession.js';
import { infoEmbed } from '../embeds.js';
import type { Command } from './Command.js';

export const resetCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Apaga o histórico da conversa com a IA neste canal.'),

  async execute(interaction: ChatInputCommandInteraction, deps: AppDependencies) {
    const ticket = await deps.resolveTicketChannel.execute(interaction.channelId);
    await deps.resetConversation.execute(
      conversationKeyForChannel(interaction.user.id, interaction.channelId, ticket),
    );

    await interaction.reply({
      embeds: [
        infoEmbed(
          'Conversa reiniciada',
          ticket
            ? 'Esqueci o contexto deste ticket. Pode continuar do zero.'
            : 'Esqueci o contexto anterior neste canal. Pode perguntar de novo do zero.',
        ),
      ],
    });
  },
};
