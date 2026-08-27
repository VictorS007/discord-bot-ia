/**
 * Configuração persistida de um servidor Discord.
 *
 * Campos `null` significam “usar o padrão global do .env”.
 * Booleanos sempre têm valor concreto (não herdam de ambiente).
 */
export interface GuildSettings {
  guildId: string;
  aiEnabled: boolean;
  mentionEnabled: boolean;
  systemPrompt: string | null;
  model: string | null;
  allowedChannelId: string | null;
  cooldownMs: number | null;
  maxHistoryMessages: number | null;
  ticketAiEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Valores globais aplicados quando o servidor ainda não personalizou o campo. */
export interface GuildSettingsDefaults {
  systemPrompt: string;
  model: string;
  cooldownMs: number;
  maxHistoryMessages: number;
}

/** Configuração efetiva usada em runtime (já mesclada com os defaults). */
export interface ResolvedGuildSettings {
  guildId: string;
  aiEnabled: boolean;
  mentionEnabled: boolean;
  systemPrompt: string;
  model: string;
  allowedChannelId: string | null;
  cooldownMs: number;
  maxHistoryMessages: number;
  usingDefaultPrompt: boolean;
  usingDefaultModel: boolean;
  usingDefaultCooldown: boolean;
  usingDefaultHistory: boolean;
  ticketAiEnabled: boolean;
}

export type GuildSettingsPatch = {
  aiEnabled?: boolean;
  mentionEnabled?: boolean;
  systemPrompt?: string | null;
  model?: string | null;
  allowedChannelId?: string | null;
  cooldownMs?: number | null;
  maxHistoryMessages?: number | null;
  ticketAiEnabled?: boolean;
};

export function resolveGuildSettings(
  stored: GuildSettings | null,
  guildId: string,
  defaults: GuildSettingsDefaults,
): ResolvedGuildSettings {
  return {
    guildId,
    aiEnabled: stored?.aiEnabled ?? true,
    mentionEnabled: stored?.mentionEnabled ?? true,
    systemPrompt: stored?.systemPrompt ?? defaults.systemPrompt,
    model: stored?.model ?? defaults.model,
    allowedChannelId: stored?.allowedChannelId ?? null,
    cooldownMs: stored?.cooldownMs ?? defaults.cooldownMs,
    maxHistoryMessages: stored?.maxHistoryMessages ?? defaults.maxHistoryMessages,
    usingDefaultPrompt: stored?.systemPrompt == null,
    usingDefaultModel: stored?.model == null,
    usingDefaultCooldown: stored?.cooldownMs == null,
    usingDefaultHistory: stored?.maxHistoryMessages == null,
    ticketAiEnabled: stored?.ticketAiEnabled ?? true,
  };
}

export function applyGuildSettingsPatch(
  current: GuildSettings | null,
  guildId: string,
  patch: GuildSettingsPatch,
  nowIso: string,
): GuildSettings {
  return {
    guildId,
    aiEnabled: patch.aiEnabled ?? current?.aiEnabled ?? true,
    mentionEnabled: patch.mentionEnabled ?? current?.mentionEnabled ?? true,
    systemPrompt: patch.systemPrompt !== undefined ? patch.systemPrompt : (current?.systemPrompt ?? null),
    model: patch.model !== undefined ? patch.model : (current?.model ?? null),
    allowedChannelId:
      patch.allowedChannelId !== undefined ? patch.allowedChannelId : (current?.allowedChannelId ?? null),
    cooldownMs: patch.cooldownMs !== undefined ? patch.cooldownMs : (current?.cooldownMs ?? null),
    maxHistoryMessages:
      patch.maxHistoryMessages !== undefined ? patch.maxHistoryMessages : (current?.maxHistoryMessages ?? null),
    ticketAiEnabled: patch.ticketAiEnabled ?? current?.ticketAiEnabled ?? true,
    createdAt: current?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
}
