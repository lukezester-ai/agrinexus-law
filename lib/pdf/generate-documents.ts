import { PDFDocument, rgb } from "pdf-lib";
import type { FarmerLocalProfile } from "@/lib/farmer-profile-storage";

/** Резерв, ако локалният файл в `public/fonts/` липсва (стари билдове). */
const NOTO_TTF_CDN =
	"https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf";

let fontBytesPromise: Promise<ArrayBuffer> | null = null;

function fontUrlsInOrder(): string[] {
	const base =
		typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_PATH
			? process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/?$/, "/")
			: "/";
	return [`${base}fonts/NotoSans-Regular.ttf`, NOTO_TTF_CDN];
}

function assertBinaryLooksLikeTtf(buf: ArrayBuffer): void {
	if (buf.byteLength < 6) throw new Error("Font response too small");
	const u = new Uint8Array(buf, 0, 4);
	// Подменен отговор (напр. SW fallback към HTML) — не е TTF/OTF.
	if (u[0] === 0x3c) throw new Error("Font URL returned HTML or text, not a font file");
	const tag = String.fromCharCode(u[0], u[1], u[2], u[3]);
	if (tag === "true" || tag === "typ1" || tag === "OTTO" || tag === "ttcf") return;
	const scaler = new DataView(buf).getUint32(0, false);
	if (scaler === 0x00010000) return;
	throw new Error("Font response is not a recognized TrueType/OpenType font");
}

async function fetchFontFromUrl(url: string): Promise<ArrayBuffer> {
	const r = await fetch(url);
	if (!r.ok) throw new Error(`Font HTTP ${r.status}`);
	const buf = await r.arrayBuffer();
	assertBinaryLooksLikeTtf(buf);
	return buf;
}

/** Noto за кирилица: първо от същия хост, после CDN; при грешка кешът се нулира. */
function loadCyrillicFontBytes(): Promise<ArrayBuffer> {
	if (!fontBytesPromise) {
		fontBytesPromise = (async () => {
			let lastErr: unknown;
			for (const url of fontUrlsInOrder()) {
				for (let attempt = 0; attempt < 2; attempt += 1) {
					try {
						return await fetchFontFromUrl(url);
					} catch (e) {
						lastErr = e;
						if (attempt === 0) await new Promise<void>(res => setTimeout(res, 400));
					}
				}
			}
			throw lastErr instanceof Error ? lastErr : new Error("Failed to load Cyrillic font");
		})().catch(err => {
			fontBytesPromise = null;
			throw err;
		});
	}
	return fontBytesPromise;
}

function wrapLines(text: string, maxChars: number): string[] {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let cur = "";
	for (const w of words) {
		if (!w) continue;
		const next = cur ? `${cur} ${w}` : w;
		if (next.length <= maxChars) cur = next;
		else {
			if (cur) lines.push(cur);
			cur = w.length > maxChars ? w.slice(0, maxChars) : w;
		}
	}
	if (cur) lines.push(cur);
	return lines.length ? lines : [""];
}

async function pageWithHeader(
	pdfDoc: PDFDocument,
	title: string,
	bodyLines: string[],
	footerNote: string,
): Promise<void> {
	const fontBytes = await loadCyrillicFontBytes();
	const font = await pdfDoc.embedFont(fontBytes, { subset: true });
	const page = pdfDoc.addPage([595, 842]);
	const { height } = page.getSize();
	let y = height - 56;
	page.drawText(title, { x: 48, y, size: 14, font, color: rgb(0.05, 0.15, 0.12) });
	y -= 28;
	for (const line of bodyLines) {
		for (const chunk of wrapLines(line, 85)) {
			if (y < 100) break;
			page.drawText(chunk, { x: 48, y, size: 10, font, color: rgb(0.1, 0.12, 0.14) });
			y -= 14;
		}
	}
	y = 72;
	for (const chunk of wrapLines(footerNote, 90)) {
		page.drawText(chunk, { x: 48, y, size: 8, font, color: rgb(0.35, 0.38, 0.4) });
		y -= 11;
	}
}

/** Декларация — образец за попълване (не е официален бланк на ДФЗ). */
export async function buildDeclarationPdf(profile: FarmerLocalProfile): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const body = [
		`Декларирам, че данните по-долу са верни към датата на подписване:`,
		`Име и фамилия / представляващ: ${profile.fullName || "…………………………"}`,
		`Стопанство: ${profile.farmName || "…………………………"}`,
		`Област / община: ${profile.region || "…………………………"}`,
		`Декларирана площ (дка): ${profile.decares || "…………………………"}`,
		``,
		`Идентификатор и банкови реквизити се попълват само в официални бланки и в ИСУН — не се съхраняват в AgriNexus.`,
		``,
		`Декларирам, че имам право да ползвам заявените площи и притежавам изискуемите документи по приложимите схеми.`,
		`Настоящата декларация е генерирана автоматично от AgriNexus за чернова — не подменя официални бланци и е-подпис в ИСУН.`,
	];
	await pageWithHeader(
		pdfDoc,
		"ДЕКЛАРАЦИЯ (образец за чернова)",
		body,
		"Този файл е с ориентировъчен характер. Провери текста със специалист и използвай актуални бланци от ДФЗ / ИСУН.",
	);
	return pdfDoc.save();
}

