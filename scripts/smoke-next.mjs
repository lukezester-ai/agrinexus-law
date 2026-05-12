/**
 * След `next build`: стартира `next start` на свободен порт и проверява GET /api/health и GET /.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import http from "node:http";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");

async function getFreePort() {
	return new Promise((resolve, reject) => {
		const s = createServer();
		s.unref();
		s.on("error", reject);
		s.listen(0, "127.0.0.1", () => {
			const addr = s.address();
			const port = typeof addr === "object" && addr ? addr.port : null;
			s.close(() => (port ? resolve(port) : reject(new Error("no port"))));
		});
	});
}

/** @param {number} port */
function httpGet(port, path) {
	return new Promise((resolve, reject) => {
		const req = http.request(
			{ hostname: "127.0.0.1", port, path, method: "GET" },
			(res) => {
				const chunks = [];
				res.on("data", (c) => chunks.push(c));
				res.on("end", () => {
					const text = Buffer.concat(chunks).toString("utf-8");
					let json = null;
					try {
						json = text ? JSON.parse(text) : {};
					} catch {
						/* leave null */
					}
					resolve({
						ok: res.statusCode >= 200 && res.statusCode < 300,
						status: res.statusCode,
						text,
						json,
					});
				});
			},
		);
		req.on("error", reject);
		req.end();
	});
}

async function waitForHealth(port, timeoutMs) {
	const deadline = Date.now() + timeoutMs;
	let lastErr = "";
	while (Date.now() < deadline) {
		try {
			const r = await httpGet(port, "/api/health");
			if (r.ok && r.json?.ok && r.json?.service === "agrinexus-mvp") return;
			lastErr = `${r.status} ${r.text?.slice(0, 100) || ""}`;
		} catch (e) {
			lastErr = e.message || String(e);
		}
		await new Promise((r) => setTimeout(r, 200));
	}
	throw new Error(`Next не отговори навреме: ${lastErr}`);
}

async function main() {
	const port = await getFreePort();

	const child = spawn(process.execPath, [nextCli, "start", "-H", "127.0.0.1", "-p", String(port)], {
		cwd: root,
		env: { ...process.env, NODE_ENV: "production", PORT: String(port) },
		stdio: ["ignore", "pipe", "pipe"],
	});

	const kill = () => {
		try {
			child.kill("SIGTERM");
		} catch {
			/* ignore */
		}
	};

	try {
		await waitForHealth(port, 120_000);

		const home = await httpGet(port, "/");
		if (!home.ok) {
			throw new Error(`GET / → ${home.status}`);
		}

		console.log("smoke-next: OK (GET /api/health, GET /).");
	} finally {
		kill();
		await new Promise((r) => setTimeout(r, 600));
		if (child.exitCode === null && !child.killed) {
			try {
				child.kill("SIGKILL");
			} catch {
				/* ignore */
			}
		}
	}
}

await main().catch((err) => {
	console.error("smoke-next:", err.message || err);
	process.exit(1);
});
