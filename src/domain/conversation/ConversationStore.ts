/**
 * Histórico de conversa por contexto (usuário + canal).
 *
 * A implementação pode ser em memória, Redis, banco, etc.
 * O caso de uso não precisa saber onde os dados ficam.
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationStore {
  get(conversationId: string): Promise<ConversationMessage[]>;
  replace(conversationId: string, messages: ConversationMessage[]): Promise<void>;
  clear(conversationId: string): Promise<void>;
}
