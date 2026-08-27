/**
 * Abre um pool MySQL, cria o database se não existir e aplica migrations.
 */
import mysql, { type Pool } from 'mysql2/promise';
import { migrate } from './migrate.js';

export interface MysqlConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export async function openMysql(config: MysqlConnectionConfig): Promise<Pool> {
  const bootstrap = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  });

  try {
    await bootstrap.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await bootstrap.end();
  }

  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',
  });

  await migrate(pool);
  return pool;
}
