/**
 * Dependências injetadas nos handlers de apresentação.
 *
 * A camada de Discord não instancia casos de uso: recebe-os prontos.
 * Isso mantém os handlers testáveis e desacoplados da infraestrutura.
 */
import type { AskAiUseCase } from './application/AskAiUseCase.js';
import type { GetGuildSettingsUseCase } from './application/GetGuildSettingsUseCase.js';
import type { ResetConversationUseCase } from './application/ResetConversationUseCase.js';
import type { ResetGuildSettingsUseCase } from './application/ResetGuildSettingsUseCase.js';
import type { UpdateGuildSettingsUseCase } from './application/UpdateGuildSettingsUseCase.js';
import type { Env } from './config/env.js';
import type { Cooldown } from './shared/cooldown.js';
import type { Logger } from './shared/logger.js';

export interface AppDependencies {
  env: Env;
  logger: Logger;
  askAi: AskAiUseCase;
  resetConversation: ResetConversationUseCase;
  getGuildSettings: GetGuildSettingsUseCase;
  updateGuildSettings: UpdateGuildSettingsUseCase;
  resetGuildSettings: ResetGuildSettingsUseCase;
  cooldown: Cooldown;
}
