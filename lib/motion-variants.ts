import type { Transition, Variants } from "framer-motion";

/** Кинематографски easing — бавен старт, уверен край */
export const cinematicEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const smoothSpring: Transition = {
	type: "spring",
	stiffness: 380,
	damping: 36,
	mass: 0.85,
};

export const gentleSpring: Transition = {
	type: "spring",
	stiffness: 260,
	damping: 28,
	mass: 0.9,
};

/** Stagger за hero / секции */
export function heroContainer(reduced: boolean | null): Variants {
	if (reduced) {
		return { hidden: {}, visible: {} };
	}
	return {
		hidden: {},
		visible: {
			transition: {
				staggerChildren: 0.09,
				delayChildren: 0.06,
			},
		},
	};
}

export function heroItem(reduced: boolean | null): Variants {
	if (reduced) {
		return { hidden: {}, visible: {} };
	}
	return {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.68, ease: cinematicEase },
		},
	};
}

/** Панел отдясно — „влизане“ в кадър */
export function panelReveal(reduced: boolean | null, side: "left" | "right" = "right"): Variants {
	if (reduced) {
		return { hidden: {}, visible: {} };
	}
	const x = side === "right" ? 36 : -36;
	return {
		hidden: { opacity: 0, x, scale: 0.97 },
		visible: {
			opacity: 1,
			x: 0,
			scale: 1,
			transition: { duration: 0.82, ease: cinematicEase, delay: 0.12 },
		},
	};
}

/** Плаваща лента — premium drop-in */
export function navBarReveal(reduced: boolean | null): Variants {
	if (reduced) {
		return { hidden: {}, visible: {} };
	}
	return {
		hidden: { opacity: 0, y: -16, scale: 0.96, filter: "blur(8px)" },
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			filter: "blur(0px)",
			transition: { ...gentleSpring, delay: 0.05 } as Transition,
		},
	};
}

/** Списък съобщения — лек stagger между балоните */
export function chatListContainer(reduced: boolean | null): Variants {
	if (reduced) {
		return { hidden: {}, visible: {} };
	}
	return {
		hidden: {},
		visible: {
			transition: { staggerChildren: 0.055, delayChildren: 0.03 },
		},
	};
}

export function chatBubble(reduced: boolean | null): Variants {
	if (reduced) {
		return { hidden: {}, visible: {} };
	}
	return {
		hidden: { opacity: 0, y: 12, scale: 0.98 },
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: { duration: 0.42, ease: cinematicEase },
		},
	};
}
