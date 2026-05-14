import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Твоите срокове — ДФЗ",
	description: "Ориентировъчни срокове за кампания — AgriNexus.Law.",
	openGraph: {
		title: "Твоите срокове · AgriNexus.Law",
		description: "Ключови дати — потвърди в ИСУН и dfz.bg.",
	},
};
export default function SrokoveLayout({ children }: { children: React.ReactNode }) {
	return children;
}
