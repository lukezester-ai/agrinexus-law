/**
 * Документи в Supabase Storage + таблица farmer_documents (RLS по auth.uid).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type CloudFarmerDocRow = {
	id: string;
	user_id: string;
	storage_path: string;
	filename: string;
	mime: string | null;
	byte_size: number;
	created_at: string;
};

export function sanitizeStorageFileName(name: string): string {
	const base = name.replace(/[^\w.\-\u0400-\u04FF]+/g, "_").replace(/_+/g, "_");
	return base.slice(0, 180) || "document";
}

export async function listCloudFarmerDocuments(
	supabase: SupabaseClient,
): Promise<CloudFarmerDocRow[]> {
	const { data, error } = await supabase
		.from("farmer_documents")
		.select("id,user_id,storage_path,filename,mime,byte_size,created_at")
		.order("created_at", { ascending: false });

	if (error) throw error;
	return (data ?? []) as CloudFarmerDocRow[];
}

export async function uploadCloudFarmerDocument(
	supabase: SupabaseClient,
	userId: string,
	file: File,
): Promise<CloudFarmerDocRow> {
	const docId =
		typeof crypto !== "undefined" && crypto.randomUUID
			? crypto.randomUUID()
			: `d-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	const safe = sanitizeStorageFileName(file.name);
	const path = `${userId}/${docId}_${safe}`;

	const { error: upErr } = await supabase.storage.from("farmer-docs").upload(path, file, {
		cacheControl: "3600",
		upsert: false,
		contentType: file.type || "application/octet-stream",
	});

	if (upErr) throw upErr;

	const { data: row, error: insErr } = await supabase
		.from("farmer_documents")
		.insert({
			user_id: userId,
			storage_path: path,
			filename: file.name.slice(0, 240),
			mime: file.type || null,
			byte_size: file.size,
		})
		.select("id,user_id,storage_path,filename,mime,byte_size,created_at")
		.single();

	if (insErr) {
		await supabase.storage.from("farmer-docs").remove([path]);
		throw insErr;
	}

	return row as CloudFarmerDocRow;
}

export async function getCloudDocumentSignedUrl(
	supabase: SupabaseClient,
	storagePath: string,
	expiresSec = 3600,
): Promise<string> {
	const { data, error } = await supabase.storage
		.from("farmer-docs")
		.createSignedUrl(storagePath, expiresSec);

	if (error || !data?.signedUrl) {
		throw error ?? new Error("Неуспешен подписан URL.");
	}
	return data.signedUrl;
}

export async function deleteCloudFarmerDocument(
	supabase: SupabaseClient,
	row: Pick<CloudFarmerDocRow, "id" | "storage_path">,
): Promise<void> {
	const { error: stErr } = await supabase.storage
		.from("farmer-docs")
		.remove([row.storage_path]);
	if (stErr) throw stErr;

	const { error: delErr } = await supabase
		.from("farmer_documents")
		.delete()
		.eq("id", row.id);

	if (delErr) throw delErr;
}
