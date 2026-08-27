/**
 * Cliente HTTP do serviço Python Detoxify (modelo multilingual).
 *
 * Avalia a mensagem isolada e, se houver histórico, o transcript da conversa.
 * Assim o filtro pega toxicidade diluída em várias falas.
 */
import type { ContentModerator, ModerationVerdict } from '../../domain/moderation/ContentModerator.js';
import { ModerationUnavailableError } from '../../shared/errors.js';
import type { Logger } from '../../shared/logger.js';

interface DetoxifyResponse {
  scores?: Record<string, number>;
  contextScores?: Record<string, number>;
}

export class DetoxifyModerator implements ContentModerator {
  constructor(
    private readonly baseUrl: string,
    private readonly threshold: number,
    private readonly contextThreshold: number,
    private readonly maxContextMessages: number,
    private readonly failClosed: boolean,
    private readonly logger: Logger,
  ) {}

  async inspect(
    text: string,
    _extraBlockedWords?: string[],
    context: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    currentRole: 'user' | 'assistant' = 'user',
  ): Promise<ModerationVerdict> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/moderate`;
    const prior = context.slice(-this.maxContextMessages);

    let payload: DetoxifyResponse;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          role: currentRole,
          context: prior.map((message) => ({ role: message.role, content: message.content })),
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      payload = (await response.json()) as DetoxifyResponse;
    } catch (error) {
      this.logger.error('Falha ao consultar o Detoxify', {
        error: error instanceof Error ? error.message : String(error),
      });

      if (this.failClosed) {
        throw new ModerationUnavailableError();
      }

      return { allowed: true };
    }

    const currentLabels = labelsAbove(payload.scores ?? {}, this.threshold);
    if (currentLabels.length > 0) {
      this.logger.warn('Detoxify bloqueou a mensagem', { labels: currentLabels });
      return { allowed: false, source: 'detoxify', labels: currentLabels };
    }

    if (prior.length > 0) {
      const contextLabels = labelsAbove(payload.contextScores ?? {}, this.contextThreshold);
      if (contextLabels.length > 0) {
        this.logger.warn('Detoxify bloqueou o contexto da conversa', { labels: contextLabels });
        return { allowed: false, source: 'detoxify-context', labels: contextLabels };
      }
    }

    return { allowed: true };
  }
}

function labelsAbove(scores: Record<string, number>, threshold: number): string[] {
  return Object.entries(scores)
    .filter(([, score]) => Number(score) >= threshold)
    .map(([label]) => label);
}
