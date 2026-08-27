/**
 * Persistência das configurações por servidor.
 * A implementação (MySQL, etc.) fica na infraestrutura.
 */
import type { GuildSettings } from './GuildSettings.js';

export interface GuildSettingsRepository {
  findByGuildId(guildId: string): Promise<GuildSettings | null>;
  save(settings: GuildSettings): Promise<void>;
  delete(guildId: string): Promise<void>;
}
