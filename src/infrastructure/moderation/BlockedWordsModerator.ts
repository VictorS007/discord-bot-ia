/**
 * Lista local de palavras/frases bloqueadas (env + servidor).
 * Roda antes do Detoxify: é barato e determinístico.
 */
import type { ContentModerator, ModerationVerdict } from '../../domain/moderation/ContentModerator.js';

export class BlockedWordsModerator implements ContentModerator {
  constructor(private readonly globalWords: string[]) {}

  async inspect(
    text: string,
    extraBlockedWords: string[] = [],
    _context?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<ModerationVerdict> {
    const haystack = normalize(text);
    const words = [...this.globalWords, ...extraBlockedWords];

    for (const word of words) {
      const needle = normalize(word);
      if (needle.length < 2) {
        continue;
      }

      const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegex(needle)}(?![\\p{L}\\p{N}_])`, 'iu');
      if (pattern.test(haystack)) {
        return { allowed: false, source: 'words' };
      }
    }

    return { allowed: true };
  }
}

function normalize(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
