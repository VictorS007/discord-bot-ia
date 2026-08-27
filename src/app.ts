/**
 * Composition root: instancia dependências e liga os eventos do Discord.
 *
 * Este é o único lugar que conhece implementações concretas (OpenAI, memória, etc.).
 */
import { Events } from 'discord.js';
import { AskAiUseCase } from './application/AskAiUseCase.js';
import { ResetConversationUseCase } from './application/ResetConversationUseCase.js';
import type { Env } from './config/env.js';
import type { AppDependencies } from './container.js';
import { OpenAiCompatibleProvider } from './infrastructure/ai/OpenAiCompatibleProvider.js';
import { InMemoryConversationStore } from './infrastructure/conversation/InMemoryConversationStore.js';
import { createDiscordClient } from './infrastructure/discord/createClient.js';
import { onInteractionCreate } from './presentation/events/onInteractionCreate.js';
import { onMessageCreate } from './presentation/events/onMessageCreate.js';
import { onReady } from './presentation/events/onReady.js';
import { Cooldown } from './shared/cooldown.js';
import { Logger } from './shared/logger.js';

export async function startBot(env: Env): Promise<void> {
  const logger = new Logger(env.LOG_LEVEL);
  const conversations = new InMemoryConversationStore();
  const ai = new OpenAiCompatibleProvider(env.OPENAI_API_KEY, env.OPENAI_BASE_URL, env.OPENAI_MODEL, logger);

  const deps: AppDependencies = {
    env,
    logger,
    askAi: new AskAiUseCase(ai, conversations, env.SYSTEM_PROMPT, env.MAX_HISTORY_MESSAGES),
    resetConversation: new ResetConversationUseCase(conversations),
    cooldown: new Cooldown(env.USER_COOLDOWN_MS),
  };

  const client = createDiscordClient();

  client.once(Events.ClientReady, (readyClient) => {
    void onReady(readyClient, deps);
  });

  client.on(Events.InteractionCreate, (interaction) => {
    void onInteractionCreate(interaction, deps);
  });

  client.on(Events.MessageCreate, (message) => {
    void onMessageCreate(message, deps);
  });

  client.on(Events.Error, (error) => {
    logger.error('Erro do cliente Discord', { error: error.message });
  });

  process.on('SIGINT', () => {
    logger.info('Encerrando (SIGINT)');
    client.destroy();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Encerrando (SIGTERM)');
    client.destroy();
    process.exit(0);
  });

  await client.login(env.DISCORD_TOKEN);
}
