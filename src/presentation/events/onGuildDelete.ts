/**
 * Remove as configurações persistidas quando o bot sai do servidor.
 */
import type { Guild } from 'discord.js';
import type { AppDependencies } from '../../container.js';

export async function onGuildDelete(guild: Guild, deps: AppDependencies): Promise<void> {
  await deps.resetGuildSettings.execute(guild.id);
  deps.logger.info('Configurações do servidor removidas', {
    guildId: guild.id,
    nome: guild.name,
  });
}
