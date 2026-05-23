"use client";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="min-h-screen agri-page-bg flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
			<h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Страницата не зареди правилно</h1>
			<p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
				{error.message || "Неочаквана грешка. Отвори конзолата (F12) за подробности."}
			</p>
			<button
				type="button"
				onClick={() => reset()}
				className="brand-cta-bg rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:brightness-105 transition">
				Опитай отново
			</button>
		</div>
	);
}
