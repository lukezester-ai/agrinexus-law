import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Твоите срокове и документи — ДФЗ",
	description:
		"Ориентировъчни срокове за кампания, чеклист документи и рискове според профил — AgriNexus.Law.",
	openGraph: {
		title: "Твоите срокове · AgriNexus.Law",
		description: "До кога, какво липсва и къде има риск — потвърди в ИСУН и dfz.bg.",
	},
};

export default function SrokoveLayout({ children }: { children: React.ReactNode }) {
	return children;
}
