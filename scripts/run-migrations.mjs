import postgres from 'postgres';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

// Try pooler first, then direct
for (const port of ['6543', '5432']) {
  const conn = url.replace(':6543', ':' + port);
  console.log('Trying port', port, '...');
  const sql = postgres(conn, { ssl: 'require', max: 1, connect_timeout: 5 });
  try {
    await sql`SELECT 1`;
    console.log('Connected on port', port);
    const migrations = ['0009_documents.sql','0010_subsidies.sql','0011_contracts.sql','0012_insurance.sql'];
    for (const m of migrations) {
      const fp = resolve(__dirname, '..', 'drizzle', 'migrations', m);
      if (!existsSync(fp)) { console.log('SKIP', m); continue; }
      const c = readFileSync(fp, 'utf-8');
      console.log('Running', m, '...');
      await sql.unsafe(c);
      console.log('OK');
    }
    await sql.end();
    process.exit(0);
  } catch (e) {
    console.log('Port', port, 'failed:', e.message?.slice(0, 100));
    await sql.end({ timeout: 2 });
  }
}
console.error('Could not connect');
process.exit(1);
