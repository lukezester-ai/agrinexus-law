import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Калкулатор на субсидии",
	description:
		"Ориентировъчна прогноза за директни плащания по декари, тип стопанство, ПНДП и екосхеми — AgriNexus.Law.",
	openGraph: {
		title: "Калкулатор на субсидии · AgriNexus.Law",
		description:
			"Въведи декари и какво отглеждаш — виж приблизителен диапазон в лева.",
	},
};

export default function KalkulatorLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
