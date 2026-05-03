"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, FileDown, FileWarning, Loader2 } from "lucide-react";
import {
	formatDeadlineHeadline,
	getActiveDeadlines,
	getMissingDocuments,
	getRiskFlags,
	line,
	type CommandDeadline,
} from "@/lib/command-center-data";
import {
	defaultFarmerProfile,
	loadFarmerProfile,
	saveFarmerProfile,
	type FarmerLocalProfile,
} from "@/lib/farmer-profile-storage";
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
		sectionDocs: string;
		sectionRisks: string;
		sectionProfile: string;
		noMissingDocs: string;
		severityHigh: string;
		severityMed: string;
		landCheck: string;
		bankCheck: string;
		organicDeclared: string;
		organicCert: string;
		fullName: string;
		uin: string;
		farmName: string;
		region: string;
		decares: string;
		iban: string;
		sectionPdf: string;
		pdfFootnote: string;
		generateError: string;
		downloadPack: string;
		downloadDeclaration: string;
		downloadApplication: string;
		downloadContract: string;
		downloadStatement: string;
	}
> = {
	bg: {
		pageTitle: "Твоите срокове и документи",
		pageSub:
			"Тук виждаш накуп какво наближава по календар (единно заявление, късно подаване, евентуални аванси), кои документи липсват според попълнените полета и къде има по-висок регулаторен риск. Датите не са правно обвързващи — винаги сверявай с актуална заповед за кампанията, ИСУН и обявленията на ДФЗ.",
		govNote:
			"Ориентировъчни срокове за кампания 2026 (пример: без закъснение до средата на май). Реалният календар се променя всяка година. В долната част можеш да изтеглиш чернови PDF с твоите данни — те улесняват работата с консултант, но не заместват официалните бланки и КЕП в ИСУН.",
		sectionDeadlines: "До кога",
		sectionDocs: "Липсващ документ",
		sectionRisks: "Риск от санкция / проверка",
		sectionProfile: "Профил (ориентир)",
		noMissingDocs: "От този кратък списък няма очевидни липси — пак провери с консултант.",
		severityHigh: "Висок",
		severityMed: "Среден",
		landCheck: "Имам документ за право на ползване на земята",
		bankCheck: "Банкова сметка потвърдена за ДФЗ",
		organicDeclared: "Декларирам био / екосхема",
		organicCert: "Имам валиден био сертификат",
		fullName: "Име и фамилия",
		uin: "ЕГН / ЕИК",
		farmName: "Наименование на стопанство",
		region: "Област / община",
		decares: "Декари (общо)",
		iban: "IBAN",
		sectionPdf: "Чернови PDF",
		pdfFootnote:
			"Това са работни чернови с твоите данни — не са официални бланки на ДФЗ. Подаване през ИСУН с КЕП.",
		generateError: "Неуспешно генериране на PDF (мрежа или шрифт). Опитай отново.",
		downloadPack: "Пълен пакет (всички PDF)",
		downloadDeclaration: "Декларация — чернова",
		downloadApplication: "Обобщение заявление",
		downloadContract: "Договор аренда — чернова",
		downloadStatement: "Справка — чернова",
	},
	en: {
		pageTitle: "Your deadlines & paperwork",
		pageSub:
			"One screen based on your profile. Dates are indicative against common DAFS practice — always confirm in ISUN and on dfz.bg.",
		govNote: "Indicative deadlines (e.g. mid-May campaign window). Production must sync with dfz.bg / ISUN.",
		sectionDeadlines: "Due dates",
		sectionDocs: "Missing document",
		sectionRisks: "Sanction / inspection risk",
		sectionProfile: "Profile (orientation)",
		noMissingDocs: "No obvious gaps from this short checklist — still verify with an adviser.",
		severityHigh: "High",
		severityMed: "Medium",
		landCheck: "I have land use / tenure documentation",
		bankCheck: "Bank account confirmed for DAFS payments",
		organicDeclared: "I declare organic / eco-scheme",
		organicCert: "I have a valid organic certificate",
		fullName: "Full name",
		uin: "Personal / company ID",
		farmName: "Farm name",
		region: "Region / municipality",
		decares: "Total decares",
		iban: "IBAN",
		sectionPdf: "Draft PDFs",
		pdfFootnote:
			"Working drafts from your fields — not official DAFS forms. File through ISUN with a qualified e-signature.",
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

	const [profile, setProfile] = useState<FarmerLocalProfile>(() =>
		typeof window !== "undefined" ? loadFarmerProfile() : defaultFarmerProfile(),
	);
	const [pdfBusy, setPdfBusy] = useState<string | null>(null);
	const [pdfErr, setPdfErr] = useState<string | null>(null);

	useEffect(() => {
		setProfile(loadFarmerProfile());
	}, []);

	useEffect(() => {
		const t = window.setTimeout(() => saveFarmerProfile(profile), 350);
		return () => window.clearTimeout(t);
	}, [profile]);

	const deadlines = useMemo(() => getActiveDeadlines(), []);
	const missing = useMemo(() => getMissingDocuments(profile), [profile]);
	const risks = useMemo(() => getRiskFlags(profile), [profile]);

	const update = (patch: Partial<FarmerLocalProfile>) => {
		setProfile(p => ({ ...p, ...patch }));
	};

	const runPdf = useCallback(
		async (kind: "declaration" | "application" | "lease" | "statement" | "pack") => {
			setPdfErr(null);
			setPdfBusy(kind);
			try {
				let bytes: Uint8Array;
				let name: string;
				if (kind === "declaration") {
					bytes = await buildDeclarationPdf(profile);
					name = "agrinexus-deklaratsiya-chernova.pdf";
				} else if (kind === "application") {
					bytes = await buildApplicationSummaryPdf(profile);
					name = "agrinexus-zayavlenie-obobshtenie.pdf";
				} else if (kind === "lease") {
					bytes = await buildLeaseContractDraftPdf(profile);
					name = "agrinexus-dogovor-arenda-chernova.pdf";
				} else if (kind === "statement") {
					bytes = await buildStatementPdf(profile);
					name = "agrinexus-spravka.pdf";
				} else {
					bytes = await buildDocumentPackPdf(profile);
					name = "agrinexus-paket-dokumenti.pdf";
				}
				downloadPdfBytes(bytes, name);
			} catch {
				setPdfErr(tr.generateError);
			} finally {
				setPdfBusy(null);
			}
		},
		[profile, tr.generateError],
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
				<h2 className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
					<FileWarning size={16} aria-hidden />
					{tr.sectionDocs}
				</h2>
				{missing.length === 0 ? (
					<p className="text-sm text-stone-600 dark:text-stone-400">{tr.noMissingDocs}</p>
				) : (
					<ul className="space-y-3 text-sm list-disc pl-5">
						{missing.map(m => (
							<li key={m.id}>
								<strong className="text-stone-900 dark:text-stone-100">{line(L, m.label)}</strong>
								<div className="text-stone-600 dark:text-stone-400 mt-1 text-[13px]">{line(L, m.hint)}</div>
							</li>
						))}
					</ul>
				)}
			</section>

			<section>
				<h2 className="text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400 mb-3 flex items-center gap-2">
					<AlertTriangle size={16} aria-hidden />
					{tr.sectionRisks}
				</h2>
				<ul className="space-y-3 text-sm list-disc pl-5">
					{risks.map(r => (
						<li key={r.id}>
							<span
								className={`text-[11px] font-bold uppercase mr-2 ${
									r.severity === "high"
										? "text-red-600 dark:text-red-400"
										: "text-stone-500 dark:text-stone-400"
								}`}>
								{r.severity === "high" ? tr.severityHigh : tr.severityMed}
							</span>
							{line(L, r.label)}
						</li>
					))}
				</ul>
			</section>

			<section>
				<h2 className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400 mb-3">
					{tr.sectionProfile}
				</h2>
				<div className="grid sm:grid-cols-2 gap-3 mb-4">
					<input
						className="rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-950 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
						placeholder={tr.fullName}
						value={profile.fullName}
						onChange={e => update({ fullName: e.target.value })}
					/>
					<input
						className="rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-950 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
						placeholder={tr.uin}
						value={profile.uin}
						onChange={e => update({ uin: e.target.value })}
					/>
					<input
						className="rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-950 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
						placeholder={tr.farmName}
						value={profile.farmName}
						onChange={e => update({ farmName: e.target.value })}
					/>
					<input
						className="rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-950 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
						placeholder={tr.region}
						value={profile.region}
						onChange={e => update({ region: e.target.value })}
					/>
					<input
						className="rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-950 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
						placeholder={tr.decares}
						value={profile.decares}
						onChange={e => update({ decares: e.target.value })}
					/>
					<input
						className="rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-950 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
						placeholder={tr.iban}
						value={profile.iban}
						onChange={e => update({ iban: e.target.value })}
					/>
				</div>
				<div className="flex flex-col gap-2 text-sm text-stone-800 dark:text-stone-200">
					<label className="flex gap-2 items-center cursor-pointer">
						<input
							type="checkbox"
							className="rounded border-stone-300 text-[#0d9488] focus:ring-teal-500"
							checked={profile.hasLandRightsDoc}
							onChange={e => update({ hasLandRightsDoc: e.target.checked })}
						/>
						<span>{tr.landCheck}</span>
					</label>
					<label className="flex gap-2 items-center cursor-pointer">
						<input
							type="checkbox"
							className="rounded border-stone-300 text-[#0d9488] focus:ring-teal-500"
							checked={profile.hasBankAccountVerified}
							onChange={e => update({ hasBankAccountVerified: e.target.checked })}
						/>
						<span>{tr.bankCheck}</span>
					</label>
					<label className="flex gap-2 items-center cursor-pointer">
						<input
							type="checkbox"
							className="rounded border-stone-300 text-[#0d9488] focus:ring-teal-500"
							checked={profile.declaresOrganic}
							onChange={e => update({ declaresOrganic: e.target.checked })}
						/>
						<span>{tr.organicDeclared}</span>
					</label>
					<label className="flex gap-2 items-center cursor-pointer">
						<input
							type="checkbox"
							className="rounded border-stone-300 text-[#0d9488] focus:ring-teal-500"
							checked={profile.hasOrganicCertificate}
							onChange={e => update({ hasOrganicCertificate: e.target.checked })}
						/>
						<span>{tr.organicCert}</span>
					</label>
				</div>
			</section>

			<section>
				<h2 className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400 mb-3">
					{tr.sectionPdf}
				</h2>
				<p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-3">{tr.pdfFootnote}</p>
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
