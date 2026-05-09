import { Suspense } from "react";
import type { Metadata } from "next";
import { VhodForm } from "./vhod-form";

export const metadata: Metadata = {
	title: "Регистрация / Вход · Моя ферма | AgriNexus.Law",
	description:
		"Регистрация и вход с имейл за личния панел „Моя ферма“ — профил, документи и инструменти за фермери.",
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
