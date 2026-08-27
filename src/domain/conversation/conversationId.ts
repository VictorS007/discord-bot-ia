/**
 * Monta o identificador de uma conversa.
 *
 * Cada par usuário+canal tem o próprio histórico, para que
 * duas pessoas no mesmo canal não misturem contexto.
 */
export function conversationId(userId: string, channelId: string): string {
  return `${channelId}:${userId}`;
}
