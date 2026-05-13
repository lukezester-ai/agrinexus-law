import fs from "node:fs";
import path from "node:path";

let cached: ArrayBuffer | null = null;

/** Noto за pdf-lib — чете се от `public/fonts/` (Node, без fetch в браузъра). */
export function loadNotoFontFromDisk(): ArrayBuffer {
	if (cached) return cached;
	const fp = path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf");
	if (!fs.existsSync(fp)) {
		throw new Error(`Missing font at ${fp}`);
	}
	const buf = fs.readFileSync(fp);
	cached = Uint8Array.from(buf).buffer;
	return cached;
}
