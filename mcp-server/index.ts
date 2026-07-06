import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import { hybridRetrieve, formatRetrievedContext } from "../lib/rag/hybrid-search";
import { vectorSearchChunks } from "../lib/rag/vector-search";
import { searchPublicDocuments } from "../lib/knowledge/public-documents-search";
import { isRagEnabled } from "../lib/rag/config";

function loadEnv() {
  const { readFileSync, existsSync } = require("fs");
  for (const p of [".env", ".env.local"]) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const server = new Server(
  { name: "agrinexus-docs-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_documents",
        description:
          "Търси документи от ДФЗ (Държавен фонд Земеделие) и МЗХ (Министерство на земеделието) — " +
          "наредби, закони, схеми за субсидии, процедури. Комбинира семантично (AI) и текстово търсене. " +
          "Връща списък с резултати, сортирани по релевантност.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Търсена фраза — например \"директни плащания 2024\" или \"еко схеми\"",
            },
            limit: {
              type: "number",
              description: "Максимален брой резултати (1-20)",
              default: 10,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_document",
        description:
          "Връща детайлна информация за конкретен документ — заглавие, институция, категория, " +
          "статус, оригинален URL. Използвай source_url или ID от search_documents резултатите.",
        inputSchema: {
          type: "object",
          properties: {
            source_url: {
              type: "string",
              description: "Оригиналният URL на документа (от search_documents резултат)",
            },
            id: {
              type: "string",
              description: "ID на документа (от search_documents резултат, с префикс pub-)",
            },
          },
        },
      },
      {
        name: "list_sources",
        description:
          "Изброява всички налични източници на документи (институции и категории) " +
          "с брой документи за всеки.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "query_rag",
        description:
          "Семантично AI търсене в RAG индекса (knowledge_chunks с embeddings). " +
          "Използва pgvector similarity search. Връща chunks от документи с оценка за сходство.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Търсена фраза",
            },
            limit: {
              type: "number",
              description: "Максимален брой резултати",
              default: 8,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_rag_context",
        description:
          "Връща форматиран RAG контекст (Markdown) за дадена заявка — " +
          "готов за вграждане в system prompt на AI модел. Използва хибридно търсене (векторно + текстово).",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Потребителски въпрос за намиране на релевантни документи",
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_documents": {
        const q = String(args?.query || "").trim();
        if (!q) {
          return { content: [{ type: "text", text: "Липсва задължителния параметър query." }], isError: true };
        }
        const limit = Math.min(Math.max(Number(args?.limit) || 10, 1), 20);

        const results = await hybridRetrieve(q, { finalTopK: limit });

        if (results.length === 0) {
          return { content: [{ type: "text", text: `Няма намерени документи за "${q}".` }] };
        }

        const lines: string[] = [
          `Намерени ${results.length} документа за "${q}":`,
          "",
        ];
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          lines.push(`[${i + 1}] ${r.title}`);
          lines.push(`    Тип: ${r.source_type || "документ"} | Произход: ${r.source_name || "—"}`);
          if (r.category) lines.push(`    Категория: ${r.category}`);
          if (r.effective_date) lines.push(`    В сила от: ${r.effective_date}`);
          if (r.content) lines.push(`    Резюме: ${r.content.slice(0, 200)}${r.content.length > 200 ? "..." : ""}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "get_document": {
        const sourceUrl = String(args?.source_url || "").trim();
        const docId = String(args?.id || "").trim();

        if (!sourceUrl && !docId) {
          return { content: [{ type: "text", text: "Посочете source_url или id." }], isError: true };
        }

        let query = supabase
          .from("public_documents")
          .select("*")
          .eq("status", "active");

        if (sourceUrl) {
          query = query.eq("source_url", sourceUrl);
        } else {
          const uuid = docId.startsWith("pub-") ? docId.slice(4) : docId;
          query = query.eq("id", uuid);
        }

        const { data, error } = await query.maybeSingle();

        if (error || !data) {
          return { content: [{ type: "text", text: "Документът не е намерен." }] };
        }

        const doc = data as Record<string, unknown>;
        const lines: string[] = [
          `Заглавие: ${doc.title}`,
          `Институция: ${doc.institution || "—"}`,
          `Категория: ${doc.category || "—"}`,
          `Тип: ${doc.doc_type || "—"}`,
          `Статус: ${doc.status || "—"}`,
          `Оригинален URL: ${doc.source_url || "—"}`,
          `В сила от: ${doc.effective_date || "—"}`,
          `Последна синхронизация: ${doc.last_synced_at || "—"}`,
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "list_sources": {
        const { data, error } = await supabase
          .from("public_documents")
          .select("institution, category")
          .eq("status", "active");

        if (error) {
          return { content: [{ type: "text", text: `Грешка: ${error.message}` }], isError: true };
        }

        const counts = new Map<string, Map<string, number>>();
        for (const row of data || []) {
          const inst = row.institution || "Други";
          const cat = row.category || "Други";
          if (!counts.has(inst)) counts.set(inst, new Map());
          const cats = counts.get(inst)!;
          cats.set(cat, (cats.get(cat) || 0) + 1);
        }

        const lines: string[] = ["Налични източници:", ""];
        for (const [inst, cats] of counts) {
          const total = Array.from(cats.values()).reduce((s, c) => s + c, 0);
          lines.push(`🏛 ${inst} (${total} документа):`);
          for (const [cat, count] of cats) {
            lines.push(`   📂 ${cat}: ${count}`);
          }
          lines.push("");
        }
        const totalDocs = Array.from(counts.values())
          .reduce((s, cats) => s + Array.from(cats.values()).reduce((s2, c) => s2 + c, 0), 0);
        lines.push(`Общо: ${totalDocs} документа`);

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "query_rag": {
        const q = String(args?.query || "").trim();
        if (!q) {
          return { content: [{ type: "text", text: "Липсва query." }], isError: true };
        }
        const limit = Math.min(Math.max(Number(args?.limit) || 8, 1), 20);

        if (!isRagEnabled()) {
          return { content: [{ type: "text", text: "RAG не е активиран. Настройте OPENAI_API_KEY и RAG_ENABLED=1." }], isError: true };
        }

        const chunks = await vectorSearchChunks(q, { topK: limit });

        if (chunks.length === 0) {
          return { content: [{ type: "text", text: `Няма резултати за "${q}".` }] };
        }

        const lines: string[] = [
          `Резултати от семантично търсене за "${q}":`,
          "",
        ];
        for (let i = 0; i < chunks.length; i++) {
          const c = chunks[i];
          lines.push(`[${i + 1}] ${c.title} (сходство: ${(c.similarity * 100).toFixed(1)}%)`);
          lines.push(`    Източник: ${c.source_type} | ${c.source_name || "—"}`);
          lines.push(`    ${c.content.slice(0, 300)}${c.content.length > 300 ? "..." : ""}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "get_rag_context": {
        const q = String(args?.query || "").trim();
        if (!q) {
          return { content: [{ type: "text", text: "Липсва query." }], isError: true };
        }

        if (!isRagEnabled()) {
          return { content: [{ type: "text", text: "RAG не е активиран." }], isError: true };
        }

        const { context, items, usedVector } = await (
          await import("../lib/rag/hybrid-search")
        ).getRagContext(q);

        if (!context) {
          return { content: [{ type: "text", text: `Няма релевантна информация за "${q}".` }] };
        }

        return {
          content: [
            {
              type: "text",
              text: [
                `Контекст за: "${q}"`,
                `Използвано AI търсене: ${usedVector ? "да" : "не"}`,
                `Брой източници: ${items.length}`,
                "",
                context,
              ].join("\n"),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { content: [{ type: "text", text: `Грешка: ${msg}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AgriNexus MCP server (Документи ДФЗ/МЗХ) стартиран на stdio.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
