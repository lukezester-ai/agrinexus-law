export default function StatistikiLoading() {
	return (
		<div className="grid gap-6">
			<div className="space-y-3">
				<div className="h-5 w-36 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
				<div className="h-10 w-72 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
				<div className="h-5 max-w-xl animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				{[0, 1, 2].map((item) => (
					<div key={item} className="h-32 animate-pulse rounded-3xl bg-white/80 shadow-sm dark:bg-slate-900/80" />
				))}
			</div>
			<div className="h-[520px] animate-pulse rounded-3xl bg-white/80 shadow-sm dark:bg-slate-900/80" />
		</div>
	);
}
