import { getDb } from './db';
import { ensureStandardAccounts } from '@/lib/accounting/standard-accounts';

async function seed() {
  const tenantId = process.argv[2];

  if (!tenantId) {
    console.error('Usage: npx tsx lib/db/seed.ts <tenantId>');
    console.error('Provide a tenant (farm) ID to seed standard accounts.');
    process.exit(1);
  }

  console.log(`Seeding standard accounts for tenant: ${tenantId}`);
  await ensureStandardAccounts(tenantId);
  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
