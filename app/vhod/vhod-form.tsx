"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";

export function VhodForm() {
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirect") || "/moya-ferma";
	const configError = searchParams.get("error") === "config";

	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
		"idle",
	);
	const [message, setMessage] = useState<string | null>(null);

	const configured = isSupabaseAuthConfigured();

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || !configured) return;
		const normalized = email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
			setStatus("error");
			setMessage("Моля, въведи валиден имейл адрес.");
			return;
		}

		setStatus("sending");
		setMessage(null);

		try {
			const res = await fetch("/api/auth/magic-link", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					email: normalized,
					redirectTo,
				}),
			});
			const payload = (await res.json().catch(() => ({}))) as {
				error?: string;
			};

			if (!res.ok) {
				setStatus("error");
				setMessage(payload.error || "Неуспешно изпращане. Опитай пак.");
				return;
			}

			setStatus("sent");
			setMessage(
				"Изпратихме връзка на имейла ти. Няма парола — отвори писмото и потвърди входа. При първи достъп акаунтът се създава автоматично.",
			);
		} catch {
			setStatus("error");
			setMessage("Мрежова грешка. Провери връзката и опитай отново.");
		}
	};

	return (
		<div className="min-h-screen agri-page-bg">
			<nav className="sticky top-0 z-20 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-teal-100/80 dark:border-stone-800">
				<div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
					<Link
						href="/"
						className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white text-sm">
						<ArrowLeft size={16} aria-hidden />
						Начало
					</Link>
					<span className="text-sm font-medium text-stone-800 dark:text-stone-100">
						„Моя ферма“ — само с имейл
					</span>
				</div>
			</nav>

			<div className="max-w-lg mx-auto px-6 py-12">
				<div className="text-center mb-8">
					<div className="text-4xl mb-3" aria-hidden>
						🌾
					</div>
					<h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-2">
						Достъп до „Моя ферма“ само с имейл
					</h1>
					<p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
						Няма парола и отделна регистрационна форма: въведи имейла си, потвърди
						връзката от пощата си и при първи вход акаунтът се създава автоматично.
					</p>
				</div>

				<div className="bg-white dark:bg-stone-900/95 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-sm space-y-5">
					{configError && (
						<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-lg px-3 py-2">
							Конфигурацията на сървъра е непълна. Добави публичните ключове на
							Supabase в средата за разработка или хостинга.
						</p>
					)}

					{!configured ? (
						<p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
							В тази среда акаунтите не са активни (липсват{" "}
							<code className="text-xs bg-stone-100 dark:bg-stone-800 px-1 rounded">
								NEXT_PUBLIC_SUPABASE_URL
							</code>{" "}
							и{" "}
							<code className="text-xs bg-stone-100 dark:bg-stone-800 px-1 rounded">
								NEXT_PUBLIC_SUPABASE_ANON_KEY
							</code>
							). Ползвай чата и профила локално; входът ще работи след настройка.
						</p>
					) : status === "sent" ? (
						<div className="text-center py-4 space-y-3">
							<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 mx-auto">
								<Mail size={22} aria-hidden />
							</div>
							<p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
								{message}
							</p>
							<button
								type="button"
								onClick={() => {
									setStatus("idle");
									setMessage(null);
								}}
								className="text-sm text-[#0d9488] dark:text-teal-400 font-medium hover:underline">
								Използвай друг имейл
							</button>
						</div>
					) : (
						<form onSubmit={onSubmit} className="space-y-4">
							<div>
								<label
									htmlFor="vhod-email"
									className="block text-sm font-medium text-stone-800 dark:text-stone-100 mb-1.5">
									Имейл за връзка за вход
								</label>
								<input
									id="vhod-email"
									type="email"
									required
									autoComplete="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="name@company.bg"
									className="w-full px-4 py-3 border border-stone-200 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-950/80 dark:text-stone-100 focus:outline-none focus:border-teal-500/60"
								/>
							</div>

							{status === "error" && message && (
								<p className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2">
									{message}
								</p>
							)}

							<button
								type="submit"
								disabled={status === "sending"}
								className="w-full py-3 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60 transition"
								style={{ background: "#0d9488" }}>
								{status === "sending" ? (
									<>
										<Loader2 size={18} className="animate-spin" aria-hidden />
										Изпращане…
									</>
								) : (
									<>
										<Mail size={18} aria-hidden />
										Изпрати връзка за вход
									</>
								)}
							</button>
						</form>
					)}

					<p className="text-xs text-stone-500 dark:text-stone-400 text-center leading-relaxed">
						С вход потвърждаваш, че си запознат с{" "}
						<Link href="/terms" className="underline hover:text-stone-700 dark:hover:text-stone-200">
							условията
						</Link>{" "}
						и{" "}
						<Link href="/privacy" className="underline hover:text-stone-700 dark:hover:text-stone-200">
							поверителността
						</Link>
						.
					</p>
				</div>
			</div>
		</div>
	);
}
