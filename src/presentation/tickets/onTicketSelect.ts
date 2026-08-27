/**
 * Usuário escolheu uma opção no menu do painel.
 */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type StringSelectMenuInteraction,
} from 'discord.js';
import type { AppDependencies } from '../../container.js';
import { AppError } from '../../shared/errors.js';
import { errorEmbed, infoEmbed } from '../embeds.js';
import { createTicketChannel } from './createTicketChannel.js';
import { TICKET_CLOSE_ID } from './customIds.js';
import { syncTicketPanel } from './syncPanel.js';

export async function onTicketSelect(
  interaction: StringSelectMenuInteraction,
  deps: AppDependencies,
): Promise<void> {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply({
      embeds: [errorEmbed('Tickets só funcionam dentro de um servidor.')],
      ephemeral: true,
    });
    return;
  }

  const optionId = Number(interaction.values[0]);
  if (!Number.isInteger(optionId)) {
    await interaction.reply({ embeds: [errorEmbed('Opção inválida.')], ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const botUser = interaction.client.user;
  if (!botUser) {
    await interaction.editReply({ embeds: [errorEmbed('Bot ainda não está pronto.')] });
    return;
  }

  try {
    const option = await deps.openTicket.prepare(optionId, interaction.guildId, interaction.user.id);
    const channel = await createTicketChannel({
      guild: interaction.guild,
      openerId: interaction.user.id,
      openerUsername: interaction.user.username,
      botId: botUser.id,
      ticketOption: option,
    });

    try {
      await deps.openTicket.register({
        guildId: interaction.guildId,
        optionId: option.id,
        channelId: channel.id,
        userId: interaction.user.id,
      });
    } catch (error) {
      await channel.delete('Falha ao registrar o ticket').catch(() => undefined);
      throw error;
    }

    const closeButton = new ButtonBuilder()
      .setCustomId(TICKET_CLOSE_ID)
      .setLabel('Fechar ticket')
      .setStyle(ButtonStyle.Danger);

    const settings = await deps.getGuildSettings.execute(interaction.guildId);
    const aiHint = settings.aiEnabled && settings.ticketAiEnabled
      ? `\n\nA IA deste servidor vai te atender neste canal, no estilo **${option.label}**. A equipe também pode entrar. Escreva sua dúvida abaixo.`
      : `\nA equipe já consegue ver o canal.`;

    await channel.send({
      content: `${interaction.user}`,
      embeds: [
        infoEmbed(
          option.label,
          `${interaction.user} abriu este ticket.${aiHint}\nUse o botão abaixo ou \`/ticket fechar\` quando terminar.`,
        ),
      ],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton)],
    });

    await interaction.editReply({
      embeds: [infoEmbed('Ticket aberto', `Seu canal: ${channel}`)],
    });

    if (interaction.channel?.isTextBased() && !interaction.channel.isDMBased()) {
      const remaining = await deps.listTicketOptions.execute(interaction.guildId, option.panelChannelId);
      await syncTicketPanel({
        channel: interaction.channel,
        guildId: interaction.guildId,
        ticketOptions: remaining,
        panels: deps.ticketPanels,
      });
    }
  } catch (error) {
    const message = error instanceof AppError ? error.userMessage : 'Não consegui abrir o ticket.';
    deps.logger.error('Falha ao abrir ticket', {
      error: error instanceof Error ? error.message : String(error),
    });
    await interaction.editReply({ embeds: [errorEmbed(message)] });
  }
}
