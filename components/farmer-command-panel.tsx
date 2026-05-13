"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarClock, FileDown, Loader2 } from "lucide-react";
import {
	formatDeadlineHeadline,
	getActiveDeadlines,
	line,
	type CommandDeadline,
} from "@/lib/command-center-data";
import { profileForPdf } from "@/lib/farmer-profile-storage";
import {
	buildApplicationSummaryPdf,
	buildDeclarationPdf,
	buildDocumentPackPdf,
	buildLeaseContractDraftPdf,
	buildStatementPdf,
	downloadPdfBytes,
} from "@/lib/pdf/generate-documents";

type Lang = "bg" | "en";

const UI: Record<
	Lang,
	{
		pageTitle: string;
		pageSub: string;
		govNote: string;
		sectionDeadlines: string;
		sectionPdf: string;
		pdfFootnote: string;
		pdfDataHint: string;
		generateError: string;
		downloadPack: string;
		downloadDeclaration: string;
		downloadApplication: string;
		downloadContract: string;
		downloadStatement: string;
	}
> = {
	bg: {
		pageTitle: "Твоите срокове",
		pageSub:
			"Ключови дати по кампанията (единно заявление, късно подаване, евентуални аванси). Датите не са правно обвързващи — сверявай с актуална заповед, ИСУН и dfz.bg.",
		govNote:
			"Ориентировъчни срокове за кампания 2026 (пример: без закъснение до средата на май). Черновите PDF ползват данни от /profile (стопанство) и при наличие — от предишни локални попълвания.",
		sectionDeadlines: "До кога",
		sectionPdf: "Чернови PDF",
		pdfFootnote:
			"Това са работни чернови — не са официални бланки на ДФЗ. Подаване през ИСУН с КЕП.",
		pdfDataHint:
			"Ако в PDF липсват име, стопанство или регион, попълни „Профил на стопанството“ (/profile).",
		generateError: "Неуспешно генериране на PDF (мрежа или шрифт). Опитай отново.",
		downloadPack: "Пълен пакет (всички PDF)",
		downloadDeclaration: "Декларация — чернова",
		downloadApplication: "Обобщение заявление",
		downloadContract: "Договор аренда — чернова",
		downloadStatement: "Справка — чернова",
	},
	en: {
		pageTitle: "Your deadlines",
		pageSub:
			"Key campaign dates (single application, late window, possible advances). Indicative only — confirm in ISUN and on dfz.bg.",
		govNote:
			"Indicative 2026 dates (e.g. mid‑May standard window). Draft PDFs merge /profile (farm) data with any saved local fields.",
		sectionDeadlines: "Due dates",
		sectionPdf: "Draft PDFs",
		pdfFootnote:
			"Working drafts — not official DAFS forms. File through ISUN with a qualified e-signature.",
		pdfDataHint:
			"If the PDF is missing name, farm or region, fill in Farm profile (/profile).",
		generateError: "Could not generate PDF (network or font). Try again.",
		downloadPack: "Full pack (all PDFs)",
		downloadDeclaration: "Declaration draft",
		downloadApplication: "Application summary",
		downloadContract: "Lease draft",
		downloadStatement: "Statement draft",
	},
};

type Props = { lang?: Lang };

