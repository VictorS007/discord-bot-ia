/**
 * Evento `ready`: bot autenticado e cache inicial carregado.
 */
import type { Client } from 'discord.js';
import type { AppDependencies } from '../../container.js';
import { registerSlashCommands } from '../../infrastructure/discord/registerSlashCommands.js';
import { commands } from '../commands/registry.js';

export async function onReady(client: Client<true>, deps: AppDependencies): Promise<void> {
  deps.logger.info('Bot online', {
    usuario: client.user.tag,
    servidores: client.guilds.cache.size,
  });

  await client.application.fetch();

  await registerSlashCommands({
    token: deps.env.DISCORD_TOKEN,
    clientId: deps.env.DISCORD_CLIENT_ID,
    guildId: deps.env.DISCORD_GUILD_ID,
    commands: commands.map((command) => command.data.toJSON()),
    logger: deps.logger,
  });

  client.user.setActivity('/help · mencione-me para conversar');
}
