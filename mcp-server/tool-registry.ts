import type { createClient } from "@supabase/supabase-js";
import { hybridRetrieve, formatRetrievedContext, getRagContext } from "../lib/rag/hybrid-search";
import { vectorSearchChunks } from "../lib/rag/vector-search";
import { isRagEnabled } from "../lib/rag/config";

type SupabaseClient = ReturnType<typeof createClient>;

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiredEnvVars: string[];
  handler: (args: Record<string, unknown>, supabase: SupabaseClient | null) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
};

function validateRequired(args: Record<string, unknown>, required: string[]): string | null {
  for (const key of required) {
    const val = String(args[key] || "").trim();
    if (!val) return `Липсва задължителния параметър ${key}.`;
  }
  return null;
}

function response(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], isError };
}

const toolRegistry = new Map<string, ToolDefinition>();

function register(def: ToolDefinition) {
  toolRegistry.set(def.name, def);
}

export function listToolDefinitions(): Array<Omit<ToolDefinition, "handler" | "requiredEnvVars">> {
  return [...toolRegistry.values()].map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  }));
}

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return toolRegistry.get(name);
}

export function getAvailableTools(supabase: SupabaseClient | null): Array<Omit<ToolDefinition, "handler">> {
  return [...toolRegistry.values()]
    .filter((t) => t.requiredEnvVars.every((v) => process.env[v]))
    .map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      requiredEnvVars: t.requiredEnvVars,
    }));
}

const TOOL_TIMEOUT_MS = 30_000;

export type FailureMode = 'unknown_tool' | 'missing_env' | 'missing_param' | 'timeout' | 'execution_error' | 'invalid_config';

