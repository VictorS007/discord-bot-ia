/**
 * Aplica um patch nas configurações do servidor e persiste no banco.
 */
import {
  applyGuildSettingsPatch,
  resolveGuildSettings,
  type GuildSettingsDefaults,
  type GuildSettingsPatch,
  type ResolvedGuildSettings,
} from '../domain/guild/GuildSettings.js';
import type { GuildSettingsRepository } from '../domain/guild/GuildSettingsRepository.js';

export class UpdateGuildSettingsUseCase {
  constructor(
    private readonly repository: GuildSettingsRepository,
    private readonly defaults: GuildSettingsDefaults,
  ) {}

  async execute(guildId: string, patch: GuildSettingsPatch): Promise<ResolvedGuildSettings> {
    const current = await this.repository.findByGuildId(guildId);
    const next = applyGuildSettingsPatch(current, guildId, patch, new Date().toISOString());
    await this.repository.save(next);
    return resolveGuildSettings(next, guildId, this.defaults);
  }
}
