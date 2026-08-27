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
  USER_COOLDOWN_MS: z.coerce.number().int().min(0).default(3000),

  MYSQL_HOST: z.string().min(1).default('127.0.0.1'),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_USER: z.string().min(1).default('root'),
  MYSQL_PASSWORD: z.string().default(''),
  MYSQL_DATABASE: z
    .string()
    .regex(/^[A-Za-z0-9_]+$/, 'MYSQL_DATABASE deve conter só letras, números e underscore')
    .default('discord_bot_ia'),
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
