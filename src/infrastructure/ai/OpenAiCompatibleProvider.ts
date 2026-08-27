/**
 * Cliente HTTP para qualquer API compatível com Chat Completions da OpenAI.
 *
 * Funciona com OpenAI, Groq, OpenRouter, vLLM, Ollama (modo OpenAI) e similares,
 * bastando ajustar OPENAI_BASE_URL e OPENAI_MODEL.
 */
import type { AiProvider, CompleteChatInput } from '../../domain/ai/AiProvider.js';
import { AiProviderError } from '../../shared/errors.js';
import type { Logger } from '../../shared/logger.js';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

export class OpenAiCompatibleProvider implements AiProvider {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly logger: Logger,
  ) {}

  async complete(input: CompleteChatInput): Promise<string> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/chat/completions`;

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: input.model,
          messages: input.messages,
          temperature: 0.7,
        }),
      });
    } catch (error) {
      this.logger.error('Falha de rede ao chamar o provedor de IA', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AiProviderError('Falha de rede no provedor de IA');
    }

    let payload: ChatCompletionResponse;

    try {
      payload = (await response.json()) as ChatCompletionResponse;
    } catch {
      throw new AiProviderError(`Provedor de IA retornou um corpo inválido (HTTP ${response.status})`);
    }

    if (!response.ok) {
      const detail = payload.error?.message ?? `HTTP ${response.status}`;
      this.logger.error('Provedor de IA recusou a requisição', { detail, status: response.status });
      throw new AiProviderError(`Provedor de IA: ${detail}`);
    }

    const content = payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new AiProviderError('Resposta vazia do provedor de IA');
    }

    return content;
  }
}
