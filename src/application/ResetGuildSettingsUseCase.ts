/**
 * Remove a linha do servidor: na próxima leitura voltam os defaults globais.
 * Também apaga os blocos extras de prompt.
 */
import type { GuildSettingsRepository } from '../domain/guild/GuildSettingsRepository.js';
import type { PromptContextRepository } from '../domain/guild/PromptContextRepository.js';

export class ResetGuildSettingsUseCase {
  constructor(
    private readonly repository: GuildSettingsRepository,
    private readonly promptContexts: PromptContextRepository,
  ) {}

  async execute(guildId: string): Promise<void> {
    await this.promptContexts.deleteByGuildId(guildId);
    await this.repository.delete(guildId);
  }
}
