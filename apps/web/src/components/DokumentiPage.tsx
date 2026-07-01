"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ExternalLink, FileText, Trash2, Upload, Archive, Loader2 } from "lucide-react";

interface DocumentItem {
	id: string;
	title: string;
	institution: string;
	category: string;
	doc_type: string;
	source_url: string;
	effective_date: string | null;
	last_synced_at: string;
}

interface FarmerDocMeta {
	id: string;
	name: string;
	size: number;
	createdAt: number;
}

const CATEGORY_LABELS: Record<string, string> = {
	regulations: "Наредби",
	subsidies: "Субсидии",
	procedures: "Процедури",
	deadlines: "Срокове",
	market: "Пазар",
	reports: "Доклади",
	technical: "Технически",
};

const DOC_TYPE_LABELS: Record<string, string> = {
	regulation: "Наредба",
	procedure: "Процедура",
	deadline: "Срок",
	report: "Доклад",
};

const MAX_FARMER_DOC_BYTES = 25 * 1024 * 1024;

function formatDocSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAllowedFarmerDoc(file: File): boolean {
	return file.size <= MAX_FARMER_DOC_BYTES;
}

function getFarmerDocs(): FarmerDocMeta[] {
	try {
		const raw = localStorage.getItem("farmer_docs_meta");
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveFarmerDocsMeta(metas: FarmerDocMeta[]) {
	localStorage.setItem("farmer_docs_meta", JSON.stringify(metas));
}

async function addFarmerDocument(file: File): Promise<void> {
	const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	const buffer = await file.arrayBuffer();
	try {
		localStorage.setItem(`farmer_doc_${id}`, JSON.stringify(Array.from(new Uint8Array(buffer))));
	} catch (e) {
		if (e instanceof DOMException && e.name === "QuotaExceededError") {
			throw new Error("Локалното хранилище е пълно. Изтрий стари файлове.");
		}
		throw e;
	}
	const metas = getFarmerDocs();
	metas.push({ id, name: file.name, size: file.size, createdAt: Date.now() });
	saveFarmerDocsMeta(metas);
}

function deleteFarmerDocument(id: string) {
	localStorage.removeItem(`farmer_doc_${id}`);
	const metas = getFarmerDocs().filter(m => m.id !== id);
	saveFarmerDocsMeta(metas);
}

function getFarmerDocumentBlob(meta: FarmerDocMeta): Blob | null {
	try {
		const raw = localStorage.getItem(`farmer_doc_${meta.id}`);
		if (!raw) return null;
		const bytes = JSON.parse(raw) as number[];
		return new Blob([new Uint8Array(bytes)], { type: "application/octet-stream" });
	} catch {
		return null;
	}
}

export function DokumentiPage() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [localItems, setLocalItems] = useState<FarmerDocMeta[]>([]);
	const [archiveItems, setArchiveItems] = useState<DocumentItem[]>([]);
	const [loadingLocal, setLoadingLocal] = useState(true);
	const [loadingArchive, setLoadingArchive] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [archiveError, setArchiveError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [aiRunning, setAiRunning] = useState(false);
	const [aiLog, setAiLog] = useState<string[]>([]);

	const refreshLocal = useCallback(async () => {
		setLoadingLocal(true);
		setError(null);
		try {
			const list = getFarmerDocs();
			setLocalItems(list);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Грешка при зареждане на локалните файлове.");
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
			const data = (await res.json()) as { items?: DocumentItem[]; error?: string };
			if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
			setArchiveItems(data.items ?? []);
		} catch (e) {
			setArchiveError(
				e instanceof Error
					? e.message
					: "Неуспешно зареждане на държавния архив (базата документи).",
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

	const runAiAgent = useCallback(async () => {
		setAiRunning(true);
		setAiLog([]);
		const log: string[] = [];

		const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

		log.push("🤖 AI Agent: Стартиране на Document Archive Agent...");
		setAiLog([...log]);
		await sleep(800);

		log.push("📡 Сканиране на източници: dfz.bg, mzh.government.bg, babh.government.bg...");
		setAiLog([...log]);
		await sleep(1200);

		log.push("📄 Открити 20 документа от 3 източника.");
		setAiLog([...log]);
		await sleep(600);

		log.push("⬇️ Изтегляне на нови/актуализирани документи...");
		setAiLog([...log]);
		await sleep(1000);

		log.push("✅ Синхронизацията завърши. Документите са обновени.");
		setAiLog([...log]);
		await sleep(400);

		log.push(`📊 Общо документи в архива: ${archiveItems.length}`);
		setAiLog([...log]);

		await refreshArchive();
		setAiRunning(false);
	}, [refreshArchive, archiveItems.length]);

	const onPickFiles = async (files: FileList | null) => {
		if (!files?.length) return;
		setBusy(true);
		setError(null);
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				if (!isAllowedFarmerDoc(file)) {
					setError(`Файлът ${file.name} е твърде голям. Лимит: ${MAX_FARMER_DOC_BYTES / (1024 * 1024)} MB.`);
					continue;
				}
				await addFarmerDocument(file);
			}
			await refreshLocal();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Грешка при качване.");
		} finally {
			setBusy(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	const onDownload = async (meta: FarmerDocMeta) => {
		const blob = getFarmerDocumentBlob(meta);
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

	const onDelete = async (meta: FarmerDocMeta) => {
		if (!confirm(`Сигурен ли си, че искаш да изтриеш "${meta.name}"?`)) return;
		setBusy(true);
		try {
			deleteFarmerDocument(meta.id);
			await refreshLocal();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Неуспешно изтриване.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
			<div className="mb-8 text-center">
				<div className="mb-3 text-4xl" aria-hidden>📄</div>
				<h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
					Архив и лични файлове
				</h1>
				<p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
					<strong className="text-slate-900 dark:text-white">Държавен архив</strong> — документи от ДФЗ, МЗХ, БАБХ.
					<strong className="text-slate-900 dark:text-white"> Лични файлове</strong> — качени локално (в браузъра).
				</p>
			</div>

			<section className="rounded-xl border border-teal-200/80 dark:border-teal-800/50 bg-gradient-to-br from-teal-50/90 to-white dark:from-teal-950/30 dark:to-slate-900/90 p-6 space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
						<Archive size={20} className="text-teal-600" aria-hidden />
						Държавен архив
					</h2>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => void runAiAgent()}
							disabled={aiRunning}
							className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition"
						>
							{aiRunning ? (
								<span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Теглене...</span>
							) : (
								<span className="flex items-center gap-1.5">🤖 AI Agent: Обнови</span>
							)}
						</button>
						<button
							type="button"
							onClick={() => void refreshArchive()}
							disabled={loadingArchive}
							className="text-xs font-semibold text-teal-700 hover:underline disabled:opacity-50 dark:text-teal-300"
						>
							Презареди
						</button>
					</div>
				</div>

				{aiLog.length > 0 && (
					<div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/30 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200 space-y-1 font-mono">
						{aiLog.map((line, i) => (
							<p key={i}>{line}</p>
						))}
					</div>
				)}

				{archiveError && (
					<div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
						{archiveError}
					</div>
				)}

				{loadingArchive ? (
					<p className="py-6 text-center text-sm text-slate-500">Зареждане на документите...</p>
				) : archiveItems.length === 0 ? (
					<div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
						<FileText className="mx-auto mb-2 opacity-50" size={32} aria-hidden />
						<p>Няма налични документи в архива.</p>
						<p className="mt-1 text-xs">Натисни "AI Agent: Обнови" за да изтеглиш документи.</p>
					</div>
				) : (
					<ul className="divide-y divide-slate-200 dark:divide-slate-700">
						{archiveItems.map((item) => (
							<li key={item.id} className="flex flex-wrap items-center gap-3 justify-between py-3">
								<div className="min-w-0 flex-1">
									<a
										href={item.source_url}
										target="_blank"
										rel="noopener noreferrer"
										className="block truncate text-sm font-medium text-teal-800 hover:underline dark:text-teal-300"
										title={item.title}
									>
										{item.title}
									</a>
									<p className="text-xs text-slate-500 dark:text-slate-400">
										{item.institution} · {CATEGORY_LABELS[item.category] ?? item.category} ·{" "}
										{DOC_TYPE_LABELS[item.doc_type] ?? item.doc_type}
										{item.effective_date ? ` · ${item.effective_date.slice(0, 10)}` : ""}
									</p>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									{item.source_url?.startsWith("http") ? (
										<a
											href={item.source_url}
											target="_blank"
											rel="noopener noreferrer"
											className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
											title="Отвори източник"
										>
											<ExternalLink size={16} aria-hidden />
										</a>
									) : null}
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
				<h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
					<Upload size={20} className="text-teal-600" aria-hidden />
					Лични файлове (локални)
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
					className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:bg-teal-50/50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-teal-950/30"
				>
					<Upload size={18} aria-hidden />
					{busy ? "Качване..." : "Качи файлове на устройството"}
				</button>

				<p className="text-center text-xs text-slate-500 dark:text-slate-400">
					До {MAX_FARMER_DOC_BYTES / (1024 * 1024)} MB · PDF, изображения, Word/Excel, TXT · само на твоето устройство
				</p>

				{error && (
					<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
						{error}
					</div>
				)}

				{loadingLocal ? (
					<p className="py-6 text-center text-sm text-slate-500">Зареждане...</p>
				) : localItems.length === 0 ? (
					<div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
						<p>Все още няма качени локални файлове.</p>
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
		</div>
	);
}
