/**
 * Проверява .env.local + .env за magic link (Supabase Auth).
 * Не отпечатва стойности на ключове.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @param {string} content */
function parseEnvFile(content) {
	/** @type {Record<string, string>} */
	const out = {};
	for (const raw of content.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line || line.startsWith("#")) continue;
		const eq = line.indexOf("=");
		if (eq <= 0) continue;
		const key = line.slice(0, eq).trim();
		let val = line.slice(eq + 1).trim();
		if (
			(val.startsWith('"') && val.endsWith('"')) ||
			(val.startsWith("'") && val.endsWith("'"))
		) {
			val = val.slice(1, -1);
		}
		out[key] = val;
	}
	return out;
}

function loadMergedEnv() {
	/** @type {Record<string, string>} */
	const merged = {};
	// .env.local трябва да презаписва .env
	for (const name of [".env", ".env.local"]) {
		const p = join(root, name);
		if (!existsSync(p)) continue;
		Object.assign(merged, parseEnvFile(readFileSync(p, "utf8")));
	}
	return merged;
}

function devPort() {
	try {
		const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
		const script = pkg.scripts?.dev || "";
		const m = /-p\s+(\d+)/.exec(script);
		return m ? Number(m[1]) : 3000;
	} catch {
		return 3000;
	}
}

function main() {
	const env = loadMergedEnv();
	const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
	const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
	const port = devPort();
	const callback = `http://localhost:${port}/auth/callback`;
	const site = `http://localhost:${port}`;

	console.log("AgriNexus — проверка на средата за вход с имейл (Supabase Auth)\n");

	let ok = true;
	if (!url) {
		console.log("✗ NEXT_PUBLIC_SUPABASE_URL — липсва в .env.local или .env");
		console.log("  → Supabase → Settings → API → Project URL\n");
		ok = false;
	} else if (!/^https?:\/\//i.test(url)) {
		console.log("✗ NEXT_PUBLIC_SUPABASE_URL — трябва да започва с https://\n");
		ok = false;
	} else {
		console.log(`✓ NEXT_PUBLIC_SUPABASE_URL (${url.slice(0, 32)}…)`);
	}

	if (!anon) {
		console.log("✗ NEXT_PUBLIC_SUPABASE_ANON_KEY — липсва в .env.local или .env");
		console.log("  → Supabase → Settings → API → anon public\n");
		ok = false;
	} else if (anon.includes("...") || anon.length < 100) {
		console.log(
			"✗ NEXT_PUBLIC_SUPABASE_ANON_KEY — изглежда непълен или placeholder (JWT anon обикновено е 150+ символа)",
		);
		console.log("  → копирай целия ключ от Supabase → Settings → API → anon public\n");
		ok = false;
	} else {
		console.log(`✓ NEXT_PUBLIC_SUPABASE_ANON_KEY (дължина ${anon.length})`);
	}

	console.log("\n— Supabase Dashboard → Authentication → URL Configuration —");
	console.log(`  Site URL:           ${site}`);
	console.log(`  Redirect URLs:      ${callback}`);
	console.log("  (добави и production URL-и, ако деплойваш)\n");

	if (ok) {
		console.log("След това: npm run dev → отвори /vhod и изпрати връзката.");
		process.exit(0);
	} else {
		console.log("Попълни липсващите променливи, рестартирай dev сървъра и пусни отново този скрипт.");
		process.exit(1);
	}
}

main();
