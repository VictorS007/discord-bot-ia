/**
 * IA dentro de um canal de ticket aberto.
 *
 * - Quem abriu o ticket: a IA responde sozinha (se ticket-ia estiver ligada).
 * - Equipe: a fala entra no contexto; menção ao bot chama a IA.
 * - Prompt = identidade do servidor + tipo da opção + instruções da opção.
 */
import { PermissionFlagsBits, type Message } from 'discord.js';
import { formatTicketUserMessage } from '../../application/buildTicketSystemPrompt.js';
import type { TicketChannelContext } from '../../application/ResolveTicketChannelUseCase.js';
import type { AppDependencies } from '../../container.js';
import { replyToMessageWithAi } from '../ai/replyToMessageWithAi.js';
import { ticketAiSession } from './ticketAiSession.js';

export async function onTicketMessage(
  message: Message,
  deps: AppDependencies,
  ctx: TicketChannelContext,
): Promise<void> {
  const botUser = message.client.user;
  if (!botUser || !message.guild) {
    return;
  }

  const settings = await deps.getGuildSettings.execute(message.guildId);

  if (!settings.aiEnabled) {
    return;
  }

  const raw = message.content.replace(new RegExp(`<@!?${botUser.id}>`, 'g'), '').trim();
  if (raw.length === 0) {
    return;
  }

  const isOpener = message.author.id === ctx.ticket.userId;
  const mentioned = message.mentions.users.has(botUser.id);
  const member = message.member ?? (await message.guild.members.fetch(message.author.id).catch(() => null));
  const isStaff = member?.permissions.has(PermissionFlagsBits.ManageChannels) === true;
  const { conversationId, systemPrompt } = ticketAiSession(ctx, settings, message.guild.name);

  const shouldReply =
    (isOpener && settings.ticketAiEnabled) || (mentioned && (isStaff || !settings.ticketAiEnabled));

  if (shouldReply) {
    const kind = isOpener ? 'membro' : 'equipe';
    await replyToMessageWithAi(message, deps, {
      conversationId,
      question: formatTicketUserMessage(kind, message.author.username, raw),
      systemPrompt,
      model: settings.model,
      maxHistoryMessages: settings.maxHistoryMessages,
      cooldownMs: settings.cooldownMs,
    });
    return;
  }

  if (settings.ticketAiEnabled) {
    await deps.askAi.recordContext(
      conversationId,
      formatTicketUserMessage('equipe', message.author.username, raw),
      settings.maxHistoryMessages,
    );
  }
}
