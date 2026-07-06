import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getDb } from '@/lib/db/db';
import { journalHeaders, journalLines } from '@/lib/db/schema/journal_entries';
import { accountPlan } from '@/lib/db/schema/account_plan';
import { invoices, purchaseInvoices } from '@/lib/db/schema/invoices';
import { vatJournals } from '@/lib/db/schema/vat_journals';
import { machines, machineServices } from '@/lib/db/schema/machines';
import { harvestRecords } from '@/lib/db/schema/harvest';
import { cropRotationPlans } from '@/lib/db/schema/crop_rotation';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_trial_balance',
      description: 'Врща оборотна ведомост — дебит, кредит и салдо за всяка сметка.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_journal_entries',
      description: 'Връща последните счетоводни записи (журнал). Може да филтрира по дати.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Брой записи (по подразбиране 20)' },
          fromDate: { type: 'string', description: 'Начална дата (YYYY-MM-DD)' },
          toDate: { type: 'string', description: 'Крайна дата (YYYY-MM-DD)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_invoices',
      description: 'Връща фактури (продажби или покупки).',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['sales', 'purchase'], description: 'Тип фактури' },
          limit: { type: 'number', description: 'Брой (по подразбиране 20)' },
          status: { type: 'string', description: 'Статус: draft, issued, paid' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_vat_summary',
      description: 'Връща обобщение на ДДС за даден месец/година.',
      parameters: {
        type: 'object',
        properties: {
          year: { type: 'number', description: 'Година' },
          month: { type: 'number', description: 'Месец (1-12)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pnl',
      description: 'Връща отчет за приходите и разходите за период.',
      parameters: {
        type: 'object',
        properties: {
          fromDate: { type: 'string', description: 'Начална дата (YYYY-MM-DD)' },
          toDate: { type: 'string', description: 'Крайна дата (YYYY-MM-DD)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_balance_sheet',
      description: 'Връща баланс (активи, пасиви, капитал).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_machines',
      description: 'Връща списък на машините, техния статус, моточасове и брой сервизи.',
      parameters: { type: 'object', properties: { status: { type: 'string', description: 'Филтър по статус: active, repair, retired' } }, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_harvest_records',
      description: 'Връща записи за реколта — добиви, площи, влажност.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Брой записи (по подразбиране 20)' },
          fromDate: { type: 'string', description: 'Начална дата (YYYY-MM-DD)' },
          toDate: { type: 'string', description: 'Крайна дата (YYYY-MM-DD)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_crop_rotation',
      description: 'Връща планове за сеитбооборот — култури, предшественици и съвместимост.',
      parameters: { type: 'object', properties: { year: { type: 'string', description: 'Филтър по година' } }, required: [] },
    },
  },
];

async function execTool(name: string, args: any, tenantId: string): Promise<string> {
  const { db } = getDb();

  switch (name) {
    case 'get_trial_balance': {
      const rows = await db
        .select({
          accountNumber: accountPlan.accountNumber,
          accountName: accountPlan.name,
          accountType: accountPlan.type,
          debit: sql`COALESCE(SUM(CASE WHEN ${journalLines.entryType} = 'debit' THEN ${journalLines.amount}::numeric ELSE 0 END), 0)`,
          credit: sql`COALESCE(SUM(CASE WHEN ${journalLines.entryType} = 'credit' THEN ${journalLines.amount}::numeric ELSE 0 END), 0)`,
        })
        .from(accountPlan)
        .leftJoin(journalLines, eq(journalLines.accountId, accountPlan.id))
        .leftJoin(journalHeaders, and(eq(journalHeaders.id, journalLines.journalId), eq(journalHeaders.tenantId, tenantId), eq(journalHeaders.status, 'posted')))
        .where(eq(accountPlan.tenantId, tenantId))
        .groupBy(accountPlan.accountNumber, accountPlan.name, accountPlan.type, accountPlan.id)
        .orderBy(accountPlan.accountNumber);
      return JSON.stringify(rows);
    }

    case 'get_journal_entries': {
      const conditions: any[] = [eq(journalHeaders.tenantId, tenantId)];
      if (args.fromDate) conditions.push(gte(journalHeaders.entryDate, new Date(args.fromDate)));
      if (args.toDate) conditions.push(lte(journalHeaders.entryDate, new Date(args.toDate)));
      const rows = await db
        .select()
        .from(journalHeaders)
        .where(and(...conditions))
        .orderBy(desc(journalHeaders.entryDate))
        .limit(args.limit || 20);
      return JSON.stringify(rows);
    }

    case 'get_invoices': {
      const tbl = args.type === 'purchase' ? purchaseInvoices : invoices;
      const conditions: any[] = [eq(tbl.tenantId, tenantId)];
      if (args.status) conditions.push(eq(tbl.status, args.status));
      const rows = await db
        .select()
        .from(tbl)
        .where(and(...conditions))
        .orderBy(desc(tbl.issueDate))
        .limit(args.limit || 20);
      return JSON.stringify(rows);
    }

    case 'get_vat_summary': {
      const year = args.year || new Date().getFullYear();
      const month = args.month || new Date().getMonth() + 1;
      const sales = await db
        .select({ totalVat: sql`COALESCE(SUM(${vatJournals.vatAmount}::numeric), 0)`, totalNet: sql`COALESCE(SUM(${vatJournals.netAmount}::numeric), 0)` })
        .from(vatJournals)
        .where(and(eq(vatJournals.tenantId, tenantId), eq(vatJournals.type, 'sales'), eq(vatJournals.periodYear, String(year)), eq(vatJournals.periodMonth, String(month))));
      const purchases = await db
        .select({ totalVat: sql`COALESCE(SUM(${vatJournals.vatAmount}::numeric), 0)`, totalNet: sql`COALESCE(SUM(${vatJournals.netAmount}::numeric), 0)` })
        .from(vatJournals)
        .where(and(eq(vatJournals.tenantId, tenantId), eq(vatJournals.type, 'purchase'), eq(vatJournals.periodYear, String(year)), eq(vatJournals.periodMonth, String(month))));
      return JSON.stringify({ year, month, sales: sales[0], purchases: purchases[0] });
    }

    case 'get_pnl': {
      const rows = await db
        .select({
          accountNumber: accountPlan.accountNumber,
          accountName: accountPlan.name,
          accountType: accountPlan.type,
          balance: sql`COALESCE(SUM(CASE WHEN ${journalLines.entryType} = 'debit' THEN ${journalLines.amount}::numeric ELSE -${journalLines.amount}::numeric END), 0)`,
        })
        .from(accountPlan)
        .leftJoin(journalLines, eq(journalLines.accountId, accountPlan.id))
        .leftJoin(journalHeaders, and(eq(journalHeaders.id, journalLines.journalId), eq(journalHeaders.tenantId, tenantId), eq(journalHeaders.status, 'posted')))
        .where(and(eq(accountPlan.tenantId, tenantId), sql`${accountPlan.type} IN ('income', 'expense')`))
        .groupBy(accountPlan.accountNumber, accountPlan.name, accountPlan.type, accountPlan.id)
        .orderBy(accountPlan.accountNumber);
      return JSON.stringify(rows);
    }

    case 'get_balance_sheet': {
      const rows = await db
        .select({
          accountNumber: accountPlan.accountNumber,
          accountName: accountPlan.name,
          accountType: accountPlan.type,
          balance: sql`COALESCE(SUM(CASE WHEN ${journalLines.entryType} = 'debit' THEN ${journalLines.amount}::numeric ELSE -${journalLines.amount}::numeric END), 0)`,
        })
        .from(accountPlan)
        .leftJoin(journalLines, eq(journalLines.accountId, accountPlan.id))
        .leftJoin(journalHeaders, and(eq(journalHeaders.id, journalLines.journalId), eq(journalHeaders.tenantId, tenantId), eq(journalHeaders.status, 'posted')))
        .where(and(eq(accountPlan.tenantId, tenantId), sql`${accountPlan.type} IN ('asset', 'liability', 'equity')`))
        .groupBy(accountPlan.accountNumber, accountPlan.name, accountPlan.type, accountPlan.id)
        .orderBy(accountPlan.accountNumber);
      return JSON.stringify(rows);
    }

    case 'get_machines': {
      const conditions: any[] = [eq(machines.tenantId, tenantId)];
      if (args.status) conditions.push(eq(machines.status, args.status));
      const rows = await db.select().from(machines).where(and(...conditions)).orderBy(machines.name);
      for (const m of rows) {
        const svc = await db.select({ count: sql`COUNT(*)` }).from(machineServices).where(eq(machineServices.machineId, m.id));
        (m as any).serviceCount = Number((svc[0] as any).count);
      }
      return JSON.stringify(rows.map((m: any) => ({ ...m, engineHours: Number(m.engineHours) })));
    }

    case 'get_harvest_records': {
      const conditions: any[] = [eq(harvestRecords.tenantId, tenantId)];
      if (args.fromDate) conditions.push(gte(harvestRecords.date, new Date(args.fromDate)));
      if (args.toDate) conditions.push(lte(harvestRecords.date, new Date(args.toDate)));
      const rows = await db.select().from(harvestRecords).where(and(...conditions)).orderBy(desc(harvestRecords.date)).limit(args.limit || 20);
      return JSON.stringify(rows.map((r: any) => ({ ...r, areaDecares: Number(r.areaDecares), yieldAmount: Number(r.yieldAmount), moisture: r.moisture ? Number(r.moisture) : null })));
    }

    case 'get_crop_rotation': {
      const conditions: any[] = [eq(cropRotationPlans.tenantId, tenantId)];
      if (args.year) conditions.push(eq(cropRotationPlans.year, Number(args.year)));
      const rows = await db.select().from(cropRotationPlans).where(and(...conditions)).orderBy(desc(cropRotationPlans.year));
      return JSON.stringify(rows);
    }

    default:
      return JSON.stringify({ error: 'Unknown tool' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { message, history } = await req.json();

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Ти си асистент на AgriNexus за земеделско стопанство. Отговаряш на български език.

Можеш да изпълняваш заявки към базата данни, за да отговаряш на въпроси относно:
- Счетоводен журнал и оборотна ведомост
- Фактури (продажби и покупки)
- ДДС дневници
- Баланс и отчет за приходи/разходи
- Машини и техника (статус, моточасове, сервизи)
- Реколта и добиви (площи, влажност, качество)
- Сеитбооборот (планове, съвместимост на култури)

Когато получиш резултат от базата, представи го в четивен формат на български.
Използвай подходящите инструменти според въпроса на потребителя.`,
      },
      ...(history || []),
      { role: 'user', content: message },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
      max_tokens: 2000,
    });

    const choice = response.choices[0];
    const finishReason = choice.finish_reason;

    if (finishReason === 'tool_calls' && choice.message.tool_calls) {
      const toolResults = await Promise.all(
        choice.message.tool_calls.map(async (tc: any) => {
          const args = JSON.parse(tc.function.arguments);
          const result = await execTool(tc.function.name, args, tenantId);
          return { role: 'tool' as const, tool_call_id: tc.id, content: result };
        }),
      );

      const followUp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [...messages, choice.message, ...toolResults],
        max_tokens: 2000,
      });

      return NextResponse.json({ reply: followUp.choices[0].message.content, toolCalls: choice.message.tool_calls.map((tc: any) => tc.function.name) });
    }

    return NextResponse.json({ reply: choice.message.content, toolCalls: [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
