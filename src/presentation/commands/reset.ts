import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { conversationId } from '../../domain/conversation/conversationId.js';
import type { AppDependencies } from '../../container.js';
import { infoEmbed } from '../embeds.js';
import type { Command } from './Command.js';

export const resetCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Apaga o histórico da sua conversa com a IA neste canal.'),

  async execute(interaction: ChatInputCommandInteraction, deps: AppDependencies) {
    await deps.resetConversation.execute(conversationId(interaction.user.id, interaction.channelId));

    await interaction.reply({
      embeds: [
        infoEmbed(
          'Conversa reiniciada',
          'Esqueci o contexto anterior neste canal. Pode perguntar de novo do zero.',
        ),
      ],
    });
  },
};
