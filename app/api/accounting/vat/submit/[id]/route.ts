import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { invoices, tenants } from "@/lib/db/schema";
import { resolveTenantId } from "@/lib/db/tenant-context";
import { NapSoapClient } from "@/lib/accounting/nap-client";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();
    const napUuid = params.id;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const napSettings = (tenant as any).nap_settings
      ? typeof (tenant as any).nap_settings === "string"
        ? JSON.parse((tenant as any).nap_settings)
        : (tenant as any).nap_settings
      : {};

    const napClient = new NapSoapClient({
      environment: (napSettings.environment as "test" | "production") || "test",
      username: (tenant as any).nap_username || napSettings.username,
      password: napSettings.password,
    });

    const result = await napClient.getInvoiceStatus(napUuid);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
