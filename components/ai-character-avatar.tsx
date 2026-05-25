"use client";

import type { CSSProperties } from "react";
import { CHARACTER_ACCENT, CHARACTERS, type CharacterId } from "@/lib/characters";

type Props = {
	id: CharacterId;
	size?: "sm" | "md" | "lg";
	/** Активен избор в селектор */
	selected?: boolean;
	className?: string;
};

const sizeClass: Record<NonNullable<Props["size"]>, string> = {
	sm: "h-9 w-9 min-h-9 min-w-9 text-lg",
	md: "h-11 w-11 min-h-11 min-w-11 text-xl",
	lg: "h-14 w-14 min-h-14 min-w-14 text-2xl",
};

/**
 * „AI“ аватар: градиентен пръстен + emoji от профила на специалиста.
 */
export function AiCharacterAvatar({ id, size = "md", selected = false, className = "" }: Props) {
	const c = CHARACTERS[id];
	const accent = CHARACTER_ACCENT[id];
	const style = { "--avatar-accent": c.primaryColorHex } as CSSProperties;

	return (
		<span
			style={style}
			className={`ai-character-avatar grid shrink-0 place-items-center rounded-full ${sizeClass[size]} ${selected ? "ai-character-avatar--selected" : ""} ${className}`}
			title={c.fullName}
			aria-label={c.name}
		>
			<span className={`select-none leading-none ${accent}`} aria-hidden>
				{c.avatar}
			</span>
		</span>
	);
}
