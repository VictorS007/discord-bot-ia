/**
 * Monta o identificador de uma conversa.
 *
 * Chat comum: cada par usuário+canal tem o próprio histórico.
 * Ticket: o canal inteiro compartilha o mesmo contexto (membro + equipe + IA).
 */
export function conversationId(userId: string, channelId: string): string {
  return `${channelId}:${userId}`;
}

export function ticketConversationId(channelId: string): string {
  return `ticket:${channelId}`;
}
