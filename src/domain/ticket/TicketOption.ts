/**
 * Uma opção do menu de tickets.
 *
 * `panelChannelId` é a sala onde o painel aparece.
 * `categoryId` é a categoria onde o canal do ticket é criado.
 */
export interface TicketOption {
  id: number;
  guildId: string;
  panelChannelId: string;
  label: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewTicketOption {
  guildId: string;
  panelChannelId: string;
  label: string;
  categoryId: string;
}

export const TICKET_OPTIONS_PER_CHANNEL_LIMIT = 25;
