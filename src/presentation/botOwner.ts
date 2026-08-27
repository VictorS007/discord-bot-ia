/**
 * Confere se o usuário é o dono da aplicação (ou está em BOT_OWNER_ID).
 */
import type { Client } from 'discord.js';
import { NotBotOwnerError } from '../shared/errors.js';

export async function assertBotOwner(client: Client, userId: string, envOwnerId?: string): Promise<void> {
  if (await isBotOwner(client, userId, envOwnerId)) {
    return;
  }

  throw new NotBotOwnerError();
}

export async function isBotOwner(client: Client, userId: string, envOwnerId?: string): Promise<boolean> {
  if (envOwnerId && userId === envOwnerId) {
    return true;
  }

  const app = client.application;
  if (!app) {
    return false;
  }

  if (!app.owner) {
    await app.fetch();
  }

  const owner = app.owner;
  if (!owner) {
    return false;
  }

  if ('members' in owner) {
    if (owner.ownerId === userId) {
      return true;
    }

    return owner.members.has(userId);
  }

  return owner.id === userId;
}
