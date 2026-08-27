/**
 * Publica ou atualiza o menu de tickets no canal do painel.
 */
import {
  ActionRowBuilder,
  ChannelType,
  StringSelectMenuBuilder,
  type GuildTextBasedChannel,
} from 'discord.js';
import type { TicketOption } from '../../domain/ticket/TicketOption.js';
import type { TicketPanelRepository } from '../../domain/ticket/TicketPanel.js';
import { infoEmbed } from '../embeds.js';
import { TICKET_SELECT_ID } from './customIds.js';

export async function syncTicketPanel(options: {
  channel: GuildTextBasedChannel;
  guildId: string;
  ticketOptions: TicketOption[];
  panels: TicketPanelRepository;
}): Promise<void> {
  const { channel, guildId, ticketOptions, panels } = options;

  if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
    return;
  }

  const saved = await panels.find(guildId, channel.id);

  if (ticketOptions.length === 0) {
    if (saved) {
      await channel.messages.delete(saved.messageId).catch(() => undefined);
      await panels.delete(guildId, channel.id);
    }
    return;
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(TICKET_SELECT_ID)
    .setPlaceholder('Escolha o tipo de ticket')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      ticketOptions.map((option) => ({
        label: option.label.slice(0, 100),
        value: String(option.id),
        description: `Abrir ticket: ${option.label}`.slice(0, 100),
      })),
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
  const embed = infoEmbed(
    'Abrir ticket',
    'Selecione uma opção abaixo. Um canal privado será criado na categoria configurada para esse tipo de atendimento.',
  );

  const payload = { embeds: [embed], components: [row] };

  if (saved) {
    const existing = await channel.messages.fetch(saved.messageId).catch(() => null);
    if (existing) {
      await existing.edit(payload);
      return;
    }
  }

  const message = await channel.send(payload);
  await panels.save({ guildId, channelId: channel.id, messageId: message.id });
}
