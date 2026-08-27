/**
 * Fábrica do cliente Discord com os intents mínimos necessários.
 *
 * Message Content Intent precisa estar ligado no Portal do Desenvolvedor
 * para o bot responder quando for mencionado em uma mensagem.
 */
import { Client, GatewayIntentBits, Partials } from 'discord.js';

export function createDiscordClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });
}
