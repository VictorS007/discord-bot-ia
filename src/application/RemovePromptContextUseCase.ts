/**
 * Remove um bloco extra de prompt deste servidor.
 */
import type { PromptContext } from '../domain/guild/PromptContext.js';
import type { PromptContextRepository } from '../domain/guild/PromptContextRepository.js';
import { AppError } from '../shared/errors.js';

export class RemovePromptContextUseCase {
  constructor(private readonly contexts: PromptContextRepository) {}

  async execute(id: number, guildId: string): Promise<PromptContext> {
    const context = await this.contexts.findById(id);

    if (!context || context.guildId !== guildId) {
      throw new AppError('Contexto inexistente', 'Não achei esse contexto neste servidor. Use `/config contexto listar`.');
    }

    await this.contexts.delete(id, guildId);
    return context;
  }
}
