/**
 * Monta prompt e ID de conversa a partir do ticket + settings do servidor.
 */
import type { TicketChannelContext } from '../../application/ResolveTicketChannelUseCase.js';
import { buildTicketSystemPrompt } from '../../application/buildTicketSystemPrompt.js';
import { ticketConversationId } from '../../domain/conversation/conversationId.js';
import type { ResolvedGuildSettings } from '../../domain/guild/GuildSettings.js';

export function ticketAiSession(
  ctx: TicketChannelContext,
  settings: ResolvedGuildSettings,
  guildName: string,
) {
  return {
    conversationId: ticketConversationId(ctx.ticket.channelId),
    systemPrompt: buildTicketSystemPrompt({
      guildSystemPrompt: settings.systemPrompt,
      guildName,
      ticketType: ctx.option?.label ?? 'Atendimento',
      extraInstructions: ctx.option?.aiInstructions ?? null,
      openerDisplayName: `<@${ctx.ticket.userId}>`,
    }),
  };
}
