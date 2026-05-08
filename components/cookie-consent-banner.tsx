"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "agrinexus-cookie-consent";
const CONSENT_COOKIE = "agrinexus_cookie_consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

type ConsentValue = "accepted" | "rejected";

function writeConsent(value: ConsentValue) {
	try {
		localStorage.setItem(CONSENT_KEY, value);
	} catch {
		// ignore
	}
	document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax`;
	window.dispatchEvent(new CustomEvent("agrinexus:cookie-consent", { detail: value }));
}

export function CookieConsentBanner() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const onOpen = () => setVisible(true);
		window.addEventListener("agrinexus:cookie-consent-open", onOpen);
		try {
			const stored = localStorage.getItem(CONSENT_KEY);
			if (stored === "accepted" || stored === "rejected") return;
		} catch {
			// ignore
		}
		setVisible(true);
		return () => {
			window.removeEventListener("agrinexus:cookie-consent-open", onOpen);
		};
	}, []);

	if (!visible) return null;

	return (
		<div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-xl border border-stone-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-stone-700 dark:bg-stone-900/95">
			<p className="text-sm text-stone-700 dark:text-stone-200">
				Използваме технически бисквитки и аналитика за подобрение на услугата.
				Прочети{" "}
				<Link href="/privacy" className="underline">
					Политика за поверителност
				</Link>
				.
			</p>
			<div className="mt-3 flex gap-2">
				<button
					type="button"
					onClick={() => {
						writeConsent("rejected");
						setVisible(false);
					}}
					className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 dark:border-stone-600 dark:text-stone-200">
					Откажи
				</button>
				<button
					type="button"
					onClick={() => {
						writeConsent("accepted");
						setVisible(false);
					}}
					className="rounded-lg bg-[#0d9488] px-3 py-2 text-sm font-medium text-white">
					Приеми
				</button>
			</div>
		</div>
	);
}
