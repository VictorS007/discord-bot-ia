import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { assertAiAllowed } from '../../application/assertAiAllowed.js';
import { AppError, GuildAiDisabledError, RateLimitError } from '../../shared/errors.js';
import { splitMessage } from '../../shared/splitMessage.js';
import { DISCORD_MESSAGE_LIMIT } from '../../config/constants.js';
import type { AppDependencies } from '../../container.js';
import { resolveAiSession } from '../ai/resolveAiSession.js';
import { errorEmbed } from '../embeds.js';
import type { Command } from './Command.js';

export const askCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Pergunte algo à IA.')
    .addStringOption((option) =>
      option.setName('pergunta').setDescription('O que você quer saber?').setRequired(true).setMaxLength(1800),
    ),

  async execute(interaction: ChatInputCommandInteraction, deps: AppDependencies) {
    const settings = await deps.getGuildSettings.execute(interaction.guildId);
    const ticket = await deps.resolveTicketChannel.execute(interaction.channelId);

    try {
      if (ticket) {
        if (!settings.aiEnabled) {
          throw new GuildAiDisabledError();
        }
      } else {
        assertAiAllowed(settings, interaction.channelId);
      }
    } catch (error) {
      const message = error instanceof AppError ? error.userMessage : 'A IA não está disponível aqui.';
      await interaction.reply({ embeds: [errorEmbed(message)], ephemeral: true });
      return;
    }

    const wait = deps.cooldown.remaining(interaction.user.id, settings.cooldownMs);

    if (wait > 0) {
      await interaction.reply({
        embeds: [errorEmbed(new RateLimitError(wait).userMessage)],
        ephemeral: true,
      });
      return;
    }

    const question = interaction.options.getString('pergunta', true);
    await interaction.deferReply();
    deps.cooldown.hit(interaction.user.id);

    const session = resolveAiSession({
      userId: interaction.user.id,
      channelId: interaction.channelId,
      settings,
      ticket,
      guildName: interaction.guild?.name ?? 'servidor',
    });

    try {
      const answer = await deps.askAi.execute({
        conversationId: session.conversationId,
        question,
        systemPrompt: session.systemPrompt,
        model: settings.model,
        maxHistoryMessages: settings.maxHistoryMessages,
      });

      const [first, ...rest] = splitMessage(answer, DISCORD_MESSAGE_LIMIT);

      await interaction.editReply({ content: first ?? 'Não recebi conteúdo da IA.' });

      for (const chunk of rest) {
        await interaction.followUp({ content: chunk });
      }
    } catch (error) {
      const message = error instanceof AppError ? error.userMessage : 'Falha inesperada ao consultar a IA.';
      deps.logger.error('Falha no comando /ask', {
        error: error instanceof Error ? error.message : String(error),
      });
      await interaction.editReply({ embeds: [errorEmbed(message)] });
    }
  },
};
