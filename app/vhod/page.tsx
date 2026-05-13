import { Suspense } from "react";
import type { Metadata } from "next";
import { VhodForm } from "./vhod-form";

export const metadata: Metadata = {
	title: "„Моя ферма“ — регистрация и вход с имейл | AgriNexus.Law",
	description:
		"Регистрация и вход с magic link за „Моя ферма“: без парола; при първо потвърждение се създава акаунт и влизаш в панела. Без welcome или маркетингови имейли от приложението.",
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
