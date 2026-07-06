import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createClient } from "@supabase/supabase-js";
import { hybridRetrieve, formatRetrievedContext } from "@/lib/rag/hybrid-search";
import { vectorSearchChunks } from "@/lib/rag/vector-search";
import { isRagEnabled } from "@/lib/rag/config";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

let server: Server | null = null;
let transport: WebStandardStreamableHTTPServerTransport | null = null;
let connecting = false;
let connectQueue: Array<() => void> = [];

async function getOrCreateServer(): Promise<{
  server: Server;
  transport: WebStandardStreamableHTTPServerTransport;
}> {
  if (server && transport) return { server, transport };

  if (connecting) {
    await new Promise<void>((resolve) => connectQueue.push(resolve));
    if (server && transport) return { server, transport };
  }

  connecting = true;

  try {
    server = new Server(
      { name: "agrinexus-docs-mcp", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "search_documents",
          description:
            "Търси документи от ДФЗ и МЗХ — наредби, закони, схеми за субсидии, процедури. Комбинира семантично и текстово търсене.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Търсена фраза" },
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
            "Връща детайлна информация за конкретен документ — заглавие, институция, категория, статус, оригинален URL.",
          inputSchema: {
            type: "object",
            properties: {
              source_url: {
                type: "string",
                description: "Оригиналният URL на документа",
              },
              id: {
                type: "string",
                description:
                  "ID на документа (с префикс pub-)",
              },
            },
          },
        },
        {
          name: "list_sources",
          description:
            "Изброява всички налични източници на документи (институции и категории) с брой документи.",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "query_rag",
          description:
            "Семантично AI търсене в RAG индекса (knowledge_chunks с embeddings).",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Търсена фраза" },
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
            "Връща форматиран RAG контекст (Markdown) за дадена заявка — готов за вграждане в system prompt.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Потребителски въпрос",
              },
            },
            required: ["query"],
          },
        },
      ],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "search_documents": {
          const q = String(args?.query || "").trim();
          if (!q)
            return {
              content: [{ type: "text", text: "Липсва query." }],
              isError: true,
            };
          const limit = Math.min(Math.max(Number(args?.limit) || 10, 1), 20);
          const results = await hybridRetrieve(q, { finalTopK: limit });
          if (!results.length)
            return {
              content: [{ type: "text", text: `Няма резултати за "${q}".` }],
            };
          const lines = [`Намерени ${results.length} документа:`, ""];
          for (let i = 0; i < results.length; i++) {
            const r = results[i];
            lines.push(
              `[${i + 1}] ${r.title}`,
              `    Тип: ${r.source_type || "документ"} | ${r.source_name || "—"}`,
            );
            if (r.category) lines.push(`    Категория: ${r.category}`);
            if (r.effective_date)
              lines.push(`    В сила от: ${r.effective_date}`);
            if (r.content)
              lines.push(
                `    ${r.content.slice(0, 200)}${r.content.length > 200 ? "..." : ""}`,
              );
            lines.push("");
          }
          return { content: [{ type: "text", text: lines.join("\n") }] };
        }

        case "get_document": {
          const sourceUrl = String(args?.source_url || "").trim();
          const docId = String(args?.id || "").trim();
          if (!sourceUrl && !docId)
            return {
              content: [{ type: "text", text: "Посочете source_url или id." }],
              isError: true,
            };
          if (!supabase)
            return {
              content: [{ type: "text", text: "Няма връзка с базата." }],
              isError: true,
            };
          let q = supabase
            .from("public_documents")
            .select("*")
            .eq("status", "active");
          if (sourceUrl) q = q.eq("source_url", sourceUrl);
          else q = q.eq("id", docId.startsWith("pub-") ? docId.slice(4) : docId);
          const { data } = await q.maybeSingle();
          if (!data)
            return {
              content: [{ type: "text", text: "Документът не е намерен." }],
            };
          const d = data as Record<string, unknown>;
          return {
            content: [
              {
                type: "text",
                text: [
                  `Заглавие: ${d.title}`,
                  `Институция: ${d.institution || "—"}`,
                  `Категория: ${d.category || "—"}`,
                  `Тип: ${d.doc_type || "—"}`,
                  `Статус: ${d.status || "—"}`,
                  `URL: ${d.source_url || "—"}`,
                  `В сила от: ${d.effective_date || "—"}`,
                ].join("\n"),
              },
            ],
          };
        }

        case "list_sources": {
          if (!supabase)
            return {
              content: [{ type: "text", text: "Няма връзка с базата." }],
              isError: true,
            };
          const { data, error } = (await supabase
            .from("public_documents")
            .select("institution, category")
            .eq("status", "active")) as unknown as {
            data: Array<{ institution: string | null; category: string | null }> | null;
            error: { message: string } | null;
          };
          if (error)
            return {
              content: [{ type: "text", text: `Грешка: ${error.message}` }],
              isError: true,
            };
          const counts = new Map<string, Map<string, number>>();
          for (const row of data || []) {
            const inst = row.institution || "Други";
            const cat = row.category || "Други";
            if (!counts.has(inst)) counts.set(inst, new Map());
            const cats = counts.get(inst)!;
            cats.set(cat, (cats.get(cat) || 0) + 1);
          }
          const lines = ["Налични източници:", ""];
          let totalDocs = 0;
          for (const [inst, cats] of counts) {
            const total = Array.from(cats.values()).reduce((s, c) => s + c, 0);
            totalDocs += total;
            lines.push(`  ${inst} (${total} документа):`);
            for (const [cat, count] of cats)
              lines.push(`      ${cat}: ${count}`);
            lines.push("");
          }
          lines.push(`Общо: ${totalDocs} документа`);
          return { content: [{ type: "text", text: lines.join("\n") }] };
        }

        case "query_rag": {
          const q = String(args?.query || "").trim();
          if (!q)
            return {
              content: [{ type: "text", text: "Липсва query." }],
              isError: true,
            };
          const limit = Math.min(Math.max(Number(args?.limit) || 8, 1), 20);
          if (!isRagEnabled())
            return {
              content: [{ type: "text", text: "RAG не е активиран." }],
              isError: true,
            };
          const chunks = await vectorSearchChunks(q, { topK: limit });
          if (!chunks.length)
            return {
              content: [
                { type: "text", text: `Няма резултати за "${q}".` },
              ],
            };
          const lines = [`Резултати за "${q}":`, ""];
          for (let i = 0; i < chunks.length; i++) {
            const c = chunks[i];
            lines.push(
              `[${i + 1}] ${c.title} (${(c.similarity * 100).toFixed(1)}%)`,
              `    ${c.source_type} | ${c.source_name || "—"}`,
              `    ${c.content.slice(0, 300)}${c.content.length > 300 ? "..." : ""}`,
              "",
            );
          }
          return { content: [{ type: "text", text: lines.join("\n") }] };
        }

        case "get_rag_context": {
          const q = String(args?.query || "").trim();
          if (!q)
            return {
              content: [{ type: "text", text: "Липсва query." }],
              isError: true,
            };
          if (!isRagEnabled())
            return {
              content: [{ type: "text", text: "RAG не е активиран." }],
              isError: true,
            };
          const { context, items, usedVector } = await (
            await import("@/lib/rag/hybrid-search")
          ).getRagContext(q);
          if (!context)
            return {
              content: [
                {
                  type: "text",
                  text: `Няма информация за "${q}".`,
                },
              ],
            };
          return {
            content: [
              {
                type: "text",
                text: [
                  `Контекст за: "${q}"`,
                  `AI търсене: ${usedVector ? "да" : "не"}`,
                  `Източници: ${items.length}`,
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
    });

    transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
    });

    await server.connect(transport);

    return { server, transport };
  } finally {
    connecting = false;
    const queue = connectQueue;
    connectQueue = [];
    queue.forEach((resolve) => resolve());
  }
}

export async function GET(req: Request) {
  const { transport: t } = await getOrCreateServer();
  return t.handleRequest(req);
}

export async function POST(req: Request) {
  const { transport: t } = await getOrCreateServer();
  return t.handleRequest(req);
}

export async function DELETE(req: Request) {
  const { transport: t } = await getOrCreateServer();
  return t.handleRequest(req);
}
