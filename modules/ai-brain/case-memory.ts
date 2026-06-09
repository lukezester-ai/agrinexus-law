export type AgrinexusProduct = "core" | "law" | "terraiq" | "academy" | "fieldlot" | "admin";

export type AgrinexusRiskLevel = "low" | "medium" | "high" | "unknown";

export type AgrinexusCaseMemoryInput = {
	product: AgrinexusProduct;
	caseType: string;
	title: string;
	summary: string;
	riskLevel?: AgrinexusRiskLevel;
	sourceTable?: string;
	sourceId?: string | null;
	recommendedAction?: string | null;
	metadata?: Record<string, unknown>;
};

export function normalizeRiskLevel(text: string): AgrinexusRiskLevel {
	const normalized = text.toLocaleLowerCase("bg-BG");
	if (/(висок|high)/i.test(normalized)) return "high";
	if (/(среден|средно|medium)/i.test(normalized)) return "medium";
	if (/(нисък|ниско|low)/i.test(normalized)) return "low";
	return "unknown";
}

export function buildCaseSummary(text: string, maxLength = 1200) {
	const summary = text.replace(/\s+/g, " ").trim();
	return summary.length > maxLength ? `${summary.slice(0, maxLength).trim()}...` : summary;
}