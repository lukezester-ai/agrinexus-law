/** Профил на стопанството — пази се в localStorage (постоянно между сесии и табове). */

export const FARM_PROFILE_STORAGE_KEY = "farm_profile";

/** Legacy key от /moya-ferma — мигрира се еднократно към farm_profile. */
const LEGACY_MOYA_FERMA_KEY = "agrinexus_farm_profile";

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

/** Чете профил от localStorage; мигрира legacy ключове. */
export function loadFarmProfile(): FarmProfileSnapshot | null {
	if (typeof window === "undefined") return null;
	try {
		const ls = localStorage.getItem(FARM_PROFILE_STORAGE_KEY);
		if (ls) {
			const parsed = JSON.parse(ls) as FarmProfileSnapshot;
			return { ...emptySnapshot(), ...parsed };
		}
		const legacyMoya = localStorage.getItem(LEGACY_MOYA_FERMA_KEY);
		if (legacyMoya) {
			const legacy = JSON.parse(legacyMoya) as {
				region?: string;
				crops?: string;
				isBio?: boolean;
			};
			const migrated: FarmProfileSnapshot = {
				...emptySnapshot(),
				region: legacy.region?.trim() ?? "",
				crops: legacy.crops
					? legacy.crops.split(",").map((c) => c.trim()).filter(Boolean)
					: [],
				is_organic: Boolean(legacy.isBio),
			};
			persistFarmProfile(migrated);
			localStorage.removeItem(LEGACY_MOYA_FERMA_KEY);
			return migrated;
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

/** Има ли поне минимални данни, за да смятаме профила „попълнен“ за UX (чат, калкулатор). */
export function isFarmProfileSubstantial(s: FarmProfileSnapshot | null): boolean {
	if (!s) return false;
	const region = s.region?.trim();
	const farmType = s.farm_type?.trim();
	const decares = Number(s.total_decares);
	const hasCropsOrLivestock =
		(s.crops?.length ?? 0) > 0 || (s.livestock?.length ?? 0) > 0;
	if (region && farmType) return true;
	if (decares > 0) return true;
	if (hasCropsOrLivestock) return true;
	return false;
}
