// Generic CSV export utility

export function toCsv(data: Record<string, any>[], columns: { key: string; label: string }[]): string {
  const header = columns.map(c => escapeCsv(c.label)).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const val = getNestedValue(row, c.key);
      return escapeCsv(formatValue(val));
    }).join(',')
  );
  return [header, ...rows].join('\r\n');
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv; charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
