/**
 * Composition root: instancia dependências e liga os eventos do Discord.
 *
 * Este é o único lugar que conhece implementações concretas (OpenAI, MySQL, etc.).
 */
import { Events } from 'discord.js';
import { AddPromptContextUseCase } from './application/AddPromptContextUseCase.js';
import { AddTicketOptionUseCase } from './application/AddTicketOptionUseCase.js';
import { AskAiUseCase } from './application/AskAiUseCase.js';
import { CloseTicketUseCase } from './application/CloseTicketUseCase.js';
import { GetGuildSettingsUseCase } from './application/GetGuildSettingsUseCase.js';
import { ListTicketOptionsUseCase } from './application/ListTicketOptionsUseCase.js';
import { OpenTicketUseCase } from './application/OpenTicketUseCase.js';
import { PurgeGuildTicketsUseCase } from './application/PurgeGuildTicketsUseCase.js';
import { RemovePromptContextUseCase } from './application/RemovePromptContextUseCase.js';
import { RemoveTicketOptionUseCase } from './application/RemoveTicketOptionUseCase.js';
import { ResolveTicketChannelUseCase } from './application/ResolveTicketChannelUseCase.js';
import { UpdateTicketOptionInstructionsUseCase } from './application/UpdateTicketOptionInstructionsUseCase.js';
import { ResetConversationUseCase } from './application/ResetConversationUseCase.js';
import { ResetGuildSettingsUseCase } from './application/ResetGuildSettingsUseCase.js';
import { UpdateGuildSettingsUseCase } from './application/UpdateGuildSettingsUseCase.js';
import type { Env } from './config/env.js';
import type { AppDependencies } from './container.js';
import type { GuildSettingsDefaults } from './domain/guild/GuildSettings.js';
import type { ContentModerator } from './domain/moderation/ContentModerator.js';
import { parseBlockedWords } from './domain/moderation/ContentModerator.js';
import { OpenAiCompatibleProvider } from './infrastructure/ai/OpenAiCompatibleProvider.js';
import { InMemoryConversationStore } from './infrastructure/conversation/InMemoryConversationStore.js';
import { openMysql } from './infrastructure/database/openMysql.js';
import { createDiscordClient } from './infrastructure/discord/createClient.js';
import { MysqlGuildSettingsRepository } from './infrastructure/guild/MysqlGuildSettingsRepository.js';
import { MysqlPromptContextRepository } from './infrastructure/guild/MysqlPromptContextRepository.js';
import { BlockedWordsModerator } from './infrastructure/moderation/BlockedWordsModerator.js';
import { CompositeContentModerator } from './infrastructure/moderation/CompositeContentModerator.js';
import { DetoxifyModerator } from './infrastructure/moderation/DetoxifyModerator.js';
import { MysqlTicketOptionRepository } from './infrastructure/ticket/MysqlTicketOptionRepository.js';
import { MysqlTicketPanelRepository } from './infrastructure/ticket/MysqlTicketPanelRepository.js';
import { MysqlTicketRepository } from './infrastructure/ticket/MysqlTicketRepository.js';
import { onChannelDelete } from './presentation/events/onChannelDelete.js';
import { onGuildDelete } from './presentation/events/onGuildDelete.js';
import { onInteractionCreate } from './presentation/events/onInteractionCreate.js';
import { onMessageCreate } from './presentation/events/onMessageCreate.js';
import { onReady } from './presentation/events/onReady.js';
import { Cooldown } from './shared/cooldown.js';
import { Logger } from './shared/logger.js';

