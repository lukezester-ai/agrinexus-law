"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
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

export default function DocumentsPage() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [items, setItems] = useState<StoredFarmerDocMeta[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const refresh = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const list = await listFarmerDocuments();
			setItems(list);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Неуспешно зареждане.");
			setItems([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

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
			await refresh();
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
			await refresh();
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
					<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Мои документи</p>
					<Link href="/" className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
						Начало
					</Link>
				</div>
			}
		>
			<div className="mb-8 text-center">
				<div className="mb-3 text-4xl" aria-hidden>
					📂
				</div>
				<h1 className="font-display text-2xl font-black tracking-tight text-slate-950 dark:text-white">Твоите файлове от ДФЗ и др.</h1>
				<p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
					Файловете се пазят <strong className="text-slate-900 dark:text-white">само в този браузър</strong> (IndexedDB). Не се изисква вход —
					достъпни са веднага на това устройство.
				</p>
			</div>

			<div className="surface-card space-y-4 p-6">
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
						className="w-full py-4 px-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-emerald-600 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition flex items-center justify-center gap-2 disabled:opacity-50">
						<Upload size={18} aria-hidden />
						{busy ? "Обработка…" : "Избери файлове за добавяне"}
					</button>

					<p className="text-xs text-slate-500 dark:text-slate-400 text-center">
						До {MAX_FARMER_DOC_BYTES / (1024 * 1024)} MB на файл · PDF, изображения, Word/Excel, TXT
					</p>

					{error && (
						<div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-800 dark:text-red-200">
							{error}
						</div>
					)}

					{loading ? (
						<p className="text-center text-sm text-slate-500 py-6">Зареждане…</p>
					) : items.length === 0 ? (
						<div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
							<FileText className="mx-auto mb-2 opacity-50" size={32} aria-hidden />
							<p>Все още няма записани документи.</p>
						</div>
					) : (
						<ul className="divide-y divide-slate-200 dark:divide-slate-700">
							{items.map((meta) => (
								<li
									key={meta.id}
									className="py-3 flex flex-wrap items-center gap-3 justify-between">
									<div className="min-w-0 flex-1">
										<p
											className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate"
											title={meta.name}>
											{meta.name}
										</p>
										<p className="text-xs text-slate-500 dark:text-slate-400">
											{formatDocSize(meta.size)} ·{" "}
											{new Date(meta.createdAt).toLocaleString("bg-BG")}
										</p>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<button
											type="button"
											disabled={busy}
											onClick={() => void onDownload(meta)}
											className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
											title="Изтегли">
											<Download size={16} aria-hidden />
										</button>
										<button
											type="button"
											disabled={busy}
											onClick={() => void onDelete(meta)}
											className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-700 dark:text-red-300"
											title="Изтрий">
											<Trash2 size={16} aria-hidden />
										</button>
									</div>
								</li>
							))}
						</ul>
					)}
			</div>
		</SitePageShell>
	);
}
