/**
 * Embeds padronizados para respostas do bot.
 */
import { EmbedBuilder } from 'discord.js';
import { BOT } from '../config/constants.js';

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder().setColor(BOT.COLOR).setTitle(title).setDescription(description);
}

export function errorEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder().setColor(BOT.ERROR_COLOR).setTitle('Algo deu errado').setDescription(description);
}
