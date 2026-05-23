"use client";

const CONSENT_KEY = "agrinexus-cookie-consent";
const CONSENT_COOKIE = "agrinexus_cookie_consent";

export function CookiePreferencesButton() {
	const onClick = () => {
		try {
			localStorage.removeItem(CONSENT_KEY);
		} catch {
			// ignore
		}
		document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
		window.dispatchEvent(new CustomEvent("agrinexus:cookie-consent-open"));
	};

	return (
		<button
			type="button"
			onClick={onClick}
			className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800/70">
			Промени cookie предпочитания
		</button>
	);
}