export async function startBot(env: Env): Promise<void> {
  const logger = new Logger(env.LOG_LEVEL);
  const pool = await openMysql({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
  });
  logger.info('MySQL pronto', { host: env.MYSQL_HOST, database: env.MYSQL_DATABASE });

  const guildSettings = new MysqlGuildSettingsRepository(pool);
  const promptContexts = new MysqlPromptContextRepository(pool);
  const ticketOptions = new MysqlTicketOptionRepository(pool);
  const tickets = new MysqlTicketRepository(pool);
  const ticketPanels = new MysqlTicketPanelRepository(pool);

  const defaults: GuildSettingsDefaults = {
    systemPrompt: env.SYSTEM_PROMPT,
    model: env.OPENAI_MODEL,
    cooldownMs: env.USER_COOLDOWN_MS,
    maxHistoryMessages: env.MAX_HISTORY_MESSAGES,
  };

  const conversations = new InMemoryConversationStore();
  const ai = new OpenAiCompatibleProvider(env.OPENAI_API_KEY, env.OPENAI_BASE_URL, logger);
  const moderator = createContentModerator(env, logger);

  const deps: AppDependencies = {
    env,
    logger,
    askAi: new AskAiUseCase(ai, conversations, moderator),
    resetConversation: new ResetConversationUseCase(conversations),
    getGuildSettings: new GetGuildSettingsUseCase(guildSettings, promptContexts, defaults),
    updateGuildSettings: new UpdateGuildSettingsUseCase(guildSettings, promptContexts, defaults),
    resetGuildSettings: new ResetGuildSettingsUseCase(guildSettings, promptContexts),
    addPromptContext: new AddPromptContextUseCase(promptContexts),
    removePromptContext: new RemovePromptContextUseCase(promptContexts),
    addTicketOption: new AddTicketOptionUseCase(ticketOptions),
    removeTicketOption: new RemoveTicketOptionUseCase(ticketOptions),
    listTicketOptions: new ListTicketOptionsUseCase(ticketOptions),
    openTicket: new OpenTicketUseCase(ticketOptions, tickets),
    closeTicket: new CloseTicketUseCase(tickets),
    purgeGuildTickets: new PurgeGuildTicketsUseCase(ticketOptions, tickets, ticketPanels),
    resolveTicketChannel: new ResolveTicketChannelUseCase(tickets, ticketOptions),
    updateTicketOptionInstructions: new UpdateTicketOptionInstructionsUseCase(ticketOptions),
    ticketPanels,
    cooldown: new Cooldown(),
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

  client.on(Events.GuildDelete, (guild) => {
    void onGuildDelete(guild, deps);
  });

  client.on(Events.ChannelDelete, (channel) => {
    void onChannelDelete(channel, deps);
  });

  client.on(Events.Error, (error) => {
    logger.error('Erro do cliente Discord', { error: error.message });
  });

  const shutdown = async (signal: string) => {
    logger.info(`Encerrando (${signal})`);
    client.destroy();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  try {
    await client.login(env.DISCORD_TOKEN);
  } catch (error) {
    await pool.end();
    throw error;
  }
}

function createContentModerator(env: Env, logger: Logger): CompositeContentModerator {
  const layers: ContentModerator[] = [new BlockedWordsModerator(parseBlockedWords(env.BLOCKED_WORDS))];

  if (env.DETOXIFY_ENABLED) {
    layers.push(
      new DetoxifyModerator(
        env.DETOXIFY_URL,
        env.DETOXIFY_THRESHOLD,
        env.DETOXIFY_CONTEXT_THRESHOLD,
        env.DETOXIFY_CONTEXT_MESSAGES,
        env.DETOXIFY_FAIL_CLOSED,
        logger,
      ),
    );
    logger.info('Filtro Detoxify ativo', {
      url: env.DETOXIFY_URL,
      limiar: env.DETOXIFY_THRESHOLD,
      limiarContexto: env.DETOXIFY_CONTEXT_THRESHOLD,
      mensagensContexto: env.DETOXIFY_CONTEXT_MESSAGES,
    });
  } else {
    logger.warn('Detoxify desligado — só a lista de palavras bloqueadas será usada');
  }

  return new CompositeContentModerator(layers);
}
