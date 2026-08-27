/**
 * Remove a linha do servidor: na próxima leitura voltam os defaults globais.
 */
import type { GuildSettingsRepository } from '../domain/guild/GuildSettingsRepository.js';

export class ResetGuildSettingsUseCase {
  constructor(private readonly repository: GuildSettingsRepository) {}

  async execute(guildId: string): Promise<void> {
    await this.repository.delete(guildId);
  }
}
