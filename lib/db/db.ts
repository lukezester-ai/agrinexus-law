import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const globalForDb = globalThis as unknown as { db: ReturnType<typeof drizzle> | undefined; pg: postgres.Sql | undefined };

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return url;
  throw new Error('DATABASE_URL must be set. Get it from Supabase > Project Settings > Database > Connection string (URI)');
}

function createDb() {
  const url = getDatabaseUrl();
  const pg = postgres(url, { ssl: 'require', max: 1 });
  const db = drizzle(pg, { schema });
  return { db, pg };
}

export function getDb() {
  if (process.env.NODE_ENV === 'production') {
    return createDb();
  }
  if (!globalForDb.db) {
    const created = createDb();
    globalForDb.db = created.db;
    globalForDb.pg = created.pg;
  }
  return { db: globalForDb.db!, pg: globalForDb.pg! };
}

export type Db = ReturnType<typeof getDb>['db'];
