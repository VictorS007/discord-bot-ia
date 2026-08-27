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
