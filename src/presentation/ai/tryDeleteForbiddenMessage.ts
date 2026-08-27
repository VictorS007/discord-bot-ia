/**
 * Tenta apagar a mensagem que disparou o filtro (precisa de Gerenciar Mensagens).
 */
import type { Message } from 'discord.js';

export async function tryDeleteForbiddenMessage(message: Message): Promise<void> {
  await message.delete().catch(() => undefined);
}
