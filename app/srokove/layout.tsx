import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Твоите срокове и чернови PDF — ДФЗ",
	description:
		"Ориентировъчни срокове за кампания и работни PDF чернови — AgriNexus.Law.",
	openGraph: {
		title: "Твоите срокове · AgriNexus.Law",
		description: "Ключови дати и чернови PDF — потвърди в ИСУН и dfz.bg.",
	},
};

export default function SrokoveLayout({ children }: { children: React.ReactNode }) {
	return children;
}
