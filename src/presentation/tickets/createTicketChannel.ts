/**
 * Cria o canal de um ticket na categoria da opção, copiando permissões da categoria.
 */
import {
  ChannelType,
  PermissionFlagsBits,
  type CategoryChannel,
  type Guild,
  type OverwriteResolvable,
  type TextChannel,
} from 'discord.js';
import type { TicketOption } from '../../domain/ticket/TicketOption.js';
import { AppError } from '../../shared/errors.js';
import { toTicketChannelName } from './channelName.js';

export async function createTicketChannel(options: {
  guild: Guild;
  openerId: string;
  openerUsername: string;
  botId: string;
  ticketOption: TicketOption;
}): Promise<TextChannel> {
  const category = await options.guild.channels.fetch(options.ticketOption.categoryId);

  if (!category || category.type !== ChannelType.GuildCategory) {
    throw new AppError(
      'Categoria de ticket inválida',
      'A categoria configurada para essa opção não existe mais. Avise o dono do bot.',
    );
  }

  const channel = await options.guild.channels.create({
    name: toTicketChannelName(options.openerUsername),
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `Ticket · ${options.ticketOption.label} · <@${options.openerId}>`,
    permissionOverwrites: buildOverwrites(category, options.guild.id, options.openerId, options.botId),
    reason: `Ticket: ${options.ticketOption.label}`,
  });

  return channel;
}

function buildOverwrites(
  category: CategoryChannel,
  everyoneId: string,
  openerId: string,
  botId: string,
): OverwriteResolvable[] {
  const overwrites: OverwriteResolvable[] = category.permissionOverwrites.cache.map((overwrite) => ({
    id: overwrite.id,
    allow: overwrite.allow,
    deny: overwrite.deny,
    type: overwrite.type,
  }));

  overwrites.push({
    id: everyoneId,
    deny: [PermissionFlagsBits.ViewChannel],
  });

  overwrites.push({
    id: openerId,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
    ],
  });

  overwrites.push({
    id: botId,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.EmbedLinks,
    ],
  });

  return overwrites;
}
