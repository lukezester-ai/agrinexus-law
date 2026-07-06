import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const [,, migrationFile] = process.argv;
const defaultPath = join(__dirname, '..', 'drizzle', 'migrations', '0001_empty_micromax.sql');
const sqlPath = migrationFile || defaultPath;

const url = process.env.DATABASE_URL?.trim();
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const sql = postgres(url, { ssl: 'require', max: 1 });

async function main() {
  const sqlContent = readFileSync(sqlPath, 'utf-8');
  const statements = sqlContent.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
  console.log(`Executing ${statements.length} statements...`);

  for (let i = 0; i < statements.length; i++) {
    try {
      await sql.unsafe(statements[i]);
      console.log(`  [OK] ${i + 1}/${statements.length}`);
    } catch (err) {
      if (err.message?.includes('already exists')) {
        console.log(`  [SKIP] ${i + 1}/${statements.length} — already exists`);
      } else {
        console.error(`  [ERR] ${i + 1}/${statements.length}: ${err.message}`);
      }
    }
  }
  console.log('Done.');
  await sql.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
