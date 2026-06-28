import Link from "next/link";
import { SitePageShell } from "@/components/site-page-shell";
import { PricingPlans } from "@/components/pricing-plans";

type Props = {
	searchParams: Promise<{ success?: string; canceled?: string; trial?: string }>;
};

export default async function PricingPage({ searchParams }: Props) {
	const params = await searchParams;

	return (
		<SitePageShell
			maxWidth="5xl"
			subheader={
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Link
						href="/"
						className="text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
					>
						← Начало
					</Link>
					<span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
						Абонаментни планове
					</span>
				</div>
			}
		>
			<div className="space-y-8">
				<header className="text-center">
					<h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
						Цени за фермери
					</h1>
					<p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
						Търсенето и сроковете остават безплатни. AI чат и преглед на договори — по
						избран план. Всички цени в <strong>EUR (€)</strong>. Нови абонати получават{" "}
						<strong>7 дни безплатен пробен период</strong>.
					</p>
				</header>

				{params.success === "1" ? (
					<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
						{params.trial === "1"
							? "Пробният период е активиран. Пълен достъп до края на 7-те дни; после Stripe таксува избрания план в EUR, освен ако отмените."
							: "Абонаментът се активира след потвърждение от Stripe (обикновено до минута)."}
					</div>
				) : null}
				{params.canceled === "1" ? (
					<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
						Checkout-ът беше отменен. Можете да изберете план отново по всяко време.
					</div>
				) : null}

				<PricingPlans />

				<section className="surface-card space-y-4 p-6 text-sm text-slate-600 dark:text-slate-300">
					<h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
						Често задавани въпроси
					</h2>
					<div>
						<p className="font-semibold text-slate-800 dark:text-slate-100">
							Мога ли да ползвам платформата без абонамент?
						</p>
						<p className="mt-1">
							Да — търсене, документи, срокове и калкулатори са безплатни. AI чат има
							дневен лимит; AI преглед изисква платен план.
						</p>
					</div>
					<div>
						<p className="font-semibold text-slate-800 dark:text-slate-100">
							Как работи 7-дневният trial?
						</p>
						<p className="mt-1">
							При първи абонамент получавате пълен достъп 7 дни без такса. След това Stripe
							таксува автоматично в EUR. Отменете преди края на trial-а от Stripe Portal, ако
							не искате да продължите.
						</p>
					</div>
					<div>
						<p className="font-semibold text-slate-800 dark:text-slate-100">
							Как отменям абонамента?
						</p>
						<p className="mt-1">
							След първо плащане — бутон „Управление на абонамента“ → Stripe Customer
							Portal.
						</p>
					</div>
				</section>
			</div>
		</SitePageShell>
	);
}
