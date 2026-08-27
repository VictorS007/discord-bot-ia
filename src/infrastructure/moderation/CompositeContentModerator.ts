/**
 * Palavras bloqueadas primeiro; se passar, o Detoxify avalia toxicidade.
 */
import type { ContentModerator, ModerationVerdict } from '../../domain/moderation/ContentModerator.js';
import { ForbiddenContentError } from '../../shared/errors.js';

export class CompositeContentModerator implements ContentModerator {
  constructor(private readonly layers: ContentModerator[]) {}

  async inspect(
    text: string,
    extraBlockedWords?: string[],
    context?: Array<{ role: 'user' | 'assistant'; content: string }>,
    currentRole?: 'user' | 'assistant',
  ): Promise<ModerationVerdict> {
    const sample = text.trim();
    if (sample.length === 0) {
      return { allowed: true };
    }

    for (const layer of this.layers) {
      const verdict = await layer.inspect(sample, extraBlockedWords, context, currentRole);
      if (!verdict.allowed) {
        return verdict;
      }
    }

    return { allowed: true };
  }

  async assertAllowed(
    text: string,
    kind: 'input' | 'output',
    extraBlockedWords?: string[],
    context?: Array<{ role: 'user' | 'assistant'; content: string }>,
    currentRole?: 'user' | 'assistant',
  ): Promise<void> {
    const verdict = await this.inspect(text, extraBlockedWords, context, currentRole);
    if (!verdict.allowed) {
      throw new ForbiddenContentError(verdict.source === 'detoxify-context' ? 'context' : kind);
    }
  }
}
