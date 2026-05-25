/** Нормализира история user/assistant за LLM чат API (OpenAI през AI SDK). */
export function normalizeChatMessages(
	messages: Array<{ role: string; content: string }>,
): Array<{ role: "user" | "assistant"; content: string }> {
	const trimmed: Array<{ role: "user" | "assistant"; content: string }> = [];
	for (const m of messages) {
		if (!m?.role || typeof m.content !== "string") continue;
		const role =
			m.role === "assistant" ? ("assistant" as const) : m.role === "user" ? ("user" as const) : null;
		if (!role) continue;
		const content = m.content.trim();
		if (!content) continue;
		trimmed.push({ role, content });
	}

	const merged: Array<{ role: "user" | "assistant"; content: string }> = [];
	for (const m of trimmed) {
		const last = merged[merged.length - 1];
		if (last && last.role === m.role) {
			last.content = `${last.content}\n\n${m.content}`;
		} else {
			merged.push({ role: m.role, content: m.content });
		}
	}

	while (merged.length > 0 && merged[0].role !== "user") {
		merged.shift();
	}

	return merged;
}
