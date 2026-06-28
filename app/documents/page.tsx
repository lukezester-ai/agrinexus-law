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
			<div className="mb-8 text-center">
				<div className="mb-3 text-4xl" aria-hidden>
					📂
				</div>
				<h1 className="font-display text-2xl font-medium tracking-tight text-slate-950 dark:text-white">
					Архив и лични файлове
				</h1>
				<p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
					<strong className="text-slate-900 dark:text-white">Държавен архив</strong> — документи от ДФЗ, МЗХ и ingest pipeline (Supabase).
					<strong className="text-slate-900 dark:text-white"> Лични файлове</strong> — само в този браузър (IndexedDB).
				</p>
			</div>

			<section className="surface-card mb-8 space-y-4 p-6">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
						<Archive size={20} className="text-teal-600" aria-hidden />
						Държавен архив
					</h2>
					<button
						type="button"
						onClick={() => void refreshArchive()}
						disabled={loadingArchive}
						className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50 dark:text-emerald-300"
					>
						Обнови
					</button>
				</div>
				<p className="text-xs text-slate-500 dark:text-slate-400">
					Попълва се автоматично от Document Archive Agent (cron ingest от dfz.bg, mzh.government.bg).
				</p>

				{archiveError && (
					<div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
						{archiveError}
					</div>
				)}

				{loadingArchive ? (
					<p className="py-6 text-center text-sm text-slate-500">Зареждане на архива…</p>
				) : archiveItems.length === 0 ? (
					<div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
						<FileText className="mx-auto mb-2 opacity-50" size={32} aria-hidden />
						<p>Архивът е празен или Supabase не е конфигуриран.</p>
						<p className="mt-1 text-xs">Админ: пусни ingest cron или POST /api/ingest/run с archiveAgent.</p>
					</div>
				) : (
					<ul className="divide-y divide-slate-200 dark:divide-slate-700">
						{archiveItems.map((item) => (
							<li key={item.id} className="flex flex-wrap items-center gap-3 justify-between py-3">
								<div className="min-w-0 flex-1">
									<Link
										href={`/doc/${PUBLIC_DOC_ID_PREFIX}${item.id}`}
										className="block truncate text-sm font-medium text-teal-800 hover:underline dark:text-teal-300"
										title={item.title}
									>
										{item.title}
									</Link>
									<p className="text-xs text-slate-500 dark:text-slate-400">
										{item.institution} · {item.category} ·{" "}
										{DOC_TYPE_LABELS[item.doc_type] ?? item.doc_type}
										{item.effective_date
											? ` · ${item.effective_date.slice(0, 10)}`
											: ""}
									</p>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									{item.source_url?.startsWith("http") ? (
										<a
											href={item.source_url}
											target="_blank"
											rel="noopener noreferrer"
											className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
											title="Оригинал"
										>
											<ExternalLink size={16} aria-hidden />
										</a>
									) : null}
									<a
										href={`/api/documents/${PUBLIC_DOC_ID_PREFIX}${item.id}/download`}
										className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
										title="Отвори / изтегли"
									>
										<Download size={16} aria-hidden />
									</a>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="surface-card space-y-4 p-6">
				<h2 className="text-lg font-semibold text-slate-900 dark:text-white">Мои файлове (локално)</h2>
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
					className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:bg-teal-50/50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-teal-950/30"
				>
					<Upload size={18} aria-hidden />
					{busy ? "Обработка…" : "Избери файлове за добавяне"}
				</button>

				<p className="text-center text-xs text-slate-500 dark:text-slate-400">
					До {MAX_FARMER_DOC_BYTES / (1024 * 1024)} MB · PDF, изображения, Word/Excel, TXT · без качване на сървъра
				</p>

				{error && (
					<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
						{error}
					</div>
				)}

				{loadingLocal ? (
					<p className="py-6 text-center text-sm text-slate-500">Зареждане…</p>
				) : localItems.length === 0 ? (
					<div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
						<p>Няма локално записани файлове.</p>
					</div>
				) : (
					<ul className="divide-y divide-slate-200 dark:divide-slate-700">
						{localItems.map((meta) => (
							<li key={meta.id} className="flex flex-wrap items-center gap-3 justify-between py-3">
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100" title={meta.name}>
										{meta.name}
									</p>
									<p className="text-xs text-slate-500 dark:text-slate-400">
										{formatDocSize(meta.size)} · {new Date(meta.createdAt).toLocaleString("bg-BG")}
									</p>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<button
										type="button"
										disabled={busy}
										onClick={() => void onDownload(meta)}
										className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
										title="Изтегли"
									>
										<Download size={16} aria-hidden />
									</button>
									<button
										type="button"
										disabled={busy}
										onClick={() => void onDelete(meta)}
										className="rounded-lg border border-slate-200 p-2 text-red-700 hover:bg-red-50 dark:border-slate-600 dark:text-red-300 dark:hover:bg-red-950/40"
										title="Изтрий"
									>
										<Trash2 size={16} aria-hidden />
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
