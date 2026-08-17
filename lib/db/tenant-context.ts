import { getSessionUser } from '@/lib/billing/auth';
import { getDb } from '@/lib/db/db';
import { users } from '@/lib/db/schema/users';
import { tenants } from '@/lib/db/schema/tenants';
import { eq } from 'drizzle-orm';

const DEV_TENANT_ID = '3dc9d600-6d52-4702-8570-eebafd2cbba3';

export class TenantAuthError extends Error {
  statusCode = 401;
  constructor(message = 'Unauthorized: влезте в профила си, за да достъпите данните.') {
    super(message);
    this.name = 'TenantAuthError';
  }
}

/**
 * Създава tenant + users ред за нов потребител (идемпотентно, в транзакция).
 * Връща tenantId на потребителя.
 */
async function ensureTenantForUser(email: string): Promise<string> {
  const { db } = getDb();
  const found = await db
    .select({ tenantId: users.tenantId })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (found.length > 0) return found[0].tenantId;

  const tenantName = email.split('@')[0] || email;
  try {
    return await db.transaction(async (tx) => {
      const existing = await tx
        .select({ tenantId: users.tenantId })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existing.length > 0) return existing[0].tenantId;

      const [tenant] = await tx
        .insert(tenants)
        .values({
          name: tenantName,
          email,
          plan: 'free',
          isActive: true,
        })
        .returning();

      await tx.insert(users).values({
        tenantId: tenant.id,
        email,
        role: 'owner',
        isActive: true,
      });

      return tenant.id;
    });
  } catch (err: any) {
    // Concurrent signup for the same email — връщаме съществуващия tenant
    const isUniqueViolation =
      typeof err?.code === 'string' && ['23505', '23P01'].includes(err.code);
    if (isUniqueViolation) {
      const retry = await db
        .select({ tenantId: users.tenantId })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (retry.length > 0) return retry[0].tenantId;
    }
    throw err;
  }
}

/**
 * Връща tenant на текущия потребител (по имейл от сесията) или null.
 *
 * Сигурност:
 * - Анонимна заявка (без сесия) => null (никога не връщаме DEV tenant в production).
 * - Логнат потребител без ред в `users` => автоматично се създава собствен tenant
 *   (provisioning при signup/първи достъп).
 * - Локално без конфигуриран Supabase/DB => DEV tenant (demo режим).
 */
export async function resolveTenantIdOrNull(): Promise<string | null> {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.email) return null;
    return await ensureTenantForUser(sessionUser.email);
  } catch {
    // Supabase/DB не е конфигуриран — само в dev демо режим връщаме DEV tenant
    if (process.env.NODE_ENV !== 'production') return DEV_TENANT_ID;
    return null;
  }
}

/** Изисква логнат потребител; хвърля TenantAuthError (401) при липса на достъп. */
export async function requireTenantId(): Promise<string> {
  const tenantId = await resolveTenantIdOrNull();
  if (!tenantId) throw new TenantAuthError();
  return tenantId;
}

/** Само за вътрешни cron задачи (без потребителска сесия). Таргетът е изричен. */
export async function resolveTenantIdForCron(): Promise<string> {
  return process.env.TENANT_ID?.trim() || DEV_TENANT_ID;
}

/** Backward compatibility: строго поведение (хвърля при липса на достъп). */
export async function resolveTenantId(): Promise<string> {
  return requireTenantId();
}
