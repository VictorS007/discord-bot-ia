/**
 * Migrations idempotentes do MySQL.
 *
 * Cada versão roda no máximo uma vez. Novas colunas/tabelas entram
 * como um novo item em `MIGRATIONS` — nunca edite uma versão já aplicada.
 *
 * DDL no MySQL faz commit implícito; por isso cada versão é aplicada
 * fora de transação, com `CREATE TABLE IF NOT EXISTS` para ser repetível.
 */
import type { Pool, RowDataPacket } from 'mysql2/promise';

const MIGRATIONS: ReadonlyArray<{ version: number; sql: string }> = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id VARCHAR(32) NOT NULL,
        ai_enabled TINYINT(1) NOT NULL DEFAULT 1,
        mention_enabled TINYINT(1) NOT NULL DEFAULT 1,
        system_prompt TEXT NULL,
        model VARCHAR(100) NULL,
        allowed_channel_id VARCHAR(32) NULL,
        cooldown_ms INT NULL,
        max_history_messages INT NULL,
        created_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        PRIMARY KEY (guild_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
];

export async function migrate(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INT NOT NULL,
      applied_at VARCHAR(40) NOT NULL,
      PRIMARY KEY (version)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [appliedRows] = await pool.query<RowDataPacket[]>('SELECT version FROM schema_migrations');
  const applied = new Set(appliedRows.map((row) => Number(row.version)));

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) {
      continue;
    }

    await pool.query(migration.sql);
    await pool.execute('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      migration.version,
      new Date().toISOString(),
    ]);
  }
}
