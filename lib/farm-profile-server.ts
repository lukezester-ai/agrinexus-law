import type { FarmProfileSnapshot } from "@/lib/farm-profile";

const MAX_STR = 200;
const MAX_LIST = 30;
const MAX_ITEM = 80;
const MAX_DECARES = 500_000;

function clampStr(s: unknown, max: number): string {
	if (typeof s !== "string") return "";
	return s.trim().slice(0, max);
}

function clampStringArray(arr: unknown): string[] {
	if (!Array.isArray(arr)) return [];
	const out: string[] = [];
	for (const x of arr.slice(0, MAX_LIST)) {
		if (typeof x !== "string") continue;
		const t = x.trim().slice(0, MAX_ITEM);
		if (t) out.push(t);
	}
	return out;
}

/**
 * Валидира и ограничава профил от тяло на заявка или user_metadata.
 * Не се доверява на суров JSON без проверка на типове и размери.
 */
export function sanitizeFarmProfilePayload(raw: unknown): FarmProfileSnapshot | null {
	if (raw == null || typeof raw !== "object") return null;
	const o = raw as Record<string, unknown>;
	const farm_type = clampStr(o.farm_type, MAX_STR);
	const region = clampStr(o.region, MAX_STR);
	let total = Number(o.total_decares);
	if (!Number.isFinite(total) || total < 0) total = 0;
	if (total > MAX_DECARES) total = MAX_DECARES;
	const crops = clampStringArray(o.crops);
	const livestock = clampStringArray(o.livestock);
	const is_organic = Boolean(o.is_organic);
	const snap: FarmProfileSnapshot = {
		farm_type,
		region,
		total_decares: Math.round(total),
		crops,
		livestock,
		is_organic,
	};
	const hasAny =
		farm_type ||
		region ||
		snap.total_decares > 0 ||
		crops.length > 0 ||
		livestock.length > 0 ||
		is_organic;
	if (!hasAny) return null;
	return snap;
}

export function farmProfileToPromptText(p: FarmProfileSnapshot): string {
	return `Тип стопанство: ${p.farm_type || "—"}, Размер: ${p.total_decares} декара, Регион: ${p.region || "—"}, Култури: ${p.crops?.join(", ") || "не е посочено"}, Животни/категории: ${p.livestock?.join(", ") || "не е посочено"}, Биологично: ${p.is_organic ? "да" : "не"}`;
}
