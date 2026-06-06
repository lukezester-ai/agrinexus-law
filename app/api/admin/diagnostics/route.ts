import { getRagIndexStatus } from "@/lib/rag/rag-index-status";

function hasValue(value: string | undefined) {
	return Boolean(value?.trim());
}

export async function GET() {
	const rag = await getRagIndexStatus();

	return Response.json({
		ok: true,
		service: "agrinexus-mvp",
		timestamp: new Date().toISOString(),
		runtime: {
			nodeEnv: process.env.NODE_ENV || "development",
			nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
		},
		env: {
			openAi: hasValue(process.env.OPENAI_API_KEY),
			supabaseUrl: hasValue(process.env.SUPABASE_URL) || hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
			supabaseServiceRole: hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
			ingestAdminToken: hasValue(process.env.INGEST_ADMIN_TOKEN),
			upstashRedis: hasValue(process.env.UPSTASH_REDIS_REST_URL) && hasValue(process.env.UPSTASH_REDIS_REST_TOKEN),
			resend: hasValue(process.env.RESEND_API_KEY),
		},
		rag: {
			healthy: rag.healthy,
			enabled: rag.enabled,
			tableReachable: rag.tableReachable,
			totalChunks: rag.totalChunks,
			withEmbedding: rag.withEmbedding,
			withoutEmbedding: rag.withoutEmbedding,
			bySourceType: rag.bySourceType,
			hints: rag.hints,
		},
	});
}
