import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/db';
import { chemicalProducts, chemicalApplications } from '@/lib/db/schema/chemical_diary';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { autoDepositPdfToArchive } from '@/lib/documents/auto-archive';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { db } = getDb();

    const apps = await db.execute(sql`
      SELECT ca.*, cp.name as product_name, cp.active_substance, cp.withdrawal_period_days,
             f.name as field_name
      FROM chemical_applications ca
      LEFT JOIN chemical_products cp ON cp.id = ca.product_id
      LEFT JOIN fields f ON f.id = ca.field_id
      WHERE ca.tenant_id = ${tenantId}
      ORDER BY ca.application_date ASC
    `);

    const rows = (apps as any).rows || [];

    const html = generateHtml(rows);

    // Ticket 3 (P0): Auto-deposit generated report in Documents archive
    try {
      await autoDepositPdfToArchive({
        tenantId,
        name: `Дневник_Химизация_БАБХ_${new Date().toISOString().split('T')[0]}.html`,
        docType: 'report',
        category: 'export',
        linkedModule: 'chemicals',
        fileBufferOrString: html,
        contentType: 'text/html',
        description: `Официален дневник по растителна защита (БАБХ) с ${rows.length} записа`,
        tags: '#химизация #дневник #БХАБ #авто-архив',
      });
    } catch (archiveErr) {
      console.error('Failed to auto archive chemical diary:', archiveErr);
    }

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: any) {
    return new Response(`<h1>Грешка</h1><p>${err.message}</p>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

function generateHtml(rows: any[]): string {
  const productTypes: Record<string, string> = {
    herbicide: 'Хербицид', fungicide: 'Фунгицид', insecticide: 'Инсектицид',
    acaricide: 'Акарицид', growth_regulator: 'Регулатор', fertilizer: 'Тор', other: 'Друг',
  };

  const rowsHtml = rows.map((r: any, i: number) => {
    const date = r.application_date ? new Date(r.application_date).toLocaleDateString('bg-BG') : '—';
    const dose = r.dose_amount ? `${Number(r.dose_amount)} ${r.dose_unit || ''}` : '—';
    const total = r.total_amount ? `${Number(r.total_amount)} ${r.total_unit || ''}` : '—';
    const withdrawal = r.withdrawal_period_days ? `${r.withdrawal_period_days} дни` : '—';

    return `<tr>
      <td>${i + 1}</td>
      <td>${date}</td>
      <td>${esc(r.field_name)}</td>
      <td>${esc(r.crop)}</td>
      <td>${esc(r.product_name)}${r.active_substance ? '<br><span class="sub">' + esc(r.active_substance) + '</span>' : ''}</td>
      <td>${dose}</td>
      <td>${total}</td>
      <td>${withdrawal}</td>
      <td>${esc(r.pest_target)}</td>
      <td>${esc(r.application_method)}</td>
      <td>${esc(r.operator_name)}</td>
      <td>${esc(r.notes)}</td>
    </tr>`;
  }).join('\n      ');

  return `<!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="utf-8">
<title>Дневник на химизацията — БАБХ</title>
<style>
  @page { size: A4 landscape; margin: 12mm 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 8pt; color: #111; padding: 0; }
  h1 { font-size: 14pt; text-align: center; margin-bottom: 2mm; }
  h2 { font-size: 10pt; text-align: center; font-weight: normal; margin-bottom: 4mm; color: #444; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #222; padding: 2mm 1.5mm; text-align: left; vertical-align: top; }
  th { background: #e5e7eb; font-size: 7pt; font-weight: 700; text-align: center; }
  td { font-size: 7.5pt; }
  td:first-child { text-align: center; }
  .sub { font-size: 6.5pt; color: #555; }
  .footer { margin-top: 4mm; font-size: 7pt; color: #666; text-align: center; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    th { background: #e5e7eb !important; }
  }
</style>
</head>
<body>
<h1>ДНЕВНИК НА ХИМИЗАЦИЯТА</h1>
<h2>Протокол за приложени продукти за растителна защита (БАБХ)</h2>
<table>
<thead>
<tr>
  <th style="width:3%">№</th>
  <th style="width:7%">Дата</th>
  <th style="width:11%">Парцел</th>
  <th style="width:8%">Култура</th>
  <th style="width:14%">Продукт<br><span style="font-weight:400">(активно вещество)</span></th>
  <th style="width:7%">Доза</th>
  <th style="width:7%">Общо к-во</th>
  <th style="width:7%">Карант.<br>срок</th>
  <th style="width:10%">Обект</th>
  <th style="width:9%">Метод</th>
  <th style="width:9%">Оператор</th>
  <th style="width:8%">Бележки</th>
</tr>
</thead>
<tbody>
${rowsHtml}
</tbody>
</table>
<div class="footer">Дата на генериране: ${new Date().toLocaleDateString('bg-BG')} • AgriNexus Law</div>
<script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
}

function esc(s: any): string {
  if (!s) return '—';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
