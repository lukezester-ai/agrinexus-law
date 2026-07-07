import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { invoices, tenants } from "@/lib/db/schema";
import { resolveTenantId } from "@/lib/db/tenant-context";
import {
  NapSoapClient,
  buildNapInvoiceFromDbRecord,
} from "@/lib/accounting/nap-client";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId parameter is required" }, { status: 400 });
    }

    const { db } = getDb();

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const isPurchase = searchParams.get("type") === "purchase";
    const table = isPurchase ? (await import("@/lib/db/schema/invoices")).purchaseInvoices : invoices;

    const [invoice] = await db
      .select()
      .from(table)
      .where(eq(table.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
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

    const napInvoice = buildNapInvoiceFromDbRecord(invoice as any);
    const result = await napClient.submitInvoice(napInvoice);

    if (result.success) {
      await db
        .update(table)
        .set({
          napUuid: result.napUuid || null,
          napStatus: result.napStatus || "submitted",
          napSubmittedAt: new Date(),
          napResponse: result.rawResponse ? { raw: result.rawResponse } : null,
          napError: null,
        } as any)
        .where(eq(table.id, invoiceId));
    } else {
      await db
        .update(table)
        .set({
          napStatus: "error",
          napError: result.error || null,
          napResponse: result.rawResponse ? { raw: result.rawResponse } : null,
        } as any)
        .where(eq(table.id, invoiceId));
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
