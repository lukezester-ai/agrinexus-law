/** JSON-LD за Schema.org (Organization + WebSite + SearchAction). */

export function buildAgriNexusLawJsonLd(siteUrlRaw: string): string {
	const siteUrl = siteUrlRaw.replace(/\/$/, "") || "https://agrinexus.bg";

	const graph = [
		{
			"@type": "Organization",
			"@id": `${siteUrl}/#organization`,
			name: "AgriNexus.Law",
			url: siteUrl,
			description:
				"AI асистенти за български фермери: ДФЗ, ОСП, субсидии, полеви практики и финансови ориентири.",
			areaServed: {
				"@type": "Country",
				name: "Bulgaria",
			},
			availableLanguage: ["bg-BG"],
			knowsAbout: [
				"Земеделие",
				"Държавен фонд земеделие",
				"Обща селскостопанска политика",
				"Директни плащания",
				"Екосхеми",
			],
		},
		{
			"@type": "WebSite",
			"@id": `${siteUrl}/#website`,
			url: siteUrl,
			name: "AgriNexus.Law",
			description:
				"Търсачка по документи за ДФЗ и ОСП, чат с трима специалиста и профил на стопанството.",
			inLanguage: "bg-BG",
			publisher: { "@id": `${siteUrl}/#organization` },
			potentialAction: {
				"@type": "SearchAction",
				target: {
					"@type": "EntryPoint",
					urlTemplate: `${siteUrl}/search?q={search_term_string}`,
				},
				"query-input": "required name=search_term_string",
			},
		},
	];

	return JSON.stringify({
		"@context": "https://schema.org",
		"@graph": graph,
	});
}
