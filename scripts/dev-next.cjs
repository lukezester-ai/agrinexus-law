/**
 * Стартира `next dev` на първия свободен порт от списъка (по подразбиране 3002).
 * Избягва EADDRINUSE, когато вече има стар процес на същия порт.
 */
const net = require("net");
const { spawn } = require("child_process");
const path = require("path");

const PREFERRED_PORTS = [3002, 3020, 3010, 3000, 3003];

function portFree(port) {
	return new Promise((resolve) => {
		const s = net.createServer();
		s.once("error", () => resolve(false));
		s.listen(port, () => {
			s.close(() => resolve(true));
		});
	});
}

(async () => {
	let port;
	for (const p of PREFERRED_PORTS) {
		if (await portFree(p)) {
			port = p;
			break;
		}
	}
	if (port == null) {
		console.error("Не намерих свободен порт сред:", PREFERRED_PORTS.join(", "));
		process.exit(1);
	}
	if (port !== 3002) {
		console.log("\n⚠ Порт 3002 е зает — стартирам на", port, "(затвори стария dev или използвай този URL)\n");
	}
	console.log("▶ Next.js:", `http://localhost:${port}\n`);
	const child = spawn("npx", ["next", "dev", "-p", String(port)], {
		stdio: "inherit",
		shell: true,
		cwd: path.join(__dirname, ".."),
	});
	child.on("exit", (code) => process.exit(code ?? 0));
})();
