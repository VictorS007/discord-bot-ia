/**
 * Lê a configuração efetiva de um servidor (banco + defaults do .env).
 * Sem `guildId` (DM), devolve só os padrões globais.
 */
import {
  resolveGuildSettings,
  type GuildSettingsDefaults,
  type ResolvedGuildSettings,
} from '../domain/guild/GuildSettings.js';
import type { GuildSettingsRepository } from '../domain/guild/GuildSettingsRepository.js';

export class GetGuildSettingsUseCase {
  constructor(
    private readonly repository: GuildSettingsRepository,
    private readonly defaults: GuildSettingsDefaults,
  ) {}

  async execute(guildId: string | null): Promise<ResolvedGuildSettings> {
    if (!guildId) {
      return resolveGuildSettings(null, 'dm', this.defaults);
    }

    const stored = await this.repository.findByGuildId(guildId);
    return resolveGuildSettings(stored, guildId, this.defaults);
  }
}
