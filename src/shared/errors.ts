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

export class NotBotOwnerError extends AppError {
  constructor() {
    super(
      'Apenas o dono do bot pode configurar tickets',
      'Só o **dono do bot** pode configurar o sistema de tickets.',
    );
  }
}

export class TicketOptionLimitError extends AppError {
  constructor(limit: number) {
    super(
      `Limite de ${limit} opções por canal`,
      `Este canal já tem ${limit} opções — o máximo do menu do Discord.`,
    );
  }
}

export class DuplicateTicketOptionError extends AppError {
  constructor(label: string) {
    super(`Opção duplicada: ${label}`, `Já existe uma opção chamada **${label}** neste canal.`);
  }
}

export class TicketAlreadyOpenError extends AppError {
  constructor(channelId: string) {
    super(
      `Ticket já aberto em ${channelId}`,
      `Você já tem um ticket aberto neste tipo: <#${channelId}>.`,
    );
  }
}

export class TicketNotFoundError extends AppError {
  constructor() {
    super('Ticket não encontrado', 'Não achei um ticket aberto neste canal.');
  }
}

export class ForbiddenContentError extends AppError {
  constructor(kind: 'input' | 'output' | 'context' = 'input') {
    super(
      `Conteúdo bloqueado (${kind})`,
      kind === 'output'
        ? 'A resposta foi bloqueada pelo filtro de conteúdo.'
        : kind === 'context'
          ? 'Essa conversa tomou um rumo que não posso continuar. Use `/reset` e reformule.'
          : 'Essa mensagem contém conteúdo não permitido.',
    );
  }
}

export class ModerationUnavailableError extends AppError {
  constructor() {
    super(
      'Serviço Detoxify indisponível',
      'O filtro de conteúdo está indisponível agora. Tente de novo em instantes.',
    );
  }
}
