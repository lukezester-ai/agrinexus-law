/** Споделен тип за документ в базата знания (ДФЗ / ОСП / финанси). */

export interface KnowledgeDoc {
	id: string;
	title: string;
	category: string;
	type: "scheme" | "regulation" | "procedure" | "deadline" | "video" | "pdf" | "lesson";
	content: string;
	keywords: string[];
	source: string;
	effectiveDate: string;
	/** Ingest PDF/HTML от public_documents — външен линк. */
	sourceUrl?: string;
}
