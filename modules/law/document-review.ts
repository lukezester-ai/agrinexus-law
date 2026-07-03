import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { buildCaseSummary, normalizeRiskLevel, type AgrinexusRiskLevel } from "@/modules/ai-brain/case-memory";
import { extractDocxText } from "@/lib/rag/content/docx-parser";
import { extractPdfText } from "@/lib/rag/content/pdf-parser";
import { getSupabaseAdmin } from "@/lib/supabase";

const DEFAULT_MODEL = "gpt-4o";
const MAX_ANALYSIS_CHARS = 28000;

export type ReviewMode = "subsidy" | "contract" | "lease" | "notice";

export type DocumentAnalysisResult = {
	reviewId: string | null;
	caseId: string | null;
	fileName: string;
	mode: ReviewMode;
	modeLabel: string;
	model: string;
	riskLevel: AgrinexusRiskLevel;
	extractedCharacters: number;
	truncated: boolean;
	analysis: string;
};

export const reviewModeLabels: Record<ReviewMode, string> = {
	subsidy: "Субсидии / ДФЗ",
	contract: "Договор",
	lease: "Аренда / наем",
	notice: "Уведомление / писмо",
};

export function isReviewMode(value: unknown): value is ReviewMode {
	return value === "subsidy" || value === "contract" || value === "lease" || value === "notice";
}

function isPlaceholderOpenAiKey(apiKey: string | undefined) {
	return !apiKey || /PASTE_OPENAI_KEY_HERE/i.test(apiKey) || /^your[_-]?openai[_-]?key$/i.test(apiKey);
}

async function extractText(file: File, bytes: Uint8Array) {
	const name = file.name.toLowerCase();
	const type = file.type.toLowerCase();
	if (type.includes("pdf") || name.endsWith(".pdf")) return extractPdfText(bytes);
	if (name.endsWith(".docx")) return extractDocxText(bytes);
	if (type.startsWith("text/") || name.endsWith(".txt")) return new TextDecoder("utf-8").decode(bytes).trim();
	throw new Error("Поддържани са PDF, DOCX и TXT файлове за този MVP.");
}

function buildAnalysisPrompt(params: {
	mode: ReviewMode;
	fileName: string;
	context: string;
	text: string;
}) {
	return `Ти си AI Legal Assistant for Agricultural Documents. Не си заместител на адвокат. Работиш на български език.

Задача: анализирай документа като тип: ${reviewModeLabels[params.mode]}.
Файл: ${params.fileName}
Контекст от фермера: ${params.context || "няма допълнителен контекст"}

Върни структуриран анализ със следните секции:
1. Кратко резюме
2. Най-важни срокове и задължения
3. Рискови клаузи или рискови липси
4. Липсващи данни / въпроси към фермера
5. Препоръчани следващи действия като checklist
6. Ниво на риск: ниско / средно / високо, с кратко основание

Правила:
- Ако липсват данни, кажи ясно какво липсва.
- Не измисляй факти извън текста.
- Цитирай кратки фрази от документа, когато посочваш риск.
- Добави финално предупреждение, че анализът е помощен и при правен спор трябва юрист.

Текст на документа:
"""
${params.text.slice(0, MAX_ANALYSIS_CHARS)}
"""`;
}

async function persistCaseMemory(params: {
	file: File;
	mode: ReviewMode;
	context: string;
	extractedText: string;
	analysis: string;
	model: string;
	riskLevel: AgrinexusRiskLevel;
}) {
	const supabase = getSupabaseAdmin();
	if (!supabase) return { reviewId: null, caseId: null };

	try {
		const insertedReview = await supabase
			.from("document_reviews")
			.insert({
				file_name: params.file.name,
				file_type: params.file.type || null,
				review_mode: params.mode,
				farmer_context: params.context || null,
				extracted_text_preview: params.extractedText.slice(0, 4000),
				analysis: params.analysis,
				model: params.model,
				risk_level: params.riskLevel,
				metadata: { product: "law", case_memory_version: 1 },
			})
			.select("id")
			.single();

		if (insertedReview.error) {
			console.error("Failed to persist document review:", insertedReview.error);
			return { reviewId: null, caseId: null };
		}

		const reviewId = (insertedReview.data?.id as string | undefined) ?? null;
		const insertedCase = await supabase
			.from("agrinexus_cases")
			.insert({
				product: "law",
				case_type: params.mode,
				title: `${reviewModeLabels[params.mode]}: ${params.file.name}`,
				source_table: "document_reviews",
				source_id: reviewId,
				summary: buildCaseSummary(params.analysis),
				risk_level: params.riskLevel,
				recommended_action: null,
				metadata: {
					file_name: params.file.name,
					file_type: params.file.type || null,
					extracted_characters: params.extractedText.length,
					mode_label: reviewModeLabels[params.mode],
				},
			})
			.select("id")
			.single();

		if (insertedCase.error) {
			console.error("Failed to persist Agrinexus case:", insertedCase.error);
			return { reviewId, caseId: null };
		}

		return { reviewId, caseId: (insertedCase.data?.id as string | undefined) ?? null };
	} catch (error) {
		console.error("Document review persistence skipped:", error);
		return { reviewId: null, caseId: null };
	}
}

export async function analyzeAgriculturalDocument(params: {
	file: File;
	mode: ReviewMode;
	context?: string;
}): Promise<DocumentAnalysisResult> {
	const apiKey = process.env.OPENAI_API_KEY?.trim();
	if (isPlaceholderOpenAiKey(apiKey)) {
		throw new Error("OPENAI_API_KEY липсва или е примерна стойност.");
	}

	const bytes = new Uint8Array(await params.file.arrayBuffer());
	const extractedText = await extractText(params.file, bytes);
	if (!extractedText.trim()) {
		throw new Error("Не успяхме да извлечем текст от документа. Ако е сканиран, ще е нужен OCR.");
	}

	const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
	const openai = createOpenAI({ apiKey });
	const prompt = buildAnalysisPrompt({
		mode: params.mode,
		fileName: params.file.name,
		context: params.context || "",
		text: extractedText,
	});

	const result = await generateText({
		model: openai(model),
		prompt,
		temperature: 0.2,
	});
	const riskLevel = normalizeRiskLevel(result.text);
	const { reviewId, caseId } = await persistCaseMemory({
		file: params.file,
		mode: params.mode,
		context: params.context || "",
		extractedText,
		analysis: result.text,
		model,
		riskLevel,
	});

	return {
		reviewId,
		caseId,
		fileName: params.file.name,
		mode: params.mode,
		modeLabel: reviewModeLabels[params.mode],
		model,
		riskLevel,
		extractedCharacters: extractedText.length,
		truncated: extractedText.length > MAX_ANALYSIS_CHARS,
		analysis: result.text,
	};
}