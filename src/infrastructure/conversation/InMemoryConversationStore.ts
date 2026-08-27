/**
 * Histórico em memória. Suficiente para um único processo.
 *
 * Se o bot for reiniciado, as conversas são esquecidas — comportamento
 * previsível e adequado para a maioria dos usos. Para persistir entre
 * restarts, troque esta classe por uma implementação com Redis ou banco.
 */
import type { ConversationMessage, ConversationStore } from '../../domain/conversation/ConversationStore.js';

export class InMemoryConversationStore implements ConversationStore {
  private readonly store = new Map<string, ConversationMessage[]>();

  async get(conversationId: string): Promise<ConversationMessage[]> {
    return this.store.get(conversationId) ?? [];
  }

  async replace(conversationId: string, messages: ConversationMessage[]): Promise<void> {
    this.store.set(conversationId, messages);
  }

  async clear(conversationId: string): Promise<void> {
    this.store.delete(conversationId);
  }
}
