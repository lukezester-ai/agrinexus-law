/** Споделен тип за документ в базата знания (ДФЗ / ОСП / финанси). */

export interface KnowledgeDoc {
	id: string;
	title: string;
	category: string;
	type: "scheme" | "regulation" | "procedure" | "deadline";
	content: string;
	keywords: string[];
	source: string;
	effectiveDate: string;
}
