export interface TicketPanel {
  guildId: string;
  channelId: string;
  messageId: string;
}

export interface TicketPanelRepository {
  find(guildId: string, channelId: string): Promise<TicketPanel | null>;
  save(panel: TicketPanel): Promise<void>;
  delete(guildId: string, channelId: string): Promise<void>;
  deleteByGuildId(guildId: string): Promise<void>;
}
