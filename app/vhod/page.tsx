import { Suspense } from "react";
import type { Metadata } from "next";
import { VhodForm } from "./vhod-form";

export const metadata: Metadata = {
	title: "„Моя ферма“ — вход с имейл | AgriNexus.Law",
	description:
		"Вход с magic link за „Моя ферма“: без парола; само за вече активирани акаунти. Без welcome или маркетингови имейли от приложението.",
	robots: { index: false },
};

function VhodFallback() {
	return (
		<div className="min-h-screen agri-page-bg flex items-center justify-center">
			<p className="text-sm text-stone-500 dark:text-stone-400">Зареждане…</p>
		</div>
	);
}

export default function VhodPage() {
	return (
		<Suspense fallback={<VhodFallback />}>
			<VhodForm />
		</Suspense>
	);
}
