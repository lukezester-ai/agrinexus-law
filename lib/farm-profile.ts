/** Профил на стопанството — пази се в localStorage (постоянно между сесии и табове). */

export const FARM_PROFILE_STORAGE_KEY = "farm_profile";

export interface FarmProfileSnapshot {
	farm_type: string;
	region: string;
	total_decares: number;
	crops: string[];
	livestock: string[];
	is_organic: boolean;
}

function emptySnapshot(): FarmProfileSnapshot {
	return {
		farm_type: "",
		region: "",
		total_decares: 0,
		crops: [],
		livestock: [],
		is_organic: false,
	};
}

/** Чете профил от localStorage; при липса опитва еднократна миграция от sessionStorage. */
export function loadFarmProfile(): FarmProfileSnapshot | null {
	if (typeof window === "undefined") return null;
	try {
		const ls = localStorage.getItem(FARM_PROFILE_STORAGE_KEY);
		if (ls) {
			const parsed = JSON.parse(ls) as FarmProfileSnapshot;
			return { ...emptySnapshot(), ...parsed };
		}
		const legacy = sessionStorage.getItem(FARM_PROFILE_STORAGE_KEY);
		if (legacy) {
			localStorage.setItem(FARM_PROFILE_STORAGE_KEY, legacy);
			sessionStorage.removeItem(FARM_PROFILE_STORAGE_KEY);
			const parsed = JSON.parse(legacy) as FarmProfileSnapshot;
			return { ...emptySnapshot(), ...parsed };
		}
	} catch {
		/* ignore */
	}
	return null;
}

export function persistFarmProfile(snapshot: FarmProfileSnapshot): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(FARM_PROFILE_STORAGE_KEY, JSON.stringify(snapshot));
	} catch {
		/* квота / частен режим */
	}
}
