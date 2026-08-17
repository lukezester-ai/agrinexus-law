import { NextResponse } from 'next/server';
import { TenantAuthError } from '@/lib/db/tenant-context';

export function handleApiError(err: any, fallbackStatus = 500): NextResponse {
  if (err instanceof TenantAuthError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: fallbackStatus });
}
