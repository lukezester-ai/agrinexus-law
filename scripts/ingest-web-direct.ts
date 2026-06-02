import { readFileSync, existsSync } from "node:fs";
import { runWebAgricultureDocumentIngest } from "../lib/ingest/web-agri-discover";

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

loadEnvFile(".env");
loadEnvFile(".env.local");

async function sleep(ms: number) {
	return new Promise(r => setTimeout(r, ms));
}

const topics = [
	"земеделие субсидии CAP България",
	"ДФЗ директни плащания наредба",
	"програма за развитие на селските райони",
	"овощарство субсидии наредби",
	"животновъдство подпомагане",
	"млад фермер изисквания",
	"биологично земеделие регламенти ЕС"
];

async function main() {
	console.log("Starting 1-hour web document ingestion loop...");
	const endTime = Date.now() + 60 * 60 * 1000;
	let cycle = 0;

	while (Date.now() < endTime) {
		cycle++;
		const topic = topics[cycle % topics.length];
		console.log(`\n[Cycle ${cycle}] (${new Date().toLocaleTimeString()}) Topic: ${topic}`);
		try {
			const res = await runWebAgricultureDocumentIngest({
				topic,
				searchNum: 10,
				maxDownloads: 5
			});
			console.log(`- Fetched (hits): ${res.fetched}, Stored (documents): ${res.stored}`);
			for (const err of res.errors || []) console.error("  !", err);
		} catch (e) {
			console.error("Error in cycle:", e);
		}
		
		const timeLeft = endTime - Date.now();
		if (timeLeft <= 0) break;

		// Sleep for 3 minutes (180000 ms) to respect API rate limits
		const sleepTime = Math.min(180000, timeLeft);
		console.log(`Waiting ${sleepTime / 1000} seconds before next run...`);
		await sleep(sleepTime);
	}
	console.log("\nFinished 1-hour ingestion loop.");
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
