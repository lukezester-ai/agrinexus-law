/**
 * Пуска AI Leader оркестратора (5 агента) без dev сървър.
 *
 *   npx tsx scripts/run-ai-leaders.ts
 *   npx tsx scripts/run-ai-leaders.ts --quick
 */
import { readFileSync, existsSync } from "node:fs";
import { runAgentOrchestrator } from "../lib/ai-leader/agents/orchestrator";

function loadEnvFile(path: string) {
	if (!existsSync(path)) return;
	for (const line of readFileSync(path, "utf8").split("\n")) {
		const t = line.trim();
		if (!t || t.startsWith("#")) continue;
		const eq = t.indexOf("=");
		if (eq < 1) continue;
		const key = t.slice(0, eq).trim();
		let val = t.slice(eq + 1).trim();
		if (
			(val.startsWith('"') && val.endsWith('"')) ||
			(val.startsWith("'") && val.endsWith("'"))
		) {
			val = val.slice(1, -1);
		}
		if (!process.env[key]) process.env[key] = val;
	}
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const quick = process.argv.includes("--quick");

async function main() {
	console.log(
		quick
			? "[ai-leader] Бърз цикъл (guardian, learner, analyst)…"
			: "[ai-leader] Пълен цикъл — 5 агента…",
	);

	const result = await runAgentOrchestrator({ skipHeavy: quick });

	console.log("\n=== SUMMARY ===");
	console.log(result.summary);
	console.log(`OK: ${result.ok}`);
	console.log(`Started: ${result.startedAt}`);
	console.log(`Finished: ${result.finishedAt}\n`);

	for (const run of result.runs) {
		console.log(`--- ${run.agentId} (${run.ok ? "OK" : "FAIL"}) ---`);
		if (run.error) console.log("Error:", run.error);
		console.log("Metrics:", JSON.stringify(run.metrics, null, 2));
		for (const rec of run.recommendations) {
			console.log("→", rec);
		}
		console.log("");
	}

	process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
	console.error("[ai-leader] fatal:", err);
	process.exit(1);
});
