/**
 * Discord rejeita mensagens com mais de 2000 caracteres.
 * Esta função parte o texto em blocos seguros, preferindo quebrar em quebras de linha.
 */
export function splitMessage(text: string, limit: number): string[] {
  if (text.length <= limit) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    const window = remaining.slice(0, limit);
    const breakAt = window.lastIndexOf('\n');
    const cut = breakAt > limit * 0.5 ? breakAt : limit;

    chunks.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}
