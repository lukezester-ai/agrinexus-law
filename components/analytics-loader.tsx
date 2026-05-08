"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Analytics = dynamic(() => import("@vercel/analytics/react").then(m => m.Analytics), {
	ssr: false,
});

const CONSENT_KEY = "agrinexus-cookie-consent";

export function AnalyticsLoader() {
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		const readConsent = () => {
			try {
				setEnabled(localStorage.getItem(CONSENT_KEY) === "accepted");
			} catch {
				setEnabled(false);
			}
		};

		readConsent();
		const onConsent = () => readConsent();
		window.addEventListener("agrinexus:cookie-consent", onConsent as EventListener);
		return () => {
			window.removeEventListener("agrinexus:cookie-consent", onConsent as EventListener);
		};
	}, []);

	if (!enabled) return null;
	return <Analytics />;
}
