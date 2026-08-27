/**
 * Caso de uso: enviar uma pergunta à IA preservando o histórico da conversa.
 */
import type { AiProvider } from '../domain/ai/AiProvider.js';
import type { ConversationMessage, ConversationStore } from '../domain/conversation/ConversationStore.js';
import { AiProviderError } from '../shared/errors.js';

export interface AskAiInput {
  conversationId: string;
  question: string;
}

export class AskAiUseCase {
  constructor(
    private readonly ai: AiProvider,
    private readonly conversations: ConversationStore,
    private readonly systemPrompt: string,
    private readonly maxHistoryMessages: number,
  ) {}

  async execute(input: AskAiInput): Promise<string> {
    const question = input.question.trim();

    if (question.length === 0) {
      throw new AiProviderError(
        'Pergunta vazia',
        'Escreva uma pergunta para eu responder.',
      );
    }

    const history = await this.conversations.get(input.conversationId);

    const answer = await this.ai.complete([
      { role: 'system', content: this.systemPrompt },
      ...history,
      { role: 'user', content: question },
    ]);

    const nextHistory: ConversationMessage[] = [
      ...history,
      { role: 'user', content: question },
      { role: 'assistant', content: answer },
    ];

    await this.conversations.replace(
      input.conversationId,
      nextHistory.slice(-this.maxHistoryMessages),
    );

    return answer;
  }
}