export function FarmerCommandPanel({ lang = "bg" }: Props) {
	const tr = UI[lang];
	const L = lang;

	const [pdfBusy, setPdfBusy] = useState<string | null>(null);
	const [pdfErr, setPdfErr] = useState<string | null>(null);

	const deadlines = useMemo(() => getActiveDeadlines(), []);

	const runPdf = useCallback(
		async (kind: "declaration" | "application" | "lease" | "statement" | "pack") => {
			setPdfErr(null);
			setPdfBusy(kind);
			const p = profileForPdf();
			const buildOnce = async (): Promise<{ bytes: Uint8Array; name: string }> => {
				if (kind === "declaration") {
					return { bytes: await buildDeclarationPdf(p), name: "agrinexus-deklaratsiya-chernova.pdf" };
				}
				if (kind === "application") {
					return {
						bytes: await buildApplicationSummaryPdf(p),
						name: "agrinexus-zayavlenie-obobshtenie.pdf",
					};
				}
				if (kind === "lease") {
					return {
						bytes: await buildLeaseContractDraftPdf(p),
						name: "agrinexus-dogovor-arenda-chernova.pdf",
					};
				}
				if (kind === "statement") {
					return { bytes: await buildStatementPdf(p), name: "agrinexus-spravka.pdf" };
				}
				return { bytes: await buildDocumentPackPdf(p), name: "agrinexus-paket-dokumenti.pdf" };
			};
			try {
				let lastErr: unknown;
				for (let attempt = 0; attempt < 2; attempt += 1) {
					try {
						const { bytes, name } = await buildOnce();
						downloadPdfBytes(bytes, name);
						return;
					} catch (e) {
						lastErr = e;
						if (attempt === 0) await new Promise<void>(r => setTimeout(r, 600));
					}
				}
				throw lastErr;
			} catch {
				setPdfErr(tr.generateError);
			} finally {
				setPdfBusy(null);
			}
		},
		[tr.generateError],
	);

	return (
		<div className="rounded-2xl border border-teal-200/80 dark:border-teal-800/50 bg-white dark:bg-stone-900/95 p-5 sm:p-6 shadow-sm space-y-6">
			<div>
				<h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50">{tr.pageTitle}</h1>
				<p className="text-sm text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">{tr.pageSub}</p>
				<p className="text-xs text-stone-500 dark:text-stone-500 mt-2">{tr.govNote}</p>
			</div>

			<section>
				<h2 className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
					<CalendarClock size={16} aria-hidden />
					{tr.sectionDeadlines}
				</h2>
				<ul className="space-y-3 text-sm text-stone-800 dark:text-stone-200 list-disc pl-5">
					{deadlines.map((d: CommandDeadline) => (
						<li key={d.id}>
							<strong>{formatDeadlineHeadline(d, L)}</strong>
							<div className="text-stone-600 dark:text-stone-400 mt-1 text-[13px] leading-relaxed">
								{line(L, d.action)}
							</div>
							<div className="text-stone-500 dark:text-stone-500 mt-1 text-xs leading-relaxed">
								{line(L, d.sourceNote)}
							</div>
						</li>
					))}
				</ul>
			</section>

			<section>
				<h2 className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400 mb-3">
					{tr.sectionPdf}
				</h2>
				<p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-2">{tr.pdfFootnote}</p>
				<p className="text-xs text-stone-500 dark:text-stone-500 leading-relaxed mb-3">{tr.pdfDataHint}</p>
				{pdfErr ? (
					<p className="text-sm text-red-600 dark:text-red-400 mb-3">{pdfErr}</p>
				) : null}
				<div className="flex flex-wrap gap-2">
					<PdfBtn label={tr.downloadPack} busy={pdfBusy === "pack"} onClick={() => void runPdf("pack")} />
					<PdfBtn
						label={tr.downloadDeclaration}
						busy={pdfBusy === "declaration"}
						onClick={() => void runPdf("declaration")}
					/>
					<PdfBtn
						label={tr.downloadApplication}
						busy={pdfBusy === "application"}
						onClick={() => void runPdf("application")}
					/>
					<PdfBtn label={tr.downloadContract} busy={pdfBusy === "lease"} onClick={() => void runPdf("lease")} />
					<PdfBtn
						label={tr.downloadStatement}
						busy={pdfBusy === "statement"}
						onClick={() => void runPdf("statement")}
					/>
				</div>
			</section>
		</div>
	);
}

function PdfBtn({
	label,
	busy,
	onClick,
}: {
	label: string;
	busy: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			disabled={busy}
			onClick={onClick}
			className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-60 disabled:pointer-events-none transition">
			{busy ? (
				<Loader2 className="animate-spin shrink-0" size={16} aria-hidden />
			) : (
				<FileDown size={16} className="shrink-0 text-[#0d9488]" aria-hidden />
			)}
			{label}
		</button>
	);
}
