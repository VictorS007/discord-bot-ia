/**
 * Adiciona um bloco extra ao prompt do servidor.
 * Se o título já existir (ignorando maiúsculas), o texto é atualizado.
 */
import { PROMPT_CONTEXTS_PER_GUILD_LIMIT, type PromptContext } from '../domain/guild/PromptContext.js';
import type { PromptContextRepository } from '../domain/guild/PromptContextRepository.js';
import { AppError, PromptContextLimitError } from '../shared/errors.js';

export class AddPromptContextUseCase {
  constructor(private readonly contexts: PromptContextRepository) {}

  async execute(input: {
    guildId: string;
    title: string;
    content: string;
  }): Promise<{ context: PromptContext; updated: boolean }> {
    const title = input.title.trim();
    const content = input.content.trim();

    if (title.length === 0) {
      throw new AppError('Título vazio', 'Informe um título para este contexto.');
    }

    if (content.length === 0) {
      throw new AppError('Texto vazio', 'O texto do contexto não pode ser vazio.');
    }

    const existing = await this.contexts.listByGuild(input.guildId);
    const sameTitle = existing.find((item) => item.title.toLowerCase() === title.toLowerCase());

    if (sameTitle) {
      const updated: PromptContext = {
        ...sameTitle,
        title,
        content,
        updatedAt: new Date().toISOString(),
      };
      await this.contexts.update(updated);
      return { context: updated, updated: true };
    }

    if (existing.length >= PROMPT_CONTEXTS_PER_GUILD_LIMIT) {
      throw new PromptContextLimitError(PROMPT_CONTEXTS_PER_GUILD_LIMIT);
    }

    return {
      context: await this.contexts.create({ guildId: input.guildId, title, content }),
      updated: false,
    };
  }
}
