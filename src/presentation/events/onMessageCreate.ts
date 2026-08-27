/**
 * Responde quando o bot é mencionado em uma mensagem de texto.
 *
 * Exemplo: "@Bot explique o que é Clean Architecture"
 */
import type { Message } from 'discord.js';
import { assertAiAllowed } from '../../application/assertAiAllowed.js';
import { DISCORD_MESSAGE_LIMIT } from '../../config/constants.js';
import { conversationId } from '../../domain/conversation/conversationId.js';
import type { AppDependencies } from '../../container.js';
import { AppError, RateLimitError } from '../../shared/errors.js';
import { splitMessage } from '../../shared/splitMessage.js';
import { errorEmbed } from '../embeds.js';

export async function onMessageCreate(message: Message, deps: AppDependencies): Promise<void> {
  const botUser = message.client.user;

  if (!botUser || message.author.bot || !message.mentions.users.has(botUser.id)) {
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

  const wait = deps.cooldown.remaining(message.author.id, settings.cooldownMs);

  if (wait > 0) {
    await message.reply({ embeds: [errorEmbed(new RateLimitError(wait).userMessage)] });
    return;
  }

  if (!message.channel.isSendable()) {
    return;
  }

  deps.cooldown.hit(message.author.id);
  await message.channel.sendTyping();

  try {
    const answer = await deps.askAi.execute({
      conversationId: conversationId(message.author.id, message.channelId),
      question,
      systemPrompt: settings.systemPrompt,
      model: settings.model,
      maxHistoryMessages: settings.maxHistoryMessages,
    });

    const chunks = splitMessage(answer, DISCORD_MESSAGE_LIMIT);
    const [first, ...rest] = chunks;

    await message.reply({ content: first ?? 'Não recebi conteúdo da IA.' });

    for (const chunk of rest) {
      await message.channel.send({ content: chunk });
    }
  } catch (error) {
    const text = error instanceof AppError ? error.userMessage : 'Falha inesperada ao consultar a IA.';
    deps.logger.error('Falha ao responder menção', {
      error: error instanceof Error ? error.message : String(error),
    });
    await message.reply({ embeds: [errorEmbed(text)] });
  }
}
