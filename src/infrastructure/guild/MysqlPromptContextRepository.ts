/**
 * Persistência MySQL dos blocos extras de prompt por servidor.
 */
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PromptContext } from '../../domain/guild/PromptContext.js';
import type { PromptContextRepository } from '../../domain/guild/PromptContextRepository.js';
import { toIso, toMysqlDateTime } from '../database/mysqlDate.js';

interface PromptContextRow extends RowDataPacket {
  id: number;
  guild_id: string;
  title: string;
  content: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export class MysqlPromptContextRepository implements PromptContextRepository {
  constructor(private readonly pool: Pool) {}

  async listByGuild(guildId: string): Promise<PromptContext[]> {
    const [rows] = await this.pool.execute<PromptContextRow[]>(
      'SELECT * FROM guild_prompt_contexts WHERE guild_id = ? ORDER BY id ASC',
      [guildId],
    );
    return rows.map(toDomain);
  }

  async findById(id: number): Promise<PromptContext | null> {
    const [rows] = await this.pool.execute<PromptContextRow[]>(
      'SELECT * FROM guild_prompt_contexts WHERE id = ? LIMIT 1',
      [id],
    );
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async create(input: { guildId: string; title: string; content: string }): Promise<PromptContext> {
    const now = new Date().toISOString();
    const [result] = await this.pool.execute<ResultSetHeader>(
      `
      INSERT INTO guild_prompt_contexts (guild_id, title, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      `,
      [input.guildId, input.title, input.content, toMysqlDateTime(now), toMysqlDateTime(now)],
    );

    return {
      id: Number(result.insertId),
      guildId: input.guildId,
      title: input.title,
      content: input.content,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(context: PromptContext): Promise<void> {
    await this.pool.execute(
      `
      UPDATE guild_prompt_contexts
      SET title = ?, content = ?, updated_at = ?
      WHERE id = ? AND guild_id = ?
      `,
      [context.title, context.content, toMysqlDateTime(context.updatedAt), context.id, context.guildId],
    );
  }

  async delete(id: number, guildId: string): Promise<boolean> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      'DELETE FROM guild_prompt_contexts WHERE id = ? AND guild_id = ?',
      [id, guildId],
    );
    return result.affectedRows > 0;
  }

  async deleteByGuildId(guildId: string): Promise<void> {
    await this.pool.execute('DELETE FROM guild_prompt_contexts WHERE guild_id = ?', [guildId]);
  }
}

function toDomain(row: PromptContextRow): PromptContext {
  return {
    id: Number(row.id),
    guildId: String(row.guild_id),
    title: String(row.title),
    content: String(row.content),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}
