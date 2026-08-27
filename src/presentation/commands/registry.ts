/**
 * Catálogo de slash commands. Para adicionar um comando novo:
 * 1. Crie o arquivo em `presentation/commands/`
 * 2. Exporte-o neste array
 */
import { askCommand } from './ask.js';
import type { Command } from './Command.js';
import { configCommand } from './config.js';
import { helpCommand } from './help.js';
import { pingCommand } from './ping.js';
import { resetCommand } from './reset.js';

export const commands: Command[] = [askCommand, resetCommand, pingCommand, helpCommand, configCommand];

export const commandsByName = new Map(commands.map((command) => [command.data.name, command]));
