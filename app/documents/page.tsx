"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, ExternalLink, FileText, Trash2, Upload, Archive } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import { PUBLIC_DOC_ID_PREFIX } from "@/lib/knowledge/public-documents-search";
import {
	addFarmerDocument,
	deleteFarmerDocument,
	formatDocSize,
	listFarmerDocuments,
	MAX_FARMER_DOC_BYTES,
	type StoredFarmerDocMeta,
	getFarmerDocumentBlob,
	isAllowedFarmerDoc,
} from "@/lib/farmer-docs-storage";

type PublicArchiveItem = {
	id: string;
	title: string;
	institution: string;
	category: string;
	doc_type: string;
	source_url: string;
	effective_date: string | null;
	last_synced_at: string;
};

const DOC_TYPE_LABELS: Record<string, string> = {
	scheme: "Схема",
	regulation: "Наредба",
	procedure: "Процедура",
	deadline: "Срок",
	pdf: "PDF",
};

export default function DocumentsPage() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [localItems, setLocalItems] = useState<StoredFarmerDocMeta[]>([]);
	const [archiveItems, setArchiveItems] = useState<PublicArchiveItem[]>([]);
	const [loadingLocal, setLoadingLocal] = useState(true);
	const [loadingArchive, setLoadingArchive] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [archiveError, setArchiveError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const refreshLocal = useCallback(async () => {
		setLoadingLocal(true);
		setError(null);
		try {
			const list = await listFarmerDocuments();
			setLocalItems(list);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Неуспешно зареждане.");
			setLocalItems([]);
		} finally {
			setLoadingLocal(false);
		}
	}, []);

	const refreshArchive = useCallback(async () => {
		setLoadingArchive(true);
		setArchiveError(null);
		try {
			const res = await fetch("/api/documents?limit=80");
			const data = (await res.json()) as { items?: PublicArchiveItem[]; error?: string };
			if (!res.ok) {
				throw new Error(data.error ?? `HTTP ${res.status}`);
			}
			setArchiveItems(data.items ?? []);
		} catch (e) {
			setArchiveError(
				e instanceof Error
					? e.message
					: "Архивът не е достъпен (проверете Supabase public_documents).",
			);
			setArchiveItems([]);
		} finally {
			setLoadingArchive(false);
		}
	}, []);

	useEffect(() => {
		void refreshLocal();
		void refreshArchive();
	}, [refreshLocal, refreshArchive]);

	const onPickFiles = async (files: FileList | null) => {
		if (!files?.length) return;
		setBusy(true);
		setError(null);

		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				if (!isAllowedFarmerDoc(file)) {
					setError(
						`Файлът „${file.name}“ е твърде голям или неподдържан. Макс. ${MAX_FARMER_DOC_BYTES / (1024 * 1024)} MB.`,
					);
					continue;
				}
				await addFarmerDocument(file);
			}
			await refreshLocal();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Грешка при запис.");
		} finally {
			setBusy(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	const onDownload = async (meta: StoredFarmerDocMeta) => {
		const blob = await getFarmerDocumentBlob(meta.id);
		if (!blob) {
			setError("Файлът не е намерен.");
			return;
		}
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = meta.name;
		a.click();
		URL.revokeObjectURL(url);
	};

	const onDelete = async (meta: StoredFarmerDocMeta) => {
		if (!confirm(`Да се изтрие ли „${meta.name}“?`)) return;
		setBusy(true);
		try {
			await deleteFarmerDocument(meta.id);
			await refreshLocal();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Изтриването не успя.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<SitePageShell
			maxWidth="2xl"
			subheader={
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Link href="/profile" className="text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
						← Профил
					</Link>
					<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Документи</p>
					<Link href="/search" className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
						Търсене
					</Link>
				</div>
			}
		>
			<div className="mb-10 text-center">
				<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-fuchsia-600 text-4xl shadow-lg shadow-emerald-500/25 animate-float" aria-hidden>
					📂
				</div>
				<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-fuchsia-600">
					Архив и лични файлове
				</h1>
				<p className="mx-auto mt-2.5 max-w-xl text-sm sm:text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300">
					<strong className="text-slate-900 dark:text-white font-bold">Държавен архив</strong> — документи от ДФЗ, МЗХ и нормативни актове.
					<strong className="text-slate-900 dark:text-white font-bold"> Лични файлове</strong> — криптирани и достъпни само в твоя браузър (IndexedDB).
				</p>
			</div>

			<section className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] backdrop-blur-2xl mb-10 space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="flex items-center gap-3 text-xl font-extrabold text-slate-900 dark:text-white">
						<div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-emerald-600 dark:text-emerald-400">
							<Archive size={22} aria-hidden />
						</div>
						<span>Държавен нормативен архив</span>
					</h2>
					<button
						type="button"
						onClick={() => void refreshArchive()}
						disabled={loadingArchive}
						className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 dark:text-emerald-300 shadow-sm"
					>
						Обнови списъка
					</button>
				</div>
				<p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
					💡 Попълва се автоматично от Document Archive Agent (справки в реално време от dfz.bg и mzh.government.bg).
				</p>

				{archiveError && (
					<div className="rounded-2xl border border-amber-300/80 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200 shadow-sm">
						{archiveError}
					</div>
				)}

				{loadingArchive ? (
					<p className="py-10 text-center text-sm font-bold text-slate-500 animate-pulse">Зареждане на държавния архив…</p>
				) : archiveItems.length === 0 ? (
					<div className="py-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
						<FileText className="mx-auto mb-3 opacity-40 text-emerald-600" size={40} aria-hidden />
						<p className="font-bold text-slate-700 dark:text-slate-300">Архивът е празен или Supabase все още не е синхронизиран.</p>
						<p className="mt-1 text-xs">Админ: стартирай ingest cron или POST /api/ingest/run с archiveAgent.</p>
					</div>
				) : (
					<ul className="divide-y divide-slate-200/80 dark:divide-slate-800">
						{archiveItems.map((item) => (
							<li key={item.id} className="flex flex-wrap items-center gap-4 justify-between py-4 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 px-3 rounded-2xl transition-colors">
								<div className="min-w-0 flex-1">
									<Link
										href={`/doc/${PUBLIC_DOC_ID_PREFIX}${item.id}`}
										className="block truncate text-base font-bold text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400 transition-colors"
										title={item.title}
									>
										{item.title}
									</Link>
									<p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
										<span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.institution}</span>
										<span>·</span>
										<span>{item.category}</span>
										<span>·</span>
										<span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5">{DOC_TYPE_LABELS[item.doc_type] ?? item.doc_type}</span>
										{item.effective_date
											? ` · в сила от ${item.effective_date.slice(0, 10)}`
											: ""}
									</p>
								</div>
								<div className="flex shrink-0 items-center gap-2.5">
									{item.source_url?.startsWith("http") ? (
										<a
											href={item.source_url}
											target="_blank"
											rel="noopener noreferrer"
											className="rounded-xl border border-slate-200/90 bg-white p-2.5 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-emerald-400 transition-all shadow-sm"
											title="Отвори оригинал в нов прозорец"
										>
											<ExternalLink size={18} aria-hidden />
										</a>
									) : null}
									<a
										href={`/api/documents/${PUBLIC_DOC_ID_PREFIX}${item.id}/download`}
										className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:text-emerald-300 transition-all shadow-sm"
										title="Изтегли или прегледай"
									>
										<Download size={18} aria-hidden />
									</a>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] backdrop-blur-2xl space-y-6">
				<h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
					<div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-2.5 text-teal-600 dark:text-teal-400">
						<FileText size={22} aria-hidden />
					</div>
					<span>Мои файлове и документи (Локално хранилище)</span>
				</h2>
				<input
					ref={inputRef}
					type="file"
					multiple
					className="hidden"
					accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt"
					disabled={busy}
					onChange={(e) => void onPickFiles(e.target.files)}
				/>
				<button
					type="button"
					disabled={busy}
					onClick={() => inputRef.current?.click()}
					className="card-hover-pro flex flex-col w-full items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 px-6 py-10 text-base font-extrabold text-slate-800 transition-all duration-300 hover:border-emerald-600 hover:bg-emerald-500/10 disabled:opacity-50 dark:text-slate-100 cursor-pointer shadow-sm"
				>
					<div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 animate-bounce">
						<Upload size={26} aria-hidden />
					</div>
					<span className="text-lg">{busy ? "Обработка и криптиране…" : "Качи или прикачи файлове тук"}</span>
					<span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Кликни за избор от компютъра или телефона</span>
				</button>

				<p className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
					До {MAX_FARMER_DOC_BYTES / (1024 * 1024)} MB на файл · Поддържани: PDF, Изображения, Word/Excel, TXT · Съхраняват се сигурно без качване на външни сървъри
				</p>

				{error && (
					<div className="rounded-2xl border border-rose-300/80 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-800 dark:border-rose-900/80 dark:bg-rose-950/60 dark:text-rose-200 shadow-sm">
						{error}
					</div>
				)}

				{loadingLocal ? (
					<p className="py-8 text-center text-sm font-bold text-slate-500 animate-pulse">Зареждане на личните файлове…</p>
				) : localItems.length === 0 ? (
					<div className="py-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
						<p className="font-bold text-slate-700 dark:text-slate-300">Няма локално добавени файлове или договори.</p>
					</div>
				) : (
					<ul className="divide-y divide-slate-200/80 dark:divide-slate-800">
						{localItems.map((meta) => (
							<li key={meta.id} className="flex flex-wrap items-center gap-4 justify-between py-4 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 px-3 rounded-2xl transition-colors">
								<div className="min-w-0 flex-1">
									<p className="truncate text-base font-bold text-slate-900 dark:text-slate-100" title={meta.name}>
										{meta.name}
									</p>
									<p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
										{formatDocSize(meta.size)} · добавен на {new Date(meta.createdAt).toLocaleString("bg-BG")}
									</p>
								</div>
								<div className="flex shrink-0 items-center gap-2.5">
									<button
										type="button"
										disabled={busy}
										onClick={() => void onDownload(meta)}
										className="rounded-xl border border-slate-200/90 bg-white p-2.5 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-emerald-400 transition-all shadow-sm"
										title="Изтегли файл"
									>
										<Download size={18} aria-hidden />
									</button>
									<button
										type="button"
										disabled={busy}
										onClick={() => void onDelete(meta)}
										className="rounded-xl border border-rose-200/90 bg-rose-50/50 p-2.5 text-rose-700 hover:bg-rose-600 hover:text-white dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-700 transition-all shadow-sm"
										title="Изтрий от локалното хранилище"
									>
										<Trash2 size={18} aria-hidden />
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>
		</SitePageShell>
	);
}
