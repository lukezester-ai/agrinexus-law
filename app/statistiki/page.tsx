"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CropStatisticsView } from "@/components/crop-statistics-view";

export default function StatistikiPage() {
	return (
		<div className="min-h-screen agri-page-bg">
			<nav className="sticky top-0 z-20 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-teal-100/80 dark:border-stone-800">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
					<Link
						href="/"
						className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 text-sm">
						<ArrowLeft size={16} aria-hidden />
						Начало
					</Link>
					<span className="font-medium text-stone-900 dark:text-stone-100 text-sm sm:text-base order-last sm:order-none w-full sm:w-auto text-center sm:text-left">
						Статистика по основни култури
					</span>
					<div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs sm:text-sm">
						<Link href="/kalendar" className="text-[#0d9488] dark:text-teal-400 font-medium">
							Календар
						</Link>
						<Link href="/srokove" className="text-[#0d9488] dark:text-teal-400 font-medium">
							Срокове
						</Link>
						<Link href="/kalkulator" className="text-[#0d9488] dark:text-teal-400 font-medium">
							Калкулатор
						</Link>
					</div>
				</div>
			</nav>

			<main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
				<CropStatisticsView />
			</main>
		</div>
	);
}
