"use client";

import "./globals.css";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="bg">
			<body className="m-0 min-h-screen bg-slate-950 font-sans text-slate-50 antialiased">
				<div className="mx-auto max-w-xl p-8">
					<h1 className="mb-3 text-xl font-semibold">Критична грешка</h1>
					<p className="mb-5 text-sm text-slate-300">
						{error.message || "Приложението спря. Презареди страницата или рестартирай npm run dev."}
					</p>
					<button
						type="button"
						onClick={() => reset()}
						className="brand-cta-bg rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-105 transition">
						Презареди
					</button>
				</div>
			</body>
		</html>
	);
}
