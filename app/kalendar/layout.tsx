import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Сезонен календар на фермера",
	description:
		"Месечни задачи по култури за България и ключови срокове на ДФЗ — ориентир AgriNexus.Law.",
	openGraph: {
		title: "Сезонен календар · AgriNexus.Law",
		description:
			"Кога сееш, кога следиш ДФЗ и прибиране — по избрана култура.",
	},
};

export default function KalendarLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
