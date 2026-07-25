import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createClient } from "@supabase/supabase-js";
import {
  listToolDefinitions,
  handleToolCall,
} from "../../../mcp-server/tool-registry";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

const ALLOW_SESSION_MCP_SERVERS = process.env.ALLOW_SESSION_MCP_SERVERS === "1";

if (!ALLOW_SESSION_MCP_SERVERS) {
  console.warn("[MCP] session-level server injection is DISABLED. Set ALLOW_SESSION_MCP_SERVERS=1 to enable.");
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
      tools: listToolDefinitions(),
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return handleToolCall(name, (args as Record<string, unknown>) || {}, supabase);
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
