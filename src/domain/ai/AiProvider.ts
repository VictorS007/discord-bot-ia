/**
 * Contrato do provedor de IA.
 *
 * A aplicação depende desta interface, nunca de um SDK específico.
 * Trocar OpenAI por Groq, Ollama ou outro provedor exige apenas
 * uma nova implementação — o restante do bot permanece igual.
 */
export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface AiProvider {
  complete(messages: ChatMessage[]): Promise<string>;
}
