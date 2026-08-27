import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { infoEmbed } from '../embeds.js';
import type { Command } from './Command.js';

const HELP_TEXT = [
  '**Como falar comigo**',
  '• `/ask pergunta:` — pergunta direta à IA',
  '• Me mencione em uma mensagem: `@bot qual é a capital do Japão?`',
  '',
  '**Outros comandos**',
  '• `/reset` — apaga o histórico da sua conversa neste canal',
  '• `/ping` — latência do bot',
  '• `/help` — esta mensagem',
  '• `/config` — configurações por servidor (administradores)',
  '',
  'Cada usuário tem um histórico próprio por canal. O contexto é mantido até você usar `/reset` ou o bot reiniciar.',
  'Prompt, modelo, canal e cooldown podem ser diferentes em cada servidor — veja `/config ver`.',
].join('\n');

export const helpCommand: Command = {
  data: new SlashCommandBuilder().setName('help').setDescription('Mostra como usar o bot.'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      embeds: [infoEmbed('Ajuda', HELP_TEXT)],
    });
  },
};
