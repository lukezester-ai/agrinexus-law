import { NextResponse } from "next/server";
import { CROP_PROFILES } from "@/lib/crop-statistics-data";

export const revalidate = 3600;

export async function GET() {
	return NextResponse.json({ ok: true, data: CROP_PROFILES });
}
