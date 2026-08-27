/**
 * Persistência MySQL dos tickets abertos/fechados.
 */
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { toIso, toMysqlDateTime } from '../database/mysqlDate.js';
import type { NewTicket, Ticket, TicketStatus } from '../../domain/ticket/Ticket.js';
import type { TicketRepository } from '../../domain/ticket/TicketRepository.js';

interface TicketRow extends RowDataPacket {
  id: number;
  guild_id: string;
  option_id: number;
  channel_id: string;
  user_id: string;
  status: TicketStatus;
  created_at: Date | string;
  closed_at: Date | string | null;
}

export class MysqlTicketRepository implements TicketRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: NewTicket): Promise<Ticket> {
    const now = new Date().toISOString();
    const [result] = await this.pool.execute<ResultSetHeader>(
      `
      INSERT INTO tickets (
        guild_id, option_id, channel_id, user_id, status, created_at, closed_at
      ) VALUES (?, ?, ?, ?, 'open', ?, NULL)
      `,
      [input.guildId, input.optionId, input.channelId, input.userId, toMysqlDateTime(now)],
    );

    return {
      id: Number(result.insertId),
      guildId: input.guildId,
      optionId: input.optionId,
      channelId: input.channelId,
      userId: input.userId,
      status: 'open',
      createdAt: now,
      closedAt: null,
    };
  }

  async findOpenByUserAndOption(guildId: string, userId: string, optionId: number): Promise<Ticket | null> {
    const [rows] = await this.pool.execute<TicketRow[]>(
      `
      SELECT * FROM tickets
      WHERE guild_id = ? AND user_id = ? AND option_id = ? AND status = 'open'
      LIMIT 1
      `,
      [guildId, userId, optionId],
    );
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async findOpenByChannelId(channelId: string): Promise<Ticket | null> {
    const [rows] = await this.pool.execute<TicketRow[]>(
      `SELECT * FROM tickets WHERE channel_id = ? AND status = 'open' LIMIT 1`,
      [channelId],
    );
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async close(ticketId: number): Promise<void> {
    await this.pool.execute(
      `UPDATE tickets SET status = 'closed', closed_at = ? WHERE id = ? AND status = 'open'`,
      [toMysqlDateTime(new Date().toISOString()), ticketId],
    );
  }

  async deleteByGuildId(guildId: string): Promise<void> {
    await this.pool.execute('DELETE FROM tickets WHERE guild_id = ?', [guildId]);
  }
}

function toDomain(row: TicketRow): Ticket {
  return {
    id: Number(row.id),
    guildId: String(row.guild_id),
    optionId: Number(row.option_id),
    channelId: String(row.channel_id),
    userId: String(row.user_id),
    status: row.status === 'closed' ? 'closed' : 'open',
    createdAt: toIso(row.created_at),
    closedAt: row.closed_at ? toIso(row.closed_at) : null,
  };
}
