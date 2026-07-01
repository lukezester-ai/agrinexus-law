import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CropStatisticsView } from "@/components/CropStatisticsView";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale } = await params;
	return locale === "bg"
		? {
				title: "Статистика на реколтата",
				description: "Интерактивни статистики за земеделските култури в България — обеми, цени, прогнози и регионално разпределение.",
			}
		: {
				title: "Crop statistics",
				description: "Interactive crop statistics for Bulgaria — volumes, prices, forecasts and regional breakdown.",
			};
}

export default function StatistikiPage({ params }: PageProps) {
	return <CropStatisticsView />;
}
