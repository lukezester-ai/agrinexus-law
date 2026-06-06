import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase"; // Server-side admin or regular client
import { CROP_PROFILES } from "@/lib/crop-statistics-data";

export const revalidate = 3600; // Cache for 1 hour

function isMissingCropStatisticsTableError(error: { code?: string; message?: string }) {
	const message = error.message?.toLowerCase() || "";
	return (
		error.code === "42P01" ||
		message.includes("crop_statistics") && message.includes("schema cache")
	);
}

export async function GET() {
	try {
		const supabase = getSupabaseAdmin();
		if (!supabase) {
			return NextResponse.json({ ok: false, fallback: true, data: CROP_PROFILES });
		}

		// Вземаме данните от базата
		const { data, error } = await supabase
			.from("crop_statistics")
			.select("crop_key, year, volume_kt, avg_price_bgn, regions")
			.order("year", { ascending: true });

		if (error) {
			if (!isMissingCropStatisticsTableError(error)) {
				console.error("[api/statistiki] supabase error:", error.message);
			}
			// Fallback към локалните данни
			return NextResponse.json({ ok: false, fallback: true, data: CROP_PROFILES });
		}

		// Групираме ги по crop_key
		const remoteSeriesMap: Record<string, any[]> = {};
		for (const row of data || []) {
			if (!remoteSeriesMap[row.crop_key]) remoteSeriesMap[row.crop_key] = [];
			remoteSeriesMap[row.crop_key].push({
				year: row.year,
				kt: Number(row.volume_kt),
				priceBgn: Number(row.avg_price_bgn),
				regions: row.regions || {}
			});
		}

		// Смесваме (merge) отдалечените данни с локалните профили
		const mergedProfiles = CROP_PROFILES.map(profile => {
			const remoteSeries = remoteSeriesMap[profile.key];
			if (remoteSeries && remoteSeries.length > 0) {
				return { ...profile, series: remoteSeries };
			}
			// Ако за тази култура няма данни в базата, ползваме локалните
			return profile;
		});

		return NextResponse.json({ ok: true, fallback: false, data: mergedProfiles });

	} catch (e) {
		console.error("[api/statistiki] error:", e);
		return NextResponse.json({ ok: false, fallback: true, data: CROP_PROFILES });
	}
}
