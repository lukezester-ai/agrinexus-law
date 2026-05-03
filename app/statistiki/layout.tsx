import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Статистика по култури — България",
	description:
		"Демо графики производство (хил. т), тенденция и напояване по основни култури — AgriNexus.Law.",
	openGraph: {
		title: "Статистика по култури · AgriNexus.Law",
		description: "Петгодишна серия, прогноза и ориентир по вода за избрана култура.",
	},
};

export default function StatistikiLayout({ children }: { children: React.ReactNode }) {
	return children;
}
