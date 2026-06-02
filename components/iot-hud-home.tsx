"use client";

import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

type SvgProps = SVGProps<SVGSVGElement>;

function strokeProps(props: SvgProps) {
	return {
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.35,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
		...props,
	};
}

export function HudGlyphSubsidies(props: SvgProps) {
	return (
		<svg viewBox="0 0 40 40" aria-hidden {...strokeProps(props)}>
			<path d="M8 28V14l6-3 6 3v14" />
			<path d="M14 11v17M20 14v14" />
			<path d="M10 28h12M22 22h8l2 6h-8" />
		</svg>
	);
}

export function HudGlyphLaws(props: SvgProps) {
	return (
		<svg viewBox="0 0 40 40" aria-hidden {...strokeProps(props)}>
			<path d="M12 8h16v24H12z" />
			<path d="M16 14h8M16 19h8M16 24h5" />
			<path d="M20 32V36" />
		</svg>
	);
}

export function HudGlyphCerts(props: SvgProps) {
	return (
		<svg viewBox="0 0 40 40" aria-hidden {...strokeProps(props)}>
			<path d="M14 10h12v18H14z" />
			<path d="M20 6v6M17 16h6M17 21h6" />
			<circle cx="20" cy="27" r="2.5" />
		</svg>
	);
}

export function HudGlyphBio(props: SvgProps) {
	return (
		<svg viewBox="0 0 40 40" aria-hidden {...strokeProps(props)}>
			<path d="M20 32V18" />
			<path d="M20 18c-4-6-2-12 0-14 2 2 4 8 0 14" />
			<path d="M20 20c4-7 2-13 0-15-2 2-4 8 0 15" />
			<path d="M14 32h12" />
		</svg>
	);
}

export function HudGlyphPlantProtection(props: SvgProps) {
	return (
		<svg viewBox="0 0 40 40" aria-hidden {...strokeProps(props)}>
			<path d="M20 8l-9 6v12l9 6 9-6V14z" />
			<path d="M20 8v26" />
			<path d="M11 14l9 6 9-6" />
			<path d="M16 22l4 3 4-3" />
		</svg>
	);
}

export function HudGlyphEu(props: SvgProps) {
	return (
		<svg viewBox="0 0 40 40" aria-hidden {...strokeProps(props)}>
			<circle cx="20" cy="20" r="12" />
			{[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
				<line
					key={deg}
					x1="20"
					y1="9"
					x2="20"
					y2="12"
					transform={`rotate(${deg} 20 20)`}
				/>
			))}
			<path d="M16 22h8M20 18v8" />
		</svg>
	);
}

export function HudGlyphForms(props: SvgProps) {
	return (
		<svg viewBox="0 0 40 40" aria-hidden {...strokeProps(props)}>
			<path d="M10 12h14v20H10z" />
			<path d="M14 8h14v20" />
			<path d="M14 18h10M14 23h10M14 28h6" />
		</svg>
	);
}

export function HudGlyphCalc(props: SvgProps) {
	return (
		<svg viewBox="0 0 40 40" aria-hidden {...strokeProps(props)}>
			<rect x="9" y="8" width="22" height="24" rx="2" />
			<rect x="12" y="11" width="16" height="6" rx="1" />
			<path d="M13 22h4M13 27h4M13 32h10M23 22h4M23 27h4M28 22h4M28 27h4" />
		</svg>
	);
}

export function HudGlyphDatabase(props: SvgProps) {
	return (
		<svg viewBox="0 0 40 40" aria-hidden {...strokeProps(props)}>
			<ellipse cx="20" cy="11" rx="10" ry="4" />
			<path d="M10 11v6c0 2.2 4.5 4 10 4s10-1.8 10-4v-6" />
			<path d="M10 20v6c0 2.2 4.5 4 10 4s10-1.8 10-4v-6" />
		</svg>
	);
}

export function HudGlyphAi(props: SvgProps) {
	return (
		<svg viewBox="0 0 40 40" aria-hidden {...strokeProps(props)}>
			<rect x="11" y="13" width="18" height="14" rx="2" />
			<path d="M16 10v4M24 10v4M20 7v3" />
			<circle cx="16" cy="20" r="1.5" fill="currentColor" stroke="none" />
			<circle cx="24" cy="20" r="1.5" fill="currentColor" stroke="none" />
			<path d="M15 26h10" />
		</svg>
	);
}

export function HudGlyphFocus(props: SvgProps) {
	return (
		<svg viewBox="0 0 40 40" aria-hidden {...strokeProps(props)}>
			<path d="M8 14h4V8M28 8v6h4M32 26h-4v6M12 32v-6H8" />
			<circle cx="20" cy="20" r="7" />
			<path d="M20 17v6M17 20h6" />
		</svg>
	);
}

export function HudGlyphLineTrend(props: SvgProps) {
	return (
		<svg viewBox="0 0 40 40" aria-hidden {...strokeProps(props)}>
			<path d="M8 28h24M8 28V12" />
			<path d="M11 24l6-8 5 4 7-11" />
			<circle cx="29" cy="9" r="2" />
		</svg>
	);
}

function CornerBrackets({ className }: { className?: string }) {
	return (
		<>
			<span
				className={cn(
					"pointer-events-none absolute left-1 top-1 h-2.5 w-2.5 border-l-2 border-t-2 border-cyan-500/60 dark:border-cyan-300/70",
					className,
				)}
			/>
			<span
				className={cn(
					"pointer-events-none absolute right-1 top-1 h-2.5 w-2.5 border-r-2 border-t-2 border-cyan-500/60 dark:border-cyan-300/70",
					className,
				)}
			/>
			<span
				className={cn(
					"pointer-events-none absolute bottom-1 left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-cyan-500/60 dark:border-cyan-300/70",
					className,
				)}
			/>
			<span
				className={cn(
					"pointer-events-none absolute bottom-1 right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-cyan-500/60 dark:border-cyan-300/70",
					className,
				)}
			/>
		</>
	);
}

export function IotHudTile({
	children,
	className,
	onClick,
}: {
	children: ReactNode;
	className?: string;
	onClick?: () => void;
}) {
	const base =
		"relative isolate overflow-hidden rounded-sm border text-left transition-[box-shadow,transform,border-color,background-color] duration-300 " +
		"border-cyan-600/25 bg-white/90 text-cyan-700 shadow-[0_0_0_1px_rgba(6,182,212,0.06),0_12px_32px_-16px_rgba(8,145,178,0.2)] " +
		"dark:border-cyan-400/30 dark:bg-slate-950/80 dark:text-cyan-300 dark:shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_0_40px_-12px_rgba(34,211,238,0.18)]";

	if (onClick) {
		return (
			<button
				type="button"
				onClick={onClick}
				className={cn(
					base,
					"cursor-pointer hover:-translate-y-0.5 hover:border-cyan-500/55 dark:hover:border-cyan-300/50",
					className,
				)}
			>
				<CornerBrackets />
				<div className="relative z-[1]">{children}</div>
			</button>
		);
	}
	return (
		<div className={cn(base, className)}>
			<CornerBrackets />
			<div className="relative z-[1]">{children}</div>
		</div>
	);
}

export const HOME_CATEGORY_GLYPHS = [
	HudGlyphSubsidies,
	HudGlyphLaws,
	HudGlyphCerts,
	HudGlyphBio,
	HudGlyphPlantProtection,
	HudGlyphEu,
	HudGlyphForms,
	HudGlyphCalc,
] as const;