export const FAILURE_TABLE: Record<FailureMode, { cause: string; behavior: string }> = {
  unknown_tool:   { cause: 'tool name not in registry',          behavior: 'return error with available tool list' },
  missing_env:    { cause: 'required env var not set',           behavior: 'return error listing which vars are missing' },
  missing_param:  { cause: 'handler required field is empty',    behavior: 'return error with field name' },
  timeout:        { cause: 'handler execution exceeds 30s',      behavior: 'return timeout error, log warning' },
  execution_error:{ cause: 'handler throws unexpectedly',        behavior: 'return error with message, log stack' },
  invalid_config: { cause: 'malformed tool definition',          behavior: 'skip tool at registration, log error' },
};

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient | null,
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  const def = toolRegistry.get(name);
  if (!def) {
    return response(`Неизвестен инструмент: "${name}".`, true);
  }
  const missing = def.requiredEnvVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    return response(`Изискват се конфигурирани: ${missing.join(", ")}.`, true);
  }
  try {
    const result = await Promise.race([
      def.handler(args, supabase),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: "${name}" не завърши за ${TOOL_TIMEOUT_MS / 1000}s.`)), TOOL_TIMEOUT_MS)
      ),
    ]);
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return response(`Гречка при "${name}": ${msg}`, true);
  }
}

// ─── Existing tools (with agrinexus_ prefix) ───────────────────────────

register({
  name: "agrinexus_search_documents",
  description:
    "Търси документи от ДФЗ (Държавен фонд Земеделие) и МЗХ (Министерство на земеделието) — " +
    "наредби, закони, схеми за субсидии, процедури. Комбинира семантично (AI) и текстово търсене. " +
    "Връща списък с резултати, сортирани по релевантност.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Търсена фраза — например \"директни плащания 2024\" или \"еко схеми\"" },
      limit: { type: "number", description: "Максимален брой резултати (1-20)", default: 10 },
    },
    required: ["query"],
  },
  requiredEnvVars: [],
  handler: async (args) => {
    const q = String(args.query || "").trim();
    const err = validateRequired(args, ["query"]);
    if (err) return response(err, true);
    const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 20);
    const results = await hybridRetrieve(q, { finalTopK: limit });
    if (results.length === 0) return response(`Няма намерени документи за "${q}".`);
    const lines: string[] = [`Намерени ${results.length} документа за "${q}":`, ""];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      lines.push(`[${i + 1}] ${r.title}`);
      lines.push(`    Тип: ${r.source_type || "документ"} | Произход: ${r.source_name || "—"}`);
      if (r.category) lines.push(`    Категория: ${r.category}`);
      if (r.effective_date) lines.push(`    В сила от: ${r.effective_date}`);
      if (r.content) lines.push(`    Резюме: ${r.content.slice(0, 200)}${r.content.length > 200 ? "..." : ""}`);
      lines.push("");
    }
    return response(lines.join("\n"));
  },
});

register({
  name: "agrinexus_get_document",
  description:
    "Връща детайлна информация за конкретен документ — заглавие, институция, категория, " +
    "статус, оригинален URL. Използвай source_url или ID от search_documents резултатите.",
  inputSchema: {
    type: "object",
    properties: {
      source_url: { type: "string", description: "Оригиналният URL на документа (от search_documents резултат)" },
      id: { type: "string", description: "ID на документа (от search_documents резултат, с префикс pub-)" },
    },
  },
  requiredEnvVars: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  handler: async (args, supabase) => {
    const sourceUrl = String(args.source_url || "").trim();
    const docId = String(args.id || "").trim();
    if (!sourceUrl && !docId) return response("Посочете source_url или id.", true);
    if (!supabase) return response("Няма връзка с базата данни.", true);
    let query = supabase.from("public_documents").select("*").eq("status", "active");
    if (sourceUrl) query = query.eq("source_url", sourceUrl);
    else query = query.eq("id", docId.startsWith("pub-") ? docId.slice(4) : docId);
    const { data, error } = await query.maybeSingle();
    if (error || !data) return response("Документът не е намерен.");
    const d = data as Record<string, unknown>;
    return response([
      `Заглавие: ${d.title}`,
      `Институция: ${d.institution || "—"}`,
      `Категория: ${d.category || "—"}`,
      `Тип: ${d.doc_type || "—"}`,
      `Статус: ${d.status || "—"}`,
      `Оригинален URL: ${d.source_url || "—"}`,
      `В сила от: ${d.effective_date || "—"}`,
      `Последна синхронизация: ${d.last_synced_at || "—"}`,
    ].join("\n"));
  },
});

register({
  name: "agrinexus_list_sources",
  description:
    "Изброява всички налични източници на документи (институции и категории) " +
    "с брой документи за всеки.",
  inputSchema: { type: "object", properties: {} },
  requiredEnvVars: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  handler: async (_args, supabase) => {
    if (!supabase) return response("Няма връзка с базата данни.", true);
    const { data, error } = await supabase
      .from("public_documents")
      .select("institution, category")
      .eq("status", "active");
    if (error) return response(`Грешка: ${error.message}`, true);
    const rows = (data || []) as Array<{ institution: string | null; category: string | null }>;
    const counts = new Map<string, Map<string, number>>();
    for (const row of rows) {
      const inst = row.institution || "Други";
      const cat = row.category || "Други";
      if (!counts.has(inst)) counts.set(inst, new Map());
      const cats = counts.get(inst)!;
      cats.set(cat, (cats.get(cat) || 0) + 1);
    }
    const lines: string[] = ["Налични източници:", ""];
    let totalDocs = 0;
    for (const [inst, cats] of counts) {
      const total = Array.from(cats.values()).reduce((s, c) => s + c, 0);
      totalDocs += total;
      lines.push(`  ${inst} (${total} документа):`);
      for (const [cat, count] of cats) lines.push(`      ${cat}: ${count}`);
      lines.push("");
    }
    lines.push(`Общо: ${totalDocs} документа`);
    return response(lines.join("\n"));
  },
});

register({
  name: "agrinexus_query_rag",
  description:
    "Семантично AI търсене в RAG индекса (knowledge_chunks с embeddings). " +
    "Използва pgvector similarity search. Връща chunks от документи с оценка за сходство.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Търсена фраза" },
      limit: { type: "number", description: "Максимален брой резултати", default: 8 },
    },
    required: ["query"],
  },
  requiredEnvVars: ["OPENAI_API_KEY"],
  handler: async (args) => {
    const q = String(args.query || "").trim();
    const err = validateRequired(args, ["query"]);
    if (err) return response(err, true);
    const limit = Math.min(Math.max(Number(args.limit) || 8, 1), 20);
    if (!isRagEnabled()) return response("RAG не е активиран. Настройте OPENAI_API_KEY и RAG_ENABLED=1.", true);
    const chunks = await vectorSearchChunks(q, { topK: limit });
    if (chunks.length === 0) return response(`Няма резултати за "${q}".`);
    const lines: string[] = [`Резултати от семантично търсене за "${q}":`, ""];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      lines.push(`[${i + 1}] ${c.title} (сходство: ${(c.similarity * 100).toFixed(1)}%)`);
      lines.push(`    Източник: ${c.source_type} | ${c.source_name || "—"}`);
      lines.push(`    ${c.content.slice(0, 300)}${c.content.length > 300 ? "..." : ""}`);
      lines.push("");
    }
    return response(lines.join("\n"));
  },
});

register({
  name: "agrinexus_get_rag_context",
  description:
    "Връща форматиран RAG контекст (Markdown) за дадена заявка — " +
    "готов за вграждане в system prompt на AI модел. Използва хибридно търсене (векторно + текстово).",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Потребителски въпрос за намиране на релевантни документи" },
    },
    required: ["query"],
  },
  requiredEnvVars: ["OPENAI_API_KEY"],
  handler: async (args) => {
    const q = String(args.query || "").trim();
    const err = validateRequired(args, ["query"]);
    if (err) return response(err, true);
    if (!isRagEnabled()) return response("RAG не е активиран.", true);
    const result = await getRagContext(q);
    if (!result.context) return response(`Няма релевантна информация за "${q}".`);
    return response([
      `Контекст за: "${q}"`,
      `Използвано AI търсене: ${result.usedVector ? "да" : "не"}`,
      `Брой източници: ${result.items.length}`,
      "",
      result.context,
    ].join("\n"));
  },
});

// ─── Meta-tools: Documentation-as-tool (Pattern 5) ─────────────────────

const SKILL_DOMAINS = [
  {
    id: "dfz-regulations",
    title: "ДФЗ наредби и схеми",
    description: "Наредби на Държавен фонд Земеделие за директни плащания, еко схеми, обвързана подкрепа, млади фермери",
    tools: ["agrinexus_search_documents", "agrinexus_get_document"],
  },
  {
    id: "mzh-regulations",
    title: "МЗХ закони и процедури",
    description: "Министерство на земеделието — закони за земеделските земи, биопроизводство, пазарни механизми",
    tools: ["agrinexus_search_documents", "agrinexus_get_document"],
  },
  {
    id: "subsidies-2024",
    title: "Субсидии 2024-2025",
    description: "Схеми за директни плащания, преходна национална помощ, ПРСР 2023-2027",
    tools: ["agrinexus_search_documents", "agrinexus_query_rag"],
  },
  {
    id: "eu-regulations",
    title: "Европейски регламенти",
    description: "Европейско законодателство в областта на селското стопанство (Common Agricultural Policy)",
    tools: ["agrinexus_search_documents", "agrinexus_get_rag_context"],
  },
  {
    id: "rag-knowledge-base",
    title: "RAG база знания",
    description: "Семантичен индекс с вградени знания от всички източници, достъпен чрез векторно търсене",
    tools: ["agrinexus_query_rag", "agrinexus_get_rag_context"],
  },
];

register({
  name: "agrinexus_list_skills",
  description:
    "Изброява всички налични знания (skills) в системата — всяко skill покрива определена тема " +
    "(ДФЗ наредби, МЗХ закони, субсидии, европейски регламенти, RAG база). " +
    "Използвай този инструмент, за да разбереш какво може да намери системата.",
  inputSchema: { type: "object", properties: {} },
  requiredEnvVars: [],
  handler: async () => {
    const lines: string[] = [
      "Налични знания (AgriNexus.Law):",
      "",
    ];
    for (const skill of SKILL_DOMAINS) {
      lines.push(`📚 ${skill.title}`);
      lines.push(`   ${skill.description}`);
      lines.push(`   Инструменти: ${skill.tools.join(", ")}`);
      lines.push("");
    }
    lines.push(`Общо: ${SKILL_DOMAINS.length} знания`);
    return response(lines.join("\n"));
  },
});

register({
  name: "agrinexus_load_skill",
  description:
    "Зарежда детайлна информация за конкретно знание (skill) — включително препоръчителни заявки " +
    "и свързани инструменти. Използвай id от list_skills резултатите.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID на skill-а (от list_skills резултат) — например dfz-regulations, mzh-regulations, subsidies-2024, eu-regulations, rag-knowledge-base",
      },
    },
    required: ["id"],
  },
  requiredEnvVars: [],
  handler: async (args) => {
    const id = String(args.id || "").trim();
    const err = validateRequired(args, ["id"]);
    if (err) return response(err, true);
    const skill = SKILL_DOMAINS.find((s) => s.id === id);
    if (!skill) {
      const available = SKILL_DOMAINS.map((s) => `"${s.id}"`).join(", ");
      return response(`Неизвестно знание: "${id}". Налични: ${available}`, true);
    }
    return response([
      `📚 ${skill.title}`,
      `   ID: ${skill.id}`,
      `   ${skill.description}`,
      ``,
      `Препоръчителни заявки:`,
      ...(skill.id === "dfz-regulations"
        ? [`   - "директни плащания 2024"`, `   - "еко схеми ДФЗ"`, `   - "обвързана подкрепа"`]
        : skill.id === "mzh-regulations"
        ? [`   - "закон за земеделските земи"`, `   - "биопроизводство наредба"`]
        : skill.id === "subsidies-2024"
        ? [`   - "ПРСР 2023-2027"`, `   - "преходна национална помощ"`]
        : skill.id === "eu-regulations"
        ? [`   - "CAP 2023-2027"`, `   - "европейски регламент"`]
        : [`   - "въглеродно земеделие"`, `   - "дигитализация в земеделието"`]),
      ``,
      `Свързани инструменти: ${skill.tools.join(", ")}`,
    ].join("\n"));
  },
});
