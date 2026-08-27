import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { infoEmbed } from '../embeds.js';
import type { Command } from './Command.js';

export const pingCommand: Command = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Mostra a latência do bot.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const roundtrip = Date.now() - interaction.createdTimestamp;
    const websocket = Math.round(interaction.client.ws.ping);

    await interaction.reply({
      embeds: [
        infoEmbed(
          'Pong',
          `Latência da API: **${roundtrip}ms**\nLatência do WebSocket: **${websocket}ms**`,
        ),
      ],
    });
  },
};
