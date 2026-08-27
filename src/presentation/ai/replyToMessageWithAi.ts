/**
 * Envia uma resposta da IA para uma mensagem de canal, com cooldown e split.
 */
import type { Message } from 'discord.js';
import { DISCORD_MESSAGE_LIMIT } from '../../config/constants.js';
import type { AppDependencies } from '../../container.js';
import { AppError, ForbiddenContentError, RateLimitError } from '../../shared/errors.js';
import { splitMessage } from '../../shared/splitMessage.js';
import { errorEmbed } from '../embeds.js';
import { tryDeleteForbiddenMessage } from './tryDeleteForbiddenMessage.js';

export async function replyToMessageWithAi(
  message: Message,
  deps: AppDependencies,
  input: {
    conversationId: string;
    question: string;
    systemPrompt: string;
    model: string;
    maxHistoryMessages: number;
    cooldownMs: number;
    extraBlockedWords?: string[];
  },
): Promise<void> {
  const wait = deps.cooldown.remaining(message.author.id, input.cooldownMs);

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
      conversationId: input.conversationId,
      question: input.question,
      systemPrompt: input.systemPrompt,
      model: input.model,
      maxHistoryMessages: input.maxHistoryMessages,
      extraBlockedWords: input.extraBlockedWords,
    });

    const [first, ...rest] = splitMessage(answer, DISCORD_MESSAGE_LIMIT);
    await message.reply({ content: first ?? 'Não recebi conteúdo da IA.' });

    for (const chunk of rest) {
      await message.channel.send({ content: chunk });
    }
  } catch (error) {
    if (error instanceof ForbiddenContentError) {
      await tryDeleteForbiddenMessage(message);
      await message.reply({ embeds: [errorEmbed(error.userMessage)] });
      return;
    }

    const text = error instanceof AppError ? error.userMessage : 'Falha inesperada ao consultar a IA.';
    deps.logger.error('Falha ao responder com IA', {
      error: error instanceof Error ? error.message : String(error),
    });
    await message.reply({ embeds: [errorEmbed(text)] });
  }
}
