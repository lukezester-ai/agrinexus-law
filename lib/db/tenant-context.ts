import { getSessionUser } from '@/lib/billing/auth';
import { getDb } from '@/lib/db/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

const DEV_TENANT_ID = '3dc9d600-6d52-4702-8570-eebafd2cbba3';

export async function resolveTenantId(): Promise<string> {
  try {
    const sessionUser = await getSessionUser();
    if (sessionUser?.email) {
      const { db } = getDb();
      const found = await db
        .select({ tenantId: users.tenantId })
        .from(users)
        .where(eq(users.email, sessionUser.email))
        .limit(1);
      if (found.length > 0) return found[0].tenantId;
    }
  } catch {
    // Auth unavailable — fallback to dev tenant
  }
  return DEV_TENANT_ID;
}
