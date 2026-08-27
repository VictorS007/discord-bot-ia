/**
 * Ponto de entrada do processo.
 *
 * Carrega o ambiente, inicia o bot e registra falhas fatais.
 */
import { startBot } from './app.js';
import { loadEnv } from './config/env.js';

async function main(): Promise<void> {
  const env = loadEnv();
  await startBot(env);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[FATAL] ${message}`);
  process.exit(1);
});
