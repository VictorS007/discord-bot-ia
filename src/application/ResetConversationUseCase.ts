/**
 * Caso de uso: apagar o histórico de uma conversa.
 */
import type { ConversationStore } from '../domain/conversation/ConversationStore.js';

export class ResetConversationUseCase {
  constructor(private readonly conversations: ConversationStore) {}

  async execute(conversationId: string): Promise<void> {
    await this.conversations.clear(conversationId);
  }
}
