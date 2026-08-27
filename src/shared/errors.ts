/**
 * Erros de domínio: falhas esperadas que o usuário pode entender.
 * Erros fora desta hierarquia são tratados como falha inesperada.
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly userMessage: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class AiProviderError extends AppError {
  constructor(message: string, userMessage = 'A IA não conseguiu responder agora. Tente novamente em instantes.') {
    super(message, userMessage);
  }
}

export class RateLimitError extends AppError {
  constructor(waitMs: number) {
    const seconds = Math.ceil(waitMs / 1000);
    super(
      `Rate limit: aguarde ${waitMs}ms`,
      `Calma aí — você pode enviar outra pergunta em ${seconds}s.`,
    );
  }
}

export class NotInGuildError extends AppError {
  constructor() {
    super('Comando fora de servidor', 'Este comando só funciona dentro de um servidor.');
  }
}

export class MissingPermissionError extends AppError {
  constructor() {
    super(
      'Sem permissão para configurar o servidor',
      'Você precisa da permissão **Gerenciar Servidor** para alterar as configurações.',
    );
  }
}

export class GuildAiDisabledError extends AppError {
  constructor() {
    super('IA desligada neste servidor', 'A IA está desligada neste servidor. Um administrador pode ligar com `/config ia`.');
  }
}

export class ChannelNotAllowedError extends AppError {
  constructor(channelId: string) {
    super(
      `IA restrita ao canal ${channelId}`,
      `Neste servidor a IA só responde em <#${channelId}>.`,
    );
  }
}
