"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AIChatPanel } from "@/components/generated/AIChatPanel";

type LandingChatContextValue = {
	openChat: (prefill?: string) => void;
	closeChat: () => void;
};

const LandingChatContext = React.createContext<LandingChatContextValue | null>(null);

function clearChatHash() {
	if (typeof window === "undefined") return;
	const url = new URL(window.location.href);
	url.hash = "";
	window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export function LandingChatProvider({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = React.useState(false);
	const [prefill, setPrefill] = React.useState<string | undefined>();

	const openChat = React.useCallback((nextPrefill?: string) => {
		setPrefill(nextPrefill);
		setOpen(true);
		if (typeof window !== "undefined" && window.location.hash !== "#chat") {
			window.history.pushState(null, "", "#chat");
		}
	}, []);

	const closeChat = React.useCallback(() => {
		setOpen(false);
		clearChatHash();
	}, []);

	React.useEffect(() => {
		const syncFromUrl = () => {
			const params = new URLSearchParams(window.location.search);
			const chatQ = params.get("chatQ")?.trim();
			if (window.location.hash === "#chat" || chatQ) {
				setPrefill(chatQ || undefined);
				setOpen(true);
			}
		};

		syncFromUrl();
		const onHashChange = () => {
			if (window.location.hash === "#chat") {
				openChat();
			} else if (open) {
				setOpen(false);
			}
		};

		window.addEventListener("hashchange", onHashChange);
		return () => window.removeEventListener("hashchange", onHashChange);
	}, [open, openChat]);

	React.useEffect(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeChat();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = prev;
			window.removeEventListener("keydown", onKey);
		};
	}, [open, closeChat]);

	const value = React.useMemo(
		() => ({ openChat, closeChat }),
		[openChat, closeChat],
	);

	return (
		<LandingChatContext.Provider value={value}>
			{children}
			<AnimatePresence>
				{open ? (
					<>
						<motion.button
							type="button"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="fixed inset-0 z-[90] cursor-default bg-black/45 backdrop-blur-[2px]"
							aria-label="Затвори чата"
							onClick={closeChat}
						/>
						<motion.div
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							transition={{ type: "spring", damping: 28, stiffness: 320 }}
							className="fixed top-0 right-0 z-[91] h-[100dvh] w-full max-w-[420px] shadow-2xl"
							role="dialog"
							aria-modal="true"
							aria-labelledby="landing-chat-title"
						>
							<AIChatPanel
								variant="overlay"
								prefill={prefill}
								onClose={closeChat}
							/>
						</motion.div>
					</>
				) : null}
			</AnimatePresence>
		</LandingChatContext.Provider>
	);
}

export function useLandingChat(): LandingChatContextValue {
	const ctx = React.useContext(LandingChatContext);
	if (ctx) return ctx;

	return {
		openChat: (prefill?: string) => {
			if (typeof window === "undefined") return;
			const q = prefill ? `?chatQ=${encodeURIComponent(prefill)}` : "";
			window.location.href = `/${q}#chat`;
		},
		closeChat: () => {
			clearChatHash();
		},
	};
}
