/**
 * Caso de uso: enviar uma pergunta à IA preservando o histórico da conversa.
 *
 * Prompt, modelo e tamanho do histórico vêm do servidor (ou dos defaults globais).
 * Entrada, contexto da conversa e saída passam pelo Detoxify + palavras bloqueadas.
 */
import type { AiProvider } from '../domain/ai/AiProvider.js';
import type { ConversationMessage, ConversationStore } from '../domain/conversation/ConversationStore.js';
import type { ContentModerator } from '../domain/moderation/ContentModerator.js';
import { AiProviderError, ForbiddenContentError } from '../shared/errors.js';

export interface AskAiInput {
  conversationId: string;
  question: string;
  systemPrompt: string;
  model: string;
  maxHistoryMessages: number;
  extraBlockedWords?: string[];
}

export class AskAiUseCase {
  constructor(
    private readonly ai: AiProvider,
    private readonly conversations: ConversationStore,
    private readonly moderator: ContentModerator,
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
    await this.assertClean(question, 'input', input.extraBlockedWords, history, input.conversationId, 'user');

    const answer = await this.ai.complete({
      model: input.model,
      messages: [
        { role: 'system', content: input.systemPrompt },
        ...history,
        { role: 'user', content: question },
      ],
    });

    await this.assertClean(
      answer,
      'output',
      input.extraBlockedWords,
      [...history, { role: 'user', content: question }],
      input.conversationId,
      'assistant',
    );

    const nextHistory: ConversationMessage[] = [
      ...history,
      { role: 'user', content: question },
      { role: 'assistant', content: answer },
    ];

    await this.conversations.replace(
      input.conversationId,
      nextHistory.slice(-input.maxHistoryMessages),
    );

    return answer;
  }

  /**
   * Grava uma mensagem no histórico sem chamar a IA.
   * Usado quando a equipe fala no ticket: o contexto fica disponível na próxima resposta.
   */
  async recordContext(
    conversationId: string,
    content: string,
    maxHistoryMessages: number,
    extraBlockedWords?: string[],
  ): Promise<void> {
    const text = content.trim();
    if (text.length === 0) {
      return;
    }

    const history = await this.conversations.get(conversationId);
    await this.assertClean(text, 'input', extraBlockedWords, history, conversationId, 'user');

    const nextHistory: ConversationMessage[] = [...history, { role: 'user', content: text }];
    await this.conversations.replace(conversationId, nextHistory.slice(-maxHistoryMessages));
  }

  private async assertClean(
    text: string,
    kind: 'input' | 'output',
    extraBlockedWords: string[] | undefined,
    context: ConversationMessage[],
    conversationId: string,
    currentRole: ConversationMessage['role'],
  ): Promise<void> {
    const verdict = await this.moderator.inspect(text, extraBlockedWords, context, currentRole);
    if (verdict.allowed) {
      return;
    }

    if (verdict.source === 'detoxify-context') {
      await this.conversations.clear(conversationId);
      throw new ForbiddenContentError('context');
    }

    throw new ForbiddenContentError(kind);
  }
}
