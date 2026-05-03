/** Локален профил на производител (браузър) — за проверки в „Твоите срокове“. */

export type FarmerLocalProfile = {
	fullName: string;
	uin: string;
	farmName: string;
	region: string;
	decares: string;
	iban: string;
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
		uin: "",
		farmName: "",
		region: "",
		decares: "",
		iban: "",
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
		const p = JSON.parse(raw) as Partial<FarmerLocalProfile>;
		return { ...defaultFarmerProfile(), ...p };
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
