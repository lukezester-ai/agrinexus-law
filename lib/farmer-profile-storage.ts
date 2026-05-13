/** Локален профил на производител (браузър) — за проверки в „Твоите срокове“. */

import { loadFarmProfile } from "./farm-profile";

export type FarmerLocalProfile = {
	fullName: string;
	farmName: string;
	region: string;
	decares: string;
	/** Има документ за право на ползване на земята */
	hasLandRightsDoc: boolean;
	/** Потвърдена сметка за плащания от ДФЗ */
	hasBankAccountVerified: boolean;
	/** Декларира био/екосхема */
	declaresOrganic: boolean;
	/** Има валиден сертификат за био (при деклариране) */
	hasOrganicCertificate: boolean;
};

const STORAGE_KEY = "agrinexus-mvp-farmer-command-v1";

export function defaultFarmerProfile(): FarmerLocalProfile {
	return {
		fullName: "",
		farmName: "",
		region: "",
		decares: "",
		hasLandRightsDoc: false,
		hasBankAccountVerified: false,
		declaresOrganic: false,
		hasOrganicCertificate: false,
	};
}

export function loadFarmerProfile(): FarmerLocalProfile {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return defaultFarmerProfile();
		const p = JSON.parse(raw) as Record<string, unknown>;
		const b = defaultFarmerProfile();
		return {
			...b,
			fullName: typeof p.fullName === "string" ? p.fullName : b.fullName,
			farmName: typeof p.farmName === "string" ? p.farmName : b.farmName,
			region: typeof p.region === "string" ? p.region : b.region,
			decares: typeof p.decares === "string" ? p.decares : b.decares,
			hasLandRightsDoc: Boolean(p.hasLandRightsDoc),
			hasBankAccountVerified: Boolean(p.hasBankAccountVerified),
			declaresOrganic: Boolean(p.declaresOrganic),
			hasOrganicCertificate: Boolean(p.hasOrganicCertificate),
		};
	} catch {
		return defaultFarmerProfile();
	}
}

export function saveFarmerProfile(p: FarmerLocalProfile): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
	} catch {
		/* ignore quota */
	}
}

/**
 * Данни за чернови PDF: локалният command-профил + полета от „Профил на стопанството“ (/profile),
 * когато command-профилът е празен.
 */
export function profileForPdf(): FarmerLocalProfile {
	if (typeof window === "undefined") return defaultFarmerProfile();
	const base = loadFarmerProfile();
	const farm = loadFarmProfile();
	if (!farm) return base;

	const decaresStr =
		String(base.decares || "").trim() ||
		(farm.total_decares > 0 ? String(farm.total_decares) : "");
	const farmLabel = [farm.farm_type?.trim(), farm.crops?.slice(0, 3).join(", ")].filter(Boolean).join(" · ");

	return {
		...base,
		region: String(base.region || "").trim() || farm.region?.trim() || "",
		decares: decaresStr,
		farmName: String(base.farmName || "").trim() || farmLabel || "",
		declaresOrganic: base.declaresOrganic || Boolean(farm.is_organic),
	};
}
