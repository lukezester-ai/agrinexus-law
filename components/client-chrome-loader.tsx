"use client";

import dynamic from "next/dynamic";

const ClientChrome = dynamic(
	() => import("@/components/client-chrome").then((mod) => mod.ClientChrome),
	{ ssr: false },
);

export function ClientChromeLoader() {
	return <ClientChrome />;
}
