"use client";

import { useEffect, useState } from "react";

type ProofItem = { quote: string; context: string };

export function LandingSocialProof() {
	const [items, setItems] = useState<ProofItem[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			try {
				const res = await fetch("/api/stats/social-proof", { cache: "no-store" });
				const data = (await res.json()) as { items?: ProofItem[] };
				if (!cancelled && Array.isArray(data.items)) {
					setItems(data.items);
				}
			} catch {
				if (!cancelled) setItems(null);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const cards = items ?? [
		{ quote: "Зареждане на реални данни…", context: "AgriNexus" },
		{ quote: "—", context: "—" },
		{ quote: "—", context: "—" },
	];

	return (
		<section className="bg-[#F5F5F7]" style={{ padding: "100px 48px" }}>
			<div className="mx-auto max-w-[1100px] text-center">
				<span
					style={{
						fontSize: "12px",
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						fontWeight: 600,
						color: "#0071E3",
						marginBottom: "16px",
						display: "block",
					}}
				>
					РЕАЛНИ КАЗУСИ
				</span>
				<h2
					style={{
						fontSize: "clamp(32px, 4vw, 48px)",
						fontWeight: 700,
						color: "#1D1D1F",
						lineHeight: 1.05,
						letterSpacing: "-0.025em",
						marginBottom: "20px",
					}}
				>
					Какво ползват фермерите.
				</h2>
				<p
					style={{
						fontSize: "17px",
						lineHeight: 1.6,
						color: "#6E6E73",
						marginBottom: "48px",
					}}
				>
					Положителни въпроси от чата или актуални метрики от платформата — без измислени истории.
				</p>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					{cards.map((card, i) => (
						<div
							key={`${card.context}-${i}`}
							className="flex flex-col rounded-[18px] bg-[#FFFFFF] text-left"
							style={{ padding: "32px" }}
						>
							<p
								style={{
									fontSize: "17px",
									lineHeight: 1.6,
									color: "#1D1D1F",
									marginBottom: "24px",
									flex: 1,
								}}
							>
								&ldquo;{card.quote}&rdquo;
							</p>
							<p style={{ fontSize: "14px", color: "#6E6E73", fontWeight: 600 }}>{card.context}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
