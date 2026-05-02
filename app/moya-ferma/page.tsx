import type { Metadata } from "next";
import { MoyaFermaDashboard } from "./moya-ferma-dashboard";

export const metadata: Metadata = {
	title: "Моя ферма | AgriNexus.Law",
	description:
		"Личен панел за фермери: профил на стопанството, документи, търсене в ДФЗ и чат с AI екипа.",
	robots: { index: false },
};

export default function MoyaFermaPage() {
	return <MoyaFermaDashboard />;
}
