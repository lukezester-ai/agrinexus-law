import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { columns, data, filename } = await req.json();

    if (!Array.isArray(columns) || !Array.isArray(data)) {
      return NextResponse.json({ error: 'columns and data required' }, { status: 400 });
    }

    const header = columns.map((c: any) => escapeCsv(c.label)).join(',');
    const rows = data.map((row: any) =>
      columns.map((c: any) => {
        const val = c.key.split('.').reduce((o: any, k: string) => o?.[k], row);
        return escapeCsv(val === null || val === undefined ? '' : String(val));
      }).join(',')
    );
    const csv = '\ufeff' + [header, ...rows].join('\r\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename || 'export.csv'}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
