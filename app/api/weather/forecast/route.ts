type DailyForecast = {
	date: string;
	tempMaxC: number;
	tempMinC: number;
	precipMm: number;
	windMaxMs: number;
};

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const latRaw = Number(url.searchParams.get("lat") ?? "43.2");
		const lonRaw = Number(url.searchParams.get("lon") ?? "27.9");
		const lat = Number.isFinite(latRaw) ? Math.min(Math.max(latRaw, 41.0), 44.5) : 43.2;
		const lon = Number.isFinite(lonRaw) ? Math.min(Math.max(lonRaw, 22.0), 29.8) : 27.9;

		const upstream = await fetch(
			`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Europe%2FSofia&forecast_days=7`,
			{ cache: "no-store" },
		);

		if (!upstream.ok) {
			return Response.json({ error: `Weather upstream failed (${upstream.status})` }, { status: 502 });
		}

		const json = (await upstream.json()) as {
			daily?: {
				time?: string[];
				temperature_2m_max?: number[];
				temperature_2m_min?: number[];
				precipitation_sum?: number[];
				wind_speed_10m_max?: number[];
			};
		};

		const d = json.daily;
		if (
			!d?.time ||
			!d.temperature_2m_max ||
			!d.temperature_2m_min ||
			!d.precipitation_sum ||
			!d.wind_speed_10m_max
		) {
			return Response.json({ error: "Weather payload missing fields" }, { status: 502 });
		}

		const days: DailyForecast[] = d.time.map((date, i) => ({
			date,
			tempMaxC: Number(d.temperature_2m_max?.[i] ?? 0),
			tempMinC: Number(d.temperature_2m_min?.[i] ?? 0),
			precipMm: Number(d.precipitation_sum?.[i] ?? 0),
			windMaxMs: Number(d.wind_speed_10m_max?.[i] ?? 0) / 3.6, // km/h -> m/s
		}));

		return Response.json({ ok: true, provider: "open-meteo", lat, lon, days });
	} catch (error) {
		console.error("weather/forecast error:", error);
		return Response.json({ error: "Weather request failed" }, { status: 500 });
	}
}
