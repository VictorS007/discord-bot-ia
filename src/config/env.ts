/**
 * Carrega e valida as variáveis de ambiente do bot.
 *
 * Qualquer valor inválido encerra o processo na inicialização,
 * evitando um bot "meio configurado" em produção.
 */
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN é obrigatório'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID é obrigatório'),
  DISCORD_GUILD_ID: z.string().optional(),

  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY é obrigatório'),
  OPENAI_BASE_URL: z
    .string()
    .url('OPENAI_BASE_URL deve ser uma URL válida')
    .default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SYSTEM_PROMPT: z
    .string()
    .min(1)
    .default(
      'Você é um assistente útil em um servidor Discord. Responda de forma clara, objetiva e amigável. Use português, a menos que o usuário escreva em outro idioma.',
    ),
  MAX_HISTORY_MESSAGES: z.coerce.number().int().positive().max(50).default(20),
  USER_COOLDOWN_MS: z.coerce.number().int().positive().default(3000),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Lê `process.env`, aplica defaults e lança um erro descritivo se algo estiver ausente.
 */
export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n');

    throw new Error(`Configuração inválida:\n${details}`);
  }

  return parsed.data;
}
