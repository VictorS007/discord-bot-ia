/**
 * Responde quando o bot é mencionado, ou automaticamente em canais de ticket.
 */
import type { Message } from 'discord.js';
import { assertAiAllowed } from '../../application/assertAiAllowed.js';
import { conversationId } from '../../domain/conversation/conversationId.js';
import type { AppDependencies } from '../../container.js';
import { replyToMessageWithAi } from '../ai/replyToMessageWithAi.js';
import { errorEmbed } from '../embeds.js';
import { onTicketMessage } from '../tickets/onTicketMessage.js';

export async function onMessageCreate(message: Message, deps: AppDependencies): Promise<void> {
  const botUser = message.client.user;

  if (!botUser || message.author.bot) {
    return;
  }

  const ticket = await deps.resolveTicketChannel.execute(message.channelId);
  if (ticket) {
    await onTicketMessage(message, deps, ticket);
    return;
  }

  if (!message.mentions.users.has(botUser.id)) {
    return;
  }

  const settings = await deps.getGuildSettings.execute(message.guildId);

  if (!settings.mentionEnabled) {
    return;
  }

  try {
    assertAiAllowed(settings, message.channelId);
  } catch {
    return;
  }

  const question = message.content.replace(new RegExp(`<@!?${botUser.id}>`, 'g'), '').trim();

  if (question.length === 0) {
    await message.reply({
      embeds: [errorEmbed('Me mencione junto com uma pergunta. Ex.: `@bot o que é TypeScript?`')],
    });
    return;
  }

  await replyToMessageWithAi(message, deps, {
    conversationId: conversationId(message.author.id, message.channelId),
    question,
    systemPrompt: settings.systemPrompt,
    model: settings.model,
    maxHistoryMessages: settings.maxHistoryMessages,
    cooldownMs: settings.cooldownMs,
  });
}
