/**
 * Contrato do filtro de conteúdo.
 *
 * Palavras da lista e scores do Detoxify entram pela mesma porta:
 * a aplicação só pergunta se o texto pode seguir.
 */
import type { ConversationMessage } from '../conversation/ConversationStore.js';

export type ModerationSource = 'words' | 'detoxify' | 'detoxify-context';

export interface ModerationVerdict {
  allowed: boolean;
  source?: ModerationSource;
  labels?: string[];
}

export interface ContentModerator {
  inspect(
    text: string,
    extraBlockedWords?: string[],
    context?: ConversationMessage[],
    currentRole?: ConversationMessage['role'],
  ): Promise<ModerationVerdict>;
}

export function parseBlockedWords(raw: string | null | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(/[,;\n]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);
}
