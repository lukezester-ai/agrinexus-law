"use client";

import ReactMarkdown from "react-markdown";

type Props = {
	content: string;
	variant?: "user" | "assistant";
};

/**
 * Рендер на отговори от LLM с Markdown (### заглавия, списъци, **удебелен** текст).
 * Без raw HTML — само безопасният подмножество на react-markdown.
 */
export function ChatMarkdown({ content, variant = "assistant" }: Props) {
	const trimmed = content.trim();
	if (!trimmed) {
		return <div className="min-h-[1.25rem]" aria-hidden />;
	}

	const linkClass =
		variant === "assistant"
			? "font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-200"
			: "font-semibold text-slate-800 underline underline-offset-2 dark:text-slate-200";

	return (
		<div className="chat-markdown text-sm leading-6 text-slate-800 dark:text-slate-200">
			<ReactMarkdown
				components={{
					h1: ({ children }) => (
						<h3 className="mb-2 mt-4 text-base font-black text-slate-950 first:mt-0 dark:text-white">{children}</h3>
					),
					h2: ({ children }) => (
						<h3 className="mb-2 mt-4 text-sm font-black text-slate-950 first:mt-0 dark:text-white">{children}</h3>
					),
					h3: ({ children }) => (
						<h3 className="mb-2 mt-3 text-sm font-black text-slate-900 first:mt-0 dark:text-emerald-50">{children}</h3>
					),
					p: ({ children }) => <p className="mb-2 last:mb-0 leading-6">{children}</p>,
					ul: ({ children }) => (
						<ul className="mb-2 ml-0 list-disc space-y-1 pl-5 marker:text-emerald-700 dark:marker:text-emerald-400">{children}</ul>
					),
					ol: ({ children }) => (
						<ol className="mb-2 ml-0 list-decimal space-y-1 pl-5 marker:font-semibold">{children}</ol>
					),
					li: ({ children }) => <li className="leading-6 pl-0.5">{children}</li>,
					strong: ({ children }) => (
						<strong className="font-semibold text-slate-950 dark:text-white">{children}</strong>
					),
					em: ({ children }) => <em className="italic">{children}</em>,
					a: ({ href, children }) => (
						<a href={href ?? "#"} className={linkClass} target="_blank" rel="noopener noreferrer">
							{children}
						</a>
					),
					code: ({ className, children, ...rest }) => {
						const isBlock = typeof className === "string" && className.includes("language-");
						if (isBlock) {
							return (
								<code className="block font-mono text-[12px] leading-relaxed text-inherit" {...rest}>
									{children}
								</code>
							);
						}
						return (
							<code className="rounded bg-slate-200/90 px-1 py-0.5 font-mono text-[12px] text-slate-900 dark:bg-slate-800 dark:text-emerald-100">
								{children}
							</code>
						);
					},
					pre: ({ children }) => (
						<pre className="mb-2 max-h-48 overflow-auto rounded-md border border-slate-200 bg-slate-900 p-3 text-xs text-slate-100 dark:border-slate-700">
							{children}
						</pre>
					),
					blockquote: ({ children }) => (
						<blockquote className="mb-2 border-l-2 border-emerald-600/50 pl-3 text-slate-600 italic dark:border-emerald-500/50 dark:text-slate-300">
							{children}
						</blockquote>
					),
					hr: () => <hr className="my-3 border-slate-200 dark:border-slate-700" />,
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
