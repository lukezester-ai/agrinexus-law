import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DokumentiPage } from "@/components/DokumentiPage";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale } = await params;
	return locale === "bg"
		? {
				title: "Архив и документи",
				description: "Държавен архив на документи от ДФЗ, МЗХ, БАБХ и лични файлове.",
			}
		: {
				title: "Archive & documents",
				description: "State archive of documents from DFZ, MZH, BABH and personal files.",
			};
}

export default function DokumentiRoute({ params }: PageProps) {
	return <DokumentiPage />;
}
