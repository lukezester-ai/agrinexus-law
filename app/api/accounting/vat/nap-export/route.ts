import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/db';
import { vatJournals, tenants } from '@/lib/db/schema';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || String(new Date().getFullYear());
    const month = searchParams.get('month') || String(new Date().getMonth() + 1);

    const { db } = getDb();

    const [tenant] = await db
      .select({ name: tenants.name, bulstat: tenants.bulstat, vatNumber: tenants.vatNumber })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const entries = await db
      .select()
      .from(vatJournals)
      .where(
        and(
          eq(vatJournals.tenantId, tenantId),
          sql`${vatJournals.periodYear} = ${year}`,
          sql`${vatJournals.periodMonth} = ${month}`,
        ),
      )
      .orderBy(sql`${vatJournals.type}, ${vatJournals.entryDate}`);

    const sales = entries.filter((r) => r.type === 'sales');
    const purchases = entries.filter((r) => r.type === 'purchase');

    const salesTotal = sales.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
    const salesVat = sales.reduce((s, r) => s + Number(r.vatAmount || 0), 0);
    const purchaseTotal = purchases.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
    const purchaseVat = purchases.reduce((s, r) => s + Number(r.vatAmount || 0), 0);

    const escXml = (s: any): string => {
      if (!s) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<VATDeclaration xmlns="http://www.nap.bg/vat">
  <Header>
    <Period>${year}-${month.padStart(2, '0')}</Period>
    <Bulstat>${escXml(tenant?.bulstat || '')}</Bulstat>
    <VatNumber>${escXml(tenant?.vatNumber || tenant?.bulstat || '')}</VatNumber>
    <CompanyName>${escXml(tenant?.name || '')}</CompanyName>
    <DeclarationDate>${new Date().toISOString().slice(0, 10)}</DeclarationDate>
  </Header>
  <SalesLedger>
    <TotalCount>${sales.length}</TotalCount>
    <TotalAmount>${salesTotal.toFixed(2)}</TotalAmount>
    <TotalVat>${salesVat.toFixed(2)}</TotalVat>${sales.map((r) => `
    <Entry>
      <InvoiceNumber>${escXml(r.invoiceNumber || '')}</InvoiceNumber>
      <InvoiceDate>${r.invoiceDate ? new Date(r.invoiceDate).toISOString().slice(0, 10) : ''}</InvoiceDate>
      <Counterparty>${escXml(r.counterpartyName || '')}</Counterparty>
      <CounterpartyVat>${escXml(r.counterpartyVat || '')}</CounterpartyVat>
      <NetAmount>${Number(r.netAmount || 0).toFixed(2)}</NetAmount>
      <VatAmount>${Number(r.vatAmount || 0).toFixed(2)}</VatAmount>
      <TotalAmount>${Number(r.totalAmount || 0).toFixed(2)}</TotalAmount>
      <VatRate>${Number(r.vatRate || 0).toFixed(2)}</VatRate>
      <IsIntraCommunity>${r.isIntraCommunity === 'true' ? 'true' : 'false'}</IsIntraCommunity>
    </Entry>`).join('')}
  </SalesLedger>
  <PurchaseLedger>
    <TotalCount>${purchases.length}</TotalCount>
    <TotalAmount>${purchaseTotal.toFixed(2)}</TotalAmount>
    <TotalVat>${purchaseVat.toFixed(2)}</TotalVat>${purchases.map((r) => `
    <Entry>
      <InvoiceNumber>${escXml(r.invoiceNumber || '')}</InvoiceNumber>
      <InvoiceDate>${r.invoiceDate ? new Date(r.invoiceDate).toISOString().slice(0, 10) : ''}</InvoiceDate>
      <Supplier>${escXml(r.counterpartyName || '')}</Supplier>
      <SupplierVat>${escXml(r.counterpartyVat || '')}</SupplierVat>
      <NetAmount>${Number(r.netAmount || 0).toFixed(2)}</NetAmount>
      <VatAmount>${Number(r.vatAmount || 0).toFixed(2)}</VatAmount>
      <TotalAmount>${Number(r.totalAmount || 0).toFixed(2)}</TotalAmount>
      <VatRate>${Number(r.vatRate || 0).toFixed(2)}</VatRate>
    </Entry>`).join('')}
  </PurchaseLedger>
  <Summary>
    <TotalSalesVat>${salesVat.toFixed(2)}</TotalSalesVat>
    <TotalPurchaseVat>${purchaseVat.toFixed(2)}</TotalPurchaseVat>
    <VatPayable>${Math.max(0, salesVat - purchaseVat).toFixed(2)}</VatPayable>
    <VatRefund>${Math.max(0, purchaseVat - salesVat).toFixed(2)}</VatRefund>
  </Summary>
</VATDeclaration>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="dds-${year}-${month.padStart(2, '0')}.xml"`,
      },
    });
  } catch (err: any) {
    const escXml = (s: any) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    return new Response(`<Error>${escXml(err.message)}</Error>`, {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
