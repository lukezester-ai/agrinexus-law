"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";

function ConditionalLayoutInner({ children }: { children: ReactNode }) {
	const pathname = usePathname() ?? "";
	if (pathname === "/" || pathname === "") return null;
	return <>{children}</>;
}

export function ConditionalLayout({ children }: { children: ReactNode }) {
	return (
		<Suspense fallback={null}>
			<ConditionalLayoutInner>{children}</ConditionalLayoutInner>
		</Suspense>
	);
}
