"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { gentleSpring } from "@/lib/motion-variants";

const KEY = "agrinexus-theme";
const USER_SET_KEY = "agrinexus-theme-user-set";

function applyTheme(mode: "dark" | "light") {
	const root = document.documentElement;
	if (mode === "dark") root.classList.add("dark");
	else root.classList.remove("dark");
	try {
		localStorage.setItem(KEY, mode);
		localStorage.setItem(USER_SET_KEY, "1");
	} catch {
		/* ignore */
	}
}

export function ThemeToggle() {
	const [mode, setMode] = useState<"dark" | "light">("light");
	const [mounted, setMounted] = useState(false);
	const reducedMotion = useReducedMotion();

	useEffect(() => {
		setMounted(true);
		try {
			const s = localStorage.getItem(KEY) as "dark" | "light" | null;
			const userSet = localStorage.getItem(USER_SET_KEY) === "1";
			if (userSet && (s === "light" || s === "dark")) {
				setMode(s);
				applyTheme(s);
			} else {
				setMode("light");
				document.documentElement.classList.remove("dark");
			}
		} catch {
			setMode("light");
			document.documentElement.classList.remove("dark");
		}
	}, []);

	const toggle = () => {
		const next = mode === "dark" ? "light" : "dark";
		setMode(next);
		applyTheme(next);
	};

	if (!mounted) {
		return (
			<div
				className="fixed bottom-4 right-4 z-[100] h-12 w-12 rounded-full border border-slate-500/30 bg-slate-200/60 shadow-md backdrop-blur-md dark:border-emerald-500/20 dark:bg-slate-900/50"
				aria-hidden
			/>
		);
	}

	return (
		<motion.button
			type="button"
			onClick={toggle}
			className="fixed bottom-4 right-4 z-[100] flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/35 bg-white/75 text-slate-800 shadow-[0_8px_32px_-8px_rgba(74,222,128,0.35)] backdrop-blur-xl dark:border-cyan-500/25 dark:bg-slate-950/75 dark:text-cyan-100 dark:shadow-[0_8px_36px_-6px_rgba(34,211,238,0.22)]"
			title={mode === "dark" ? "Светла тема" : "Тъмна тема"}
			aria-label={mode === "dark" ? "Превключи на светла тема" : "Превключи на тъмна тема"}
			initial={reducedMotion ? false : { opacity: 0, scale: 0.88, y: 16 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			transition={gentleSpring}
			whileHover={reducedMotion ? undefined : { scale: 1.06 }}
			whileTap={reducedMotion ? undefined : { scale: 0.94 }}
		>
			{mode === "dark" ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
		</motion.button>
	);
}
