/**
 * Implementação MySQL do repositório de configurações por servidor.
 */
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { GuildSettings } from '../../domain/guild/GuildSettings.js';
import type { GuildSettingsRepository } from '../../domain/guild/GuildSettingsRepository.js';

interface GuildSettingsRow extends RowDataPacket {
  guild_id: string;
  ai_enabled: number;
  mention_enabled: number;
  system_prompt: string | null;
  model: string | null;
  allowed_channel_id: string | null;
  cooldown_ms: number | null;
  max_history_messages: number | null;
  ticket_ai_enabled: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export class MysqlGuildSettingsRepository implements GuildSettingsRepository {
  constructor(private readonly pool: Pool) {}

  async findByGuildId(guildId: string): Promise<GuildSettings | null> {
    const [rows] = await this.pool.execute<GuildSettingsRow[]>(
      'SELECT * FROM guild_settings WHERE guild_id = ? LIMIT 1',
      [guildId],
    );

    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async save(settings: GuildSettings): Promise<void> {
    await this.pool.execute<ResultSetHeader>(
      `
      INSERT INTO guild_settings (
        guild_id, ai_enabled, mention_enabled, system_prompt, model,
        allowed_channel_id, cooldown_ms, max_history_messages, ticket_ai_enabled,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        ai_enabled = VALUES(ai_enabled),
        mention_enabled = VALUES(mention_enabled),
        system_prompt = VALUES(system_prompt),
        model = VALUES(model),
        allowed_channel_id = VALUES(allowed_channel_id),
        cooldown_ms = VALUES(cooldown_ms),
        max_history_messages = VALUES(max_history_messages),
        ticket_ai_enabled = VALUES(ticket_ai_enabled),
        updated_at = VALUES(updated_at)
      `,
      [
        settings.guildId,
        settings.aiEnabled ? 1 : 0,
        settings.mentionEnabled ? 1 : 0,
        settings.systemPrompt,
        settings.model,
        settings.allowedChannelId,
        settings.cooldownMs,
        settings.maxHistoryMessages,
        settings.ticketAiEnabled ? 1 : 0,
        toMysqlDateTime(settings.createdAt),
        toMysqlDateTime(settings.updatedAt),
      ],
    );
  }

  async delete(guildId: string): Promise<void> {
    await this.pool.execute('DELETE FROM guild_settings WHERE guild_id = ?', [guildId]);
  }
}

function toDomain(row: GuildSettingsRow): GuildSettings {
  return {
    guildId: String(row.guild_id),
    aiEnabled: Number(row.ai_enabled) === 1,
    mentionEnabled: Number(row.mention_enabled) === 1,
    systemPrompt: row.system_prompt,
    model: row.model,
    allowedChannelId: row.allowed_channel_id,
    cooldownMs: row.cooldown_ms === null ? null : Number(row.cooldown_ms),
    maxHistoryMessages: row.max_history_messages === null ? null : Number(row.max_history_messages),
    ticketAiEnabled: Number(row.ticket_ai_enabled) === 1,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toMysqlDateTime(iso: string): string {
  return new Date(iso).toISOString().slice(0, 23).replace('T', ' ');
}
