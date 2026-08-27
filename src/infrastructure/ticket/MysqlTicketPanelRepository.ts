/**
 * Persistência do message ID do painel de tickets em cada canal.
 */
import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { TicketPanel, TicketPanelRepository } from '../../domain/ticket/TicketPanel.js';

interface TicketPanelRow extends RowDataPacket {
  guild_id: string;
  channel_id: string;
  message_id: string;
}

export class MysqlTicketPanelRepository implements TicketPanelRepository {
  constructor(private readonly pool: Pool) {}

  async find(guildId: string, channelId: string): Promise<TicketPanel | null> {
    const [rows] = await this.pool.execute<TicketPanelRow[]>(
      'SELECT * FROM ticket_panels WHERE guild_id = ? AND channel_id = ? LIMIT 1',
      [guildId, channelId],
    );
    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      guildId: String(row.guild_id),
      channelId: String(row.channel_id),
      messageId: String(row.message_id),
    };
  }

  async save(panel: TicketPanel): Promise<void> {
    await this.pool.execute(
      `
      INSERT INTO ticket_panels (guild_id, channel_id, message_id)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE message_id = VALUES(message_id)
      `,
      [panel.guildId, panel.channelId, panel.messageId],
    );
  }

  async delete(guildId: string, channelId: string): Promise<void> {
    await this.pool.execute('DELETE FROM ticket_panels WHERE guild_id = ? AND channel_id = ?', [
      guildId,
      channelId,
    ]);
  }

  async deleteByGuildId(guildId: string): Promise<void> {
    await this.pool.execute('DELETE FROM ticket_panels WHERE guild_id = ?', [guildId]);
  }
}
