/**
 * Fecha o ticket do canal atual (botão ou /ticket fechar).
 */
import {
  PermissionFlagsBits,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type GuildTextBasedChannel,
} from 'discord.js';
import type { AppDependencies } from '../../container.js';
import { AppError } from '../../shared/errors.js';
import { isBotOwner } from '../botOwner.js';
import { errorEmbed, infoEmbed } from '../embeds.js';

type TicketCloseInteraction = ButtonInteraction | ChatInputCommandInteraction;

export async function closeCurrentTicket(
  interaction: TicketCloseInteraction,
  deps: AppDependencies,
): Promise<void> {
  if (!interaction.inGuild() || !interaction.channel || !interaction.channel.isTextBased()) {
    await reply(interaction, errorEmbed('Use este comando dentro do canal do ticket.'), true);
    return;
  }

  const channel = interaction.channel as GuildTextBasedChannel;

  try {
    const ticket = await deps.closeTicket.findOpenByChannel(channel.id);
    const canClose =
      ticket.userId === interaction.user.id ||
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) === true ||
      (await isBotOwner(interaction.client, interaction.user.id, deps.env.BOT_OWNER_ID));

    if (!canClose) {
      await reply(
        interaction,
        errorEmbed('Só quem abriu o ticket, um moderador ou o dono do bot pode fechá-lo.'),
        true,
      );
      return;
    }

    await deps.closeTicket.executeByChannel(channel.id);

    await reply(interaction, infoEmbed('Ticket fechado', 'Este canal será apagado em alguns segundos.'), false);

    setTimeout(() => {
      void channel.delete('Ticket fechado').catch((error: unknown) => {
        deps.logger.warn('Não deu para apagar o canal do ticket', {
          channelId: channel.id,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, 4000);
  } catch (error) {
    const message = error instanceof AppError ? error.userMessage : 'Não consegui fechar o ticket.';
    await reply(interaction, errorEmbed(message), true);
  }
}

async function reply(
  interaction: TicketCloseInteraction,
  embed: ReturnType<typeof infoEmbed>,
  ephemeral: boolean,
): Promise<void> {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ embeds: [embed], ephemeral });
    return;
  }

  await interaction.reply({ embeds: [embed], ephemeral });
}
