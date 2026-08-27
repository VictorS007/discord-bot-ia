/**
 * Resolve prompt e histórico corretos: ticket usa o contexto do canal, chat comum usa usuário+canal.
 */
import type { TicketChannelContext } from '../../application/ResolveTicketChannelUseCase.js';
import { conversationId, ticketConversationId } from '../../domain/conversation/conversationId.js';
import type { ResolvedGuildSettings } from '../../domain/guild/GuildSettings.js';
import { ticketAiSession } from '../tickets/ticketAiSession.js';

export function resolveAiSession(input: {
  userId: string;
  channelId: string;
  settings: ResolvedGuildSettings;
  ticket: TicketChannelContext | null;
  guildName: string;
}): { conversationId: string; systemPrompt: string } {
  if (input.ticket) {
    return ticketAiSession(input.ticket, input.settings, input.guildName);
  }

  return {
    conversationId: conversationId(input.userId, input.channelId),
    systemPrompt: input.settings.systemPrompt,
  };
}

export function conversationKeyForChannel(
  userId: string,
  channelId: string,
  ticket: TicketChannelContext | null,
): string {
  return ticket ? ticketConversationId(channelId) : conversationId(userId, channelId);
}
