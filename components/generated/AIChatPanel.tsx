"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { loadFarmProfile } from "@/lib/farm-profile";
import type { CharacterId } from "@/lib/characters";
import { CHARACTERS } from "@/lib/characters";

type ChatTab = "Право" | "Поле" | "Финанси";

interface ChatMessage {
	id: string;
	role: "ai" | "user";
	text: string;
	citation?: string;
}

const CHAT_TABS: ChatTab[] = ["Право", "Поле", "Финанси"];

const TAB_TO_CHARACTER: Record<ChatTab, CharacterId> = {
	Право: "elena",
	Поле: "boris",
	Финанси: "viktoria",
};

const DEFAULT_QUICK_CHIPS = [
	"Какви документи трябват?",
	"Има промяна в сроковете?",
	"Насоки ми за срок",
];

function greetingForTab(tab: ChatTab): ChatMessage {
	const character = CHARACTERS[TAB_TO_CHARACTER[tab]];
	return {
		id: `greeting-${tab}`,
		role: "ai",
		text: character.greeting,
	};
}

const renderText = (text: string) => {
	const parts = text.split(/(\*\*[^*]+\*\*)/g);
	return parts.map((part, i) => {
		if (part.startsWith("**") && part.endsWith("**")) {
			return (
				<strong key={`part-${i}`} className="font-semibold text-white">
					{part.slice(2, -2)}
				</strong>
			);
		}
		return <span key={`part-${i}`}>{part}</span>;
	});
};

