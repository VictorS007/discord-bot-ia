/**
 * Publica os slash commands na API do Discord.
 *
 * Com DISCORD_GUILD_ID, o registro é instantâneo (ideal em desenvolvimento).
 * Sem ele, os comandos são globais e podem levar até uma hora para aparecer.
 */
import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import type { Logger } from '../../shared/logger.js';

export async function registerSlashCommands(options: {
  token: string;
  clientId: string;
  guildId: string | undefined;
  commands: RESTPostAPIChatInputApplicationCommandsJSONBody[];
  logger: Logger;
}): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(options.token);

  const route = options.guildId
    ? Routes.applicationGuildCommands(options.clientId, options.guildId)
    : Routes.applicationCommands(options.clientId);

  await rest.put(route, { body: options.commands });

  options.logger.info('Slash commands registrados', {
    escopo: options.guildId ? 'guild' : 'global',
    quantidade: options.commands.length,
  });
}
