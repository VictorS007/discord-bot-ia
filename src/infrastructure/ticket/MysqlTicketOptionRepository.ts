/**
 * Persistência MySQL das opções do painel de tickets.
 */
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { toIso, toMysqlDateTime } from '../database/mysqlDate.js';
import type { NewTicketOption, TicketOption } from '../../domain/ticket/TicketOption.js';
import type { TicketOptionRepository } from '../../domain/ticket/TicketOptionRepository.js';

interface TicketOptionRow extends RowDataPacket {
  id: number;
  guild_id: string;
  panel_channel_id: string;
  label: string;
  category_id: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export class MysqlTicketOptionRepository implements TicketOptionRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: NewTicketOption): Promise<TicketOption> {
    const now = new Date().toISOString();
    const [result] = await this.pool.execute<ResultSetHeader>(
      `
      INSERT INTO ticket_options (
        guild_id, panel_channel_id, label, category_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        input.guildId,
        input.panelChannelId,
        input.label,
        input.categoryId,
        toMysqlDateTime(now),
        toMysqlDateTime(now),
      ],
    );

    return {
      id: Number(result.insertId),
      guildId: input.guildId,
      panelChannelId: input.panelChannelId,
      label: input.label,
      categoryId: input.categoryId,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findById(id: number): Promise<TicketOption | null> {
    const [rows] = await this.pool.execute<TicketOptionRow[]>(
      'SELECT * FROM ticket_options WHERE id = ? LIMIT 1',
      [id],
    );
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async listByGuild(guildId: string): Promise<TicketOption[]> {
    const [rows] = await this.pool.execute<TicketOptionRow[]>(
      'SELECT * FROM ticket_options WHERE guild_id = ? ORDER BY panel_channel_id ASC, id ASC',
      [guildId],
    );
    return rows.map(toDomain);
  }

  async listByPanelChannel(guildId: string, panelChannelId: string): Promise<TicketOption[]> {
    const [rows] = await this.pool.execute<TicketOptionRow[]>(
      'SELECT * FROM ticket_options WHERE guild_id = ? AND panel_channel_id = ? ORDER BY id ASC',
      [guildId, panelChannelId],
    );
    return rows.map(toDomain);
  }

  async delete(id: number, guildId: string): Promise<boolean> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      'DELETE FROM ticket_options WHERE id = ? AND guild_id = ?',
      [id, guildId],
    );
    return result.affectedRows > 0;
  }

  async deleteByGuildId(guildId: string): Promise<void> {
    await this.pool.execute('DELETE FROM ticket_options WHERE guild_id = ?', [guildId]);
  }
}

function toDomain(row: TicketOptionRow): TicketOption {
  return {
    id: Number(row.id),
    guildId: String(row.guild_id),
    panelChannelId: String(row.panel_channel_id),
    label: String(row.label),
    categoryId: String(row.category_id),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}
