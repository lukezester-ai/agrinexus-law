"use client";

import { useEffect, useState } from "react";

type LiveTile = { value: string; label: string };

export function LandingLiveStats() {
	const [tiles, setTiles] = useState<LiveTile[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			try {
				const res = await fetch("/api/stats/live", { cache: "no-store" });
				const data = (await res.json()) as { tiles?: LiveTile[] };
				if (!cancelled && Array.isArray(data.tiles) && data.tiles.length > 0) {
					setTiles(data.tiles.slice(0, 3));
				}
			} catch {
				if (!cancelled) setTiles(null);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const display =
		tiles ??
		([
			{ value: "—", label: "зареждане…" },
			{ value: "—", label: "архив" },
			{ value: "—", label: "RAG индекс" },
		] as LiveTile[]);

	return (
		<section
			className="bg-[#FFFFFF]"
			style={{
				paddingTop: "0",
				paddingBottom: "100px",
				paddingLeft: "48px",
				paddingRight: "48px",
			}}
		>
			<div className="mx-auto max-w-[1100px]">
				<div
					className="flex flex-col items-stretch md:flex-row"
					style={{ borderTop: "1px solid #D2D2D7" }}
				>
					{display.map((stat, idx) => (
						<div
							key={stat.label}
							className="flex flex-1 flex-col items-center justify-center py-12 text-center"
							style={{ borderLeft: idx > 0 ? "1px solid #D2D2D7" : "none" }}
						>
							<span
								style={{
									fontSize: "56px",
									fontWeight: 700,
									color: "#1D1D1F",
									lineHeight: 1,
									marginBottom: "8px",
									display: "block",
								}}
							>
								{stat.value}
							</span>
							<span style={{ fontSize: "15px", color: "#6E6E73", lineHeight: 1.6 }}>
								{stat.label}
							</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