export interface AIChatPanelProps {
	prefill?: string;
	quickChips?: string[];
	placeholder?: string;
	className?: string;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
	prefill,
	quickChips = DEFAULT_QUICK_CHIPS,
	placeholder = "Задай въпрос за срок...",
	className,
}) => {
	const [activeTab, setActiveTab] = React.useState<ChatTab>("Право");
	const [messagesByTab, setMessagesByTab] = React.useState<Record<ChatTab, ChatMessage[]>>(() => ({
		Право: [greetingForTab("Право")],
		Поле: [greetingForTab("Поле")],
		Финанси: [greetingForTab("Финанси")],
	}));
	const [inputValue, setInputValue] = React.useState(prefill ?? "");
	const [isLoading, setIsLoading] = React.useState(false);
	const messagesEndRef = React.useRef<HTMLDivElement>(null);
	const messagesContainerRef = React.useRef<HTMLDivElement>(null);
	const messages = messagesByTab[activeTab];

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	React.useEffect(() => {
		scrollToBottom();
	}, [messages, isLoading]);

	React.useEffect(() => {
		if (prefill) setInputValue(prefill);
	}, [prefill]);

	const setMessages = React.useCallback(
		(updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
			setMessagesByTab((prev) => ({
				...prev,
				[activeTab]: typeof updater === "function" ? updater(prev[activeTab]) : updater,
			}));
		},
		[activeTab],
	);

	const requestReply = async (history: ChatMessage[], userText: string) => {
		const characterId = TAB_TO_CHARACTER[activeTab];
		const apiMessages = [...history, { role: "user" as const, text: userText }].map((m) => ({
			role: m.role === "user" ? "user" : "assistant",
			content: m.text,
		}));

		const response = await fetch("/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				characterId,
				messages: apiMessages,
				userProfile: loadFarmProfile(),
			}),
		});

		if (!response.ok) {
			const errBody = await response.json().catch(() => null);
			throw new Error(
				(errBody as { error?: string } | null)?.error ??
					`Грешка ${response.status} при заявката към AI.`,
			);
		}

		const contentType = response.headers.get("content-type") ?? "";

		if (contentType.includes("application/json")) {
			const data = (await response.json()) as { response?: string; error?: string };
			if (data.error) throw new Error(data.error);
			return data.response ?? "";
		}

		const reader = response.body?.getReader();
		if (!reader) throw new Error("Липсва поток от отговора.");

		const decoder = new TextDecoder();
		let text = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			text += decoder.decode(value, { stream: true });
		}
		return text;
	};

	const handleSend = async (text: string) => {
		const trimmed = text.trim();
		if (!trimmed || isLoading) return;

		const userMsg: ChatMessage = {
			id: `msg-user-${Date.now()}`,
			role: "user",
			text: trimmed,
		};

		const nextHistory = [...messages, userMsg];
		setMessages(nextHistory);
		setInputValue("");
		setIsLoading(true);

		const aiMsgId = `msg-ai-${Date.now()}`;
		setMessages((prev) => [
			...prev,
			{ id: aiMsgId, role: "ai", text: "…" },
		]);

		try {
			const reply = await requestReply(messages, trimmed);
			setMessages((prev) =>
				prev.map((m) => (m.id === aiMsgId ? { ...m, text: reply || "Няма отговор." } : m)),
			);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Възникна грешка. Опитай отново.";
			setMessages((prev) =>
				prev.map((m) =>
					m.id === aiMsgId ? { ...m, text: `⚠️ ${message}` } : m,
				),
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			void handleSend(inputValue);
		}
	};

	return (
		<aside
			className={cn(
				"sticky top-[120px] hidden w-[340px] shrink-0 flex-col self-start border-l border-[#1E1E1E] bg-[#111111] xl:flex",
				className,
			)}
			style={{ height: "calc(100vh - 120px)" }}
		>
			<div className="shrink-0 px-5 pt-5 pb-0">
				<p
					className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-[#888888] uppercase"
					style={{ fontFamily: "Inter, sans-serif" }}
				>
					Асистент
				</p>
				<div className="flex items-end gap-0 border-b border-[#1E1E1E]">
					{CHAT_TABS.map((tab) => (
						<button
							key={tab}
							type="button"
							onClick={() => setActiveTab(tab)}
							className={cn(
								"relative px-4 pb-3 text-[14px] font-medium transition-colors",
								activeTab === tab ? "text-white" : "text-[#888888] hover:text-zinc-300",
							)}
							style={{ fontFamily: "Inter, sans-serif" }}
						>
							{tab}
							{activeTab === tab && (
								<motion.div
									layoutId="chat-tab-indicator"
									className="absolute right-0 bottom-0 left-0 h-[2px] bg-[#3B82F6]"
								/>
							)}
						</button>
					))}
				</div>
			</div>

			<div
				ref={messagesContainerRef}
				className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
			>
				<AnimatePresence initial={false}>
					{messages.map((msg) => (
						<motion.div
							key={msg.id}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
							className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}
						>
							{msg.role === "ai" ? (
								<div className="flex max-w-[92%] items-start gap-2.5">
									<div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]">
										<span
											className="font-bold text-white"
											style={{ fontSize: "10px", fontFamily: "Inter, sans-serif" }}
										>
											AI
										</span>
									</div>
									<div className="flex flex-col gap-2">
										<div
											className="border border-[#1E1E1E] bg-[#181818] px-4 py-3.5 text-[14px] leading-relaxed text-[#CCCCCC]"
											style={{
												borderRadius: "12px",
												borderTopLeftRadius: "4px",
												fontFamily: "Inter, sans-serif",
												lineHeight: "1.6",
											}}
										>
											{renderText(msg.text)}
										</div>
										{msg.citation && (
											<div
												className="inline-flex items-center self-start border border-[#1E1E1E] bg-[#111111] px-2.5 py-1 text-[#888888]"
												style={{
													borderRadius: "6px",
													fontSize: "11px",
													fontFamily: "Inter, sans-serif",
												}}
											>
												{msg.citation}
											</div>
										)}
									</div>
								</div>
							) : (
								<div
									className="max-w-[85%] bg-[#3B82F6] px-4 py-3 text-[14px] text-white"
									style={{
										borderRadius: "12px",
										borderTopRightRadius: "4px",
										fontFamily: "Inter, sans-serif",
										lineHeight: "1.5",
									}}
								>
									{msg.text}
								</div>
							)}
						</motion.div>
					))}
				</AnimatePresence>
				<div ref={messagesEndRef} />
			</div>

			<div className="shrink-0 border-t border-[#1E1E1E] bg-[#0A0A0A] px-4 pt-3 pb-4">
				<div className="mb-3 flex flex-wrap gap-2">
					{quickChips.map((chip) => (
						<button
							key={chip}
							type="button"
							disabled={isLoading}
							onClick={() => void handleSend(chip)}
							className="rounded-full border border-[#1E1E1E] bg-[#181818] px-3 py-1.5 text-[#888888] transition-colors hover:border-zinc-700 hover:text-zinc-300 disabled:opacity-50"
							style={{ fontSize: "13px", fontFamily: "Inter, sans-serif" }}
						>
							{chip}
						</button>
					))}
				</div>

				<div className="flex items-center gap-2">
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={isLoading}
						placeholder={placeholder}
						className="flex-1 rounded-[10px] border border-[#222222] bg-[#181818] px-4 py-3 text-[14px] text-white transition-colors placeholder:text-[#444444] focus:border-[#3B82F6] focus:outline-none disabled:opacity-60"
						style={{ fontFamily: "Inter, sans-serif" }}
					/>
					<button
						type="button"
						disabled={isLoading || !inputValue.trim()}
						onClick={() => void handleSend(inputValue)}
						className="flex shrink-0 items-center justify-center rounded-[8px] bg-[#3B82F6] px-4 py-3 transition-colors hover:bg-blue-500 disabled:opacity-50"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="white"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M5 12h14M12 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			</div>
		</aside>
	);
};
