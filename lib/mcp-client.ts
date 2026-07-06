import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ChildProcess } from "child_process";
import { spawn } from "child_process";
import path from "path";

let client: Client | null = null;
let transport: StdioClientTransport | null = null;
let serverProcess: ChildProcess | null = null;

function isVercel(): boolean {
  return !!process.env.VERCEL || !!process.env.NEXT_PUBLIC_VERCEL_ENV;
}

function getServerPath(): string {
  return path.resolve(process.cwd(), "mcp-server/index.ts");
}

export async function connectMcpClient(): Promise<Client> {
  if (client) return client;

  if (isVercel()) {
    throw new Error("MCP client не работи в среда Vercel (няма child_process)");
  }

  serverProcess = spawn("npx", ["tsx", getServerPath()], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });

  serverProcess.stderr?.on("data", (data: Buffer) => {
    console.error("[MCP-server]", data.toString().trim());
  });

  serverProcess.on("exit", (code) => {
    console.error(`[MCP-server] процесът спря с код ${code}`);
    client = null;
    transport = null;
  });

  transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", getServerPath()],
  });

  client = new Client(
    { name: "agrinexus-chat-mcp-client", version: "1.0.0" },
    { capabilities: {} },
  );

  await client.connect(transport);
  return client;
}

export async function disconnectMcpClient(): Promise<void> {
  if (transport) {
    try { await transport.close(); } catch { /* ignore */ }
    transport = null;
  }
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  client = null;
}

export async function callMcpTool(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<string> {
  const mcpClient = await connectMcpClient();
  const result = await mcpClient.callTool({
    name: toolName,
    arguments: args,
  });

  if (result.content && Array.isArray(result.content)) {
    return result.content
      .filter((c: { type: string; text?: string }) => c.type === "text")
      .map((c: { type: string; text?: string }) => c.text || "")
      .join("\n");
  }
  return "";
}

export async function getMcpRagContext(query: string): Promise<{
  context: string;
  items: number;
}> {
  const text = await callMcpTool("get_rag_context", { query });
  return {
    context: text,
    items: text ? text.split("---").length : 0,
  };
}

export async function searchMcpDocuments(query: string, limit = 10): Promise<string> {
  return callMcpTool("search_documents", { query, limit });
}
