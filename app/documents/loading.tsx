export default function DocumentsLoading() {
	return (
		<div className="grid gap-6">
			<div className="space-y-3">
				<div className="h-5 w-44 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
				<div className="h-10 w-80 max-w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				{[0, 1, 2, 3].map((item) => (
					<div key={item} className="h-44 animate-pulse rounded-3xl bg-white/80 shadow-sm dark:bg-slate-900/80" />
				))}
			</div>
		</div>
	);
}
