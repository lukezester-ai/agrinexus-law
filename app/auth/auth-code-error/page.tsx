import Link from "next/link";

export default function AuthCodeErrorPage() {
	return (
		<div className="min-h-screen agri-page-bg flex items-center justify-center px-6">
			<div className="max-w-md text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 p-8 shadow-sm">
				<h1 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-2">
					Проблем с входа
				</h1>
				<p className="text-sm text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
					Връзката е изтекла или вече е използвана. Заяви нова връзка от страницата за вход.
				</p>
				<Link
					href="/vhod"
					className="inline-flex items-center justify-center w-full py-3 rounded-lg text-sm font-medium text-white"
					style={{ background: "#0d9488" }}>
					Към вход
				</Link>
			</div>
		</div>
	);
}
