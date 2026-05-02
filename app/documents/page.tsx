"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Trash2, Upload } from "lucide-react";
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
import {
	deleteCloudFarmerDocument,
	getCloudDocumentSignedUrl,
	listCloudFarmerDocuments,
	uploadCloudFarmerDocument,
	type CloudFarmerDocRow,
} from "@/lib/farmer-docs-supabase";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";

type DocItem =
	| { source: "local"; meta: StoredFarmerDocMeta }
	| { source: "cloud"; row: CloudFarmerDocRow };

export default function DocumentsPage() {
	const auth = useAuthUser();
	const inputRef = useRef<HTMLInputElement>(null);
	const [items, setItems] = useState<DocItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const userId = auth.status === "signed_in" ? auth.user.id : null;

	const refresh = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const supabase = createBrowserSupabaseClient();
			if (auth.status === "signed_in" && supabase && userId) {
				const rows = await listCloudFarmerDocuments(supabase);
				setItems(rows.map((row) => ({ source: "cloud", row })));
			} else {
				const list = await listFarmerDocuments();
				setItems(list.map((meta) => ({ source: "local", meta })));
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Неуспешно зареждане.");
			setItems([]);
		} finally {
			setLoading(false);
		}
	}, [auth.status, userId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const supabaseLive =
		auth.status === "signed_in" ? createBrowserSupabaseClient() : null;
	const cloudActive = auth.status === "signed_in" && Boolean(supabaseLive);

	const onPickFiles = async (files: FileList | null) => {
		if (!files?.length) return;
		setBusy(true);
		setError(null);

		const supabase = createBrowserSupabaseClient();

		try {
			if (auth.status === "signed_in" && supabase && userId) {
				for (let i = 0; i < files.length; i++) {
					const file = files[i];
					if (!isAllowedFarmerDoc(file)) {
						setError(
							`Файлът „${file.name}“ е твърде голям или неподдържан. Макс. ${MAX_FARMER_DOC_BYTES / (1024 * 1024)} MB.`,
						);
						continue;
					}
					await uploadCloudFarmerDocument(supabase, userId, file);
				}
			} else {
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
			}
			await refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Грешка при запис.");
		} finally {
			setBusy(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	const onDownload = async (item: DocItem) => {
		if (item.source === "local") {
			const blob = await getFarmerDocumentBlob(item.meta.id);
			if (!blob) {
				setError("Файлът не е намерен.");
				return;
			}
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = item.meta.name;
			a.click();
			URL.revokeObjectURL(url);
			return;
		}

		const supabase = createBrowserSupabaseClient();
		if (!supabase) return;
		try {
			const url = await getCloudDocumentSignedUrl(supabase, item.row.storage_path);
			const a = document.createElement("a");
			a.href = url;
			a.download = item.row.filename;
			a.rel = "noopener noreferrer";
			a.target = "_blank";
			a.click();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Неуспешно изтегляне.");
		}
	};

	const onDelete = async (item: DocItem) => {
		const label = item.source === "local" ? item.meta.name : item.row.filename;
		if (!confirm(`Да се изтрие ли „${label}“?`)) return;
		setBusy(true);
		try {
			if (item.source === "local") {
				await deleteFarmerDocument(item.meta.id);
			} else {
				const supabase = createBrowserSupabaseClient();
				if (!supabase) throw new Error("Няма връзка със Supabase.");
				await deleteCloudFarmerDocument(supabase, item.row);
			}
			await refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Изтриването не успя.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="min-h-screen agri-page-bg">
			<nav className="sticky top-0 z-20 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-teal-100/80 dark:border-stone-800 shadow-sm">
				<div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
					<Link
						href="/profile"
						className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white shrink-0">
						<ArrowLeft size={16} />
						<span className="text-sm">Профил</span>
					</Link>
					<div className="font-medium text-base dark:text-stone-100 text-center truncate">
						Мои документи
					</div>
					<Link
						href="/"
						className="text-sm text-stone-600 dark:text-teal-300/90 hover:text-stone-900 shrink-0">
						Начало
					</Link>
				</div>
			</nav>

			<div className="max-w-2xl mx-auto px-6 py-10">
				<div className="text-center mb-8">
					<div className="text-4xl mb-3">📂</div>
					<h1 className="text-2xl font-medium mb-2 dark:text-stone-50">
						Твоите файлове от ДФЗ и др.
					</h1>
					<p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed max-w-lg mx-auto">
						{cloudActive ? (
							<>
								Влязъл си с акаунт — файловете се записват в{" "}
								<strong className="text-stone-800 dark:text-stone-200">
									твоя личен контейнер в Supabase
								</strong>{" "}
								и са достъпни от всеки браузър, където ползваш същия имейл.
							</>
						) : (
							<>
								Файловете остават{" "}
								<strong className="text-stone-800 dark:text-stone-200">
									само в този браузер
								</strong>
								. За облак и синхрон по акаунт:{" "}
								<Link href="/vhod" className="text-[#0d9488] dark:text-teal-400 font-medium underline">
									вход с имейл
								</Link>
								.
							</>
						)}
					</p>
				</div>

				<div className="bg-white dark:bg-stone-900/95 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 space-y-4">
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
						className="w-full py-4 px-4 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-200 hover:border-[#0d9488] hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition flex items-center justify-center gap-2 disabled:opacity-50">
						<Upload size={18} aria-hidden />
						{busy ? "Обработка…" : "Избери файлове за добавяне"}
					</button>

					<p className="text-xs text-stone-500 dark:text-stone-400 text-center">
						До {MAX_FARMER_DOC_BYTES / (1024 * 1024)} MB на файл · PDF, изображения, Word/Excel, TXT
					</p>

					{error && (
						<div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-800 dark:text-red-200">
							{error}
						</div>
					)}

					{loading ? (
						<p className="text-center text-sm text-stone-500 py-6">Зареждане…</p>
					) : items.length === 0 ? (
						<div className="text-center py-10 text-stone-500 dark:text-stone-400 text-sm">
							<FileText className="mx-auto mb-2 opacity-50" size={32} aria-hidden />
							<p>Все още няма записани документи.</p>
						</div>
					) : (
						<ul className="divide-y divide-stone-200 dark:divide-stone-700">
							{items.map((item) => {
								const id = item.source === "local" ? item.meta.id : item.row.id;
								const name =
									item.source === "local" ? item.meta.name : item.row.filename;
								const size =
									item.source === "local" ? item.meta.size : item.row.byte_size;
								const createdAt =
									item.source === "local"
										? item.meta.createdAt
										: new Date(item.row.created_at).getTime();

								return (
									<li
										key={id}
										className="py-3 flex flex-wrap items-center gap-3 justify-between">
										<div className="min-w-0 flex-1">
											<p
												className="font-medium text-sm text-stone-900 dark:text-stone-100 truncate"
												title={name}>
												{name}
											</p>
											<p className="text-xs text-stone-500 dark:text-stone-400">
												{formatDocSize(size)} ·{" "}
												{new Date(createdAt).toLocaleString("bg-BG")}
												{item.source === "cloud" && (
													<span className="ml-1 text-teal-700 dark:text-teal-400">
														· облак
													</span>
												)}
											</p>
										</div>
										<div className="flex items-center gap-2 shrink-0">
											<button
												type="button"
												disabled={busy}
												onClick={() => void onDownload(item)}
												className="p-2 rounded-lg border border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200"
												title="Изтегли">
												<Download size={16} aria-hidden />
											</button>
											<button
												type="button"
												disabled={busy}
												onClick={() => void onDelete(item)}
												className="p-2 rounded-lg border border-stone-200 dark:border-stone-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-700 dark:text-red-300"
												title="Изтрий">
												<Trash2 size={16} aria-hidden />
											</button>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</div>

				<p className="text-xs text-stone-500 dark:text-stone-500 text-center mt-6 max-w-md mx-auto leading-relaxed">
					За облачни документи трябват таблица и bucket „farmer-docs“ в Supabase — виж{" "}
					<code className="text-[11px] bg-stone-100 dark:bg-stone-800 px-1 rounded">
						supabase-setup.sql
					</code>
					.
				</p>
			</div>
		</div>
	);
}
