export default function Loading() {
	return (
		<div className="agri-mobile-safe agri-floating-header-pad min-h-screen agri-page-bg px-4 py-20 text-slate-950 dark:text-slate-100 sm:px-6">
			<div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.9fr]">
				<div className="space-y-6">
					<div className="h-10 w-56 animate-pulse rounded-sm bg-slate-200/80 dark:bg-slate-800" />
					<div className="space-y-3">
						<div className="h-14 w-full max-w-3xl animate-pulse rounded-sm bg-slate-200/80 dark:bg-slate-800" />
						<div className="h-14 w-4/5 max-w-2xl animate-pulse rounded-sm bg-slate-200/80 dark:bg-slate-800" />
					</div>
					<div className="h-24 max-w-2xl animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
					<div className="grid gap-3 sm:grid-cols-3">
						{[0, 1, 2].map((item) => (
							<div key={item} className="h-28 animate-pulse rounded-2xl bg-white/70 shadow-sm dark:bg-slate-900/80" />
						))}
					</div>
				</div>
				<div className="h-[420px] animate-pulse rounded-3xl bg-white/75 shadow-sm dark:bg-slate-900/80" />
			</div>
		</div>
	);
}
