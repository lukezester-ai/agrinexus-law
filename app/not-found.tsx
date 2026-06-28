import Link from "next/link";

export default function NotFound() {
	return (
		<div className="agri-mobile-safe flex min-h-screen flex-col items-center justify-center px-4 text-center">
			<h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
				Страницата не е намерена
			</h1>
			<p className="mt-3 max-w-md text-slate-600 dark:text-slate-300">
				Адресът може да е променен или да не съществува.
			</p>
			<Link
				href="/"
				className="mt-8 inline-flex rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700"
			>
				Към началото
			</Link>
		</div>
	);
}
