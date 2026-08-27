import type { NewTicketOption, TicketOption } from './TicketOption.js';

export interface TicketOptionRepository {
  create(input: NewTicketOption): Promise<TicketOption>;
  findById(id: number): Promise<TicketOption | null>;
  listByGuild(guildId: string): Promise<TicketOption[]>;
  listByPanelChannel(guildId: string, panelChannelId: string): Promise<TicketOption[]>;
  update(option: TicketOption): Promise<void>;
  delete(id: number, guildId: string): Promise<boolean>;
  deleteByGuildId(guildId: string): Promise<void>;
}
