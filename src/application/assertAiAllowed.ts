/**
 * Regras de acesso à IA a partir da configuração do servidor.
 */
import type { ResolvedGuildSettings } from '../domain/guild/GuildSettings.js';
import { ChannelNotAllowedError, GuildAiDisabledError } from '../shared/errors.js';

export function assertAiAllowed(settings: ResolvedGuildSettings, channelId: string): void {
  if (!settings.aiEnabled) {
    throw new GuildAiDisabledError();
  }

  if (settings.allowedChannelId && settings.allowedChannelId !== channelId) {
    throw new ChannelNotAllowedError(settings.allowedChannelId);
  }
}
