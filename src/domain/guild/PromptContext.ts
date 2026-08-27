/**
 * Bloco extra anexado ao prompt de sistema do servidor.
 *
 * O prompt principal (`/config prompt`) continua sendo a identidade da IA.
 * Estes blocos empilham conhecimento extra (regras, FAQ, tom, etc.).
 */
export const PROMPT_CONTEXTS_PER_GUILD_LIMIT = 10;

export interface PromptContext {
  id: number;
  guildId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function composeSystemPrompt(
  base: string,
  contexts: Array<{ title: string; content: string }>,
): string {
  const blocks = contexts
    .map((item) => {
      const title = item.title.trim();
      const content = item.content.trim();
      if (content.length === 0) {
        return null;
      }
      return title.length > 0 ? `### ${title}\n${content}` : content;
    })
    .filter((block): block is string => block != null);

  if (blocks.length === 0) {
    return base;
  }

  return `${base.trim()}\n\n## Contexto adicional do servidor\n${blocks.join('\n\n')}`;
}
