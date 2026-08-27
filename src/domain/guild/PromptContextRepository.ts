/**
 * Persistência dos blocos extras de prompt por servidor.
 */
import type { PromptContext } from './PromptContext.js';

export interface PromptContextRepository {
  listByGuild(guildId: string): Promise<PromptContext[]>;
  findById(id: number): Promise<PromptContext | null>;
  create(input: { guildId: string; title: string; content: string }): Promise<PromptContext>;
  update(context: PromptContext): Promise<void>;
  delete(id: number, guildId: string): Promise<boolean>;
  deleteByGuildId(guildId: string): Promise<void>;
}