export async function buildApplicationSummaryPdf(profile: FarmerLocalProfile): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const body = [
		`ОБОБЩЕНИЕ ЗА ЗАЯВЛЕНИЕ (чернова)`,
		`Кандидат: ${profile.fullName || "—"}`,
		`Стопанство: ${profile.farmName || "—"}; регион: ${profile.region || "—"}`,
		`Площ (дка): ${profile.decares || "—"}`,
		``,
		`Документи (отметки от профила):`,
		`- Право на ползване на земя: ${profile.hasLandRightsDoc ? "да" : "не"}`,
		`- Потвърдена сметка ДФЗ: ${profile.hasBankAccountVerified ? "да" : "не"}`,
		`- Био/екосхема декларирана: ${profile.declaresOrganic ? "да" : "не"}`,
		`- Валиден био сертификат: ${profile.hasOrganicCertificate ? "да" : "не"}`,
		``,
		`Прикачи към това обобщение официалните приложения и подай през ИСУН.`,
	];
	await pageWithHeader(
		pdfDoc,
		"ЗАЯВЛЕНИЕ — обобщение",
		body,
		"Генерирано от AgriNexus. Не е подписан документ за държавни органи.",
	);
	return pdfDoc.save();
}

export async function buildLeaseContractDraftPdf(profile: FarmerLocalProfile): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const body = [
		`ДОГОВОР ЗА АРЕНДА НА ЗЕМЕДЕЛСКА ЗЕМЯ (ЧЕРНОВА)`,
		`между страните, съставен за ориентация. Попълни номера на имоти и срок по Наредба 14 и гражданския кодекс.`,
		``,
		`Наемодател: …………………………………………………………`,
		`Наемател: ${profile.fullName || "…………………………"}`,
		`Предмет: обработваеми земеделски земи в област ${profile.region || "………"}`,
		`Срок: от ……… до ………`,
		`Размер на наема: ……… лв./година или % от продукцията.`,
		`Плащане: по банков път — условията се уточняват в окончателния договор между страните.`,
		``,
		`Страните се задължават да спазват законовите изисквания за ползване на земята и кръстосъответствие.`,
		`Подписи: ................................. / .................................`,
	];
	await pageWithHeader(
		pdfDoc,
		"ДОГОВОР — чернова",
		body,
		"Образец за преговори. Задължителен преглед от юрист. AgriNexus не носи отговорност за съдържанието.",
	);
	return pdfDoc.save();
}

export async function buildStatementPdf(profile: FarmerLocalProfile): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const body = [
		`СПРАВКА ЗА СТОПАНСКИ ДАННИ (чернова)`,
		`Дата на генериране: ${new Date().toLocaleString("bg-BG")}`,
		`Производител: ${profile.fullName || "—"}`,
		`Стопанство: ${profile.farmName || "—"}`,
		`Регион: ${profile.region || "—"}`,
		`Обща площ (дка): ${profile.decares || "—"}`,
		``,
		`Справката е предназначена за вътрешна употреба и приложение към банка / доставчик / партньор.`,
	];
	await pageWithHeader(pdfDoc, "СПРАВКА", body, "Не е официален документ на държавна институция.");
	return pdfDoc.save();
}

/** Обединен PDF — четири страници. */
export async function buildDocumentPackPdf(profile: FarmerLocalProfile): Promise<Uint8Array> {
	const dec = await buildDeclarationPdf(profile);
	const app = await buildApplicationSummaryPdf(profile);
	const lease = await buildLeaseContractDraftPdf(profile);
	const stmt = await buildStatementPdf(profile);

	const merged = await PDFDocument.create();
	for (const bytes of [dec, app, lease, stmt]) {
		const src = await PDFDocument.load(bytes);
		const pages = await merged.copyPages(src, src.getPageIndices());
		for (const p of pages) merged.addPage(p);
	}
	return merged.save();
}

export function downloadPdfBytes(data: Uint8Array, filename: string): void {
	const copy = new Uint8Array(data.byteLength);
	copy.set(data);
	const blob = new Blob([copy], { type: "application/pdf" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
