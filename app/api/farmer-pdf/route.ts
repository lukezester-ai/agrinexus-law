import { NextResponse } from "next/server";
import { defaultFarmerProfile, type FarmerLocalProfile } from "@/lib/farmer-profile-storage";
import {
	buildApplicationSummaryPdf,
	buildDeclarationPdf,
	buildDocumentPackPdf,
	buildLeaseContractDraftPdf,
	buildStatementPdf,
	type FarmerPdfOptions,
} from "@/lib/pdf/generate-documents";
import { loadNotoFontFromDisk } from "@/lib/pdf/font-server";

export const runtime = "nodejs";

const KINDS = ["declaration", "application", "lease", "statement", "pack"] as const;
type Kind = (typeof KINDS)[number];

const FILENAMES: Record<Kind, string> = {
	declaration: "agrinexus-deklaratsiya-chernova.pdf",
	application: "agrinexus-zayavlenie-obobshtenie.pdf",
	lease: "agrinexus-dogovor-arenda-chernova.pdf",
	statement: "agrinexus-spravka.pdf",
	pack: "agrinexus-paket-dokumenti.pdf",
};

function parseProfile(raw: unknown): FarmerLocalProfile {
	const d = defaultFarmerProfile();
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return d;
	const o = raw as Record<string, unknown>;
	const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
	return {
		fullName: s(o.fullName, 200) || d.fullName,
		farmName: s(o.farmName, 300) || d.farmName,
		region: s(o.region, 200) || d.region,
		decares: s(o.decares, 50) || d.decares,
		hasLandRightsDoc: Boolean(o.hasLandRightsDoc),
		hasBankAccountVerified: Boolean(o.hasBankAccountVerified),
		declaresOrganic: Boolean(o.declaresOrganic),
		hasOrganicCertificate: Boolean(o.hasOrganicCertificate),
	};
}

const serverFontOpts: FarmerPdfOptions = {
	loadFont: () => Promise.resolve(loadNotoFontFromDisk()),
};

export async function POST(req: Request) {
	let raw: unknown;
	try {
		const text = await req.text();
		if (text.length > 120_000) {
			return NextResponse.json({ error: "Payload too large" }, { status: 413 });
		}
		raw = JSON.parse(text) as unknown;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const body = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
	const kind = body.kind;
	if (typeof kind !== "string" || !KINDS.includes(kind as Kind)) {
		return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
	}

	const profile = parseProfile(body.profile);

	let bytes: Uint8Array;
	try {
		switch (kind as Kind) {
			case "declaration":
				bytes = await buildDeclarationPdf(profile, serverFontOpts);
				break;
			case "application":
				bytes = await buildApplicationSummaryPdf(profile, serverFontOpts);
				break;
			case "lease":
				bytes = await buildLeaseContractDraftPdf(profile, serverFontOpts);
				break;
			case "statement":
				bytes = await buildStatementPdf(profile, serverFontOpts);
				break;
			case "pack":
				bytes = await buildDocumentPackPdf(profile, serverFontOpts);
				break;
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : "PDF build failed";
		console.error("[farmer-pdf]", e);
		return NextResponse.json({ error: msg }, { status: 500 });
	}

	const filename = FILENAMES[kind as Kind];
	return new NextResponse(Buffer.from(bytes), {
		status: 200,
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Cache-Control": "no-store",
		},
	});
}
