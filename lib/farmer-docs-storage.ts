/**
 * Лични документи на фермера — записани локално в IndexedDB в браузъра.
 * Няма качване към сървър; данните остават на устройството и при недостъп до интернет.
 */

export type StoredFarmerDocMeta = {
	id: string;
	name: string;
	mime: string;
	size: number;
	createdAt: number;
};

const DB_NAME = "agrinexus_farmer_docs";
const DB_VERSION = 1;
const META_STORE = "meta";
const BLOB_STORE = "blobs";

const ALLOWED_MIME_PREFIXES = [
	"application/pdf",
	"image/",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"text/plain",
];

export const MAX_FARMER_DOC_BYTES = 25 * 1024 * 1024;

export function isAllowedFarmerDoc(file: File): boolean {
	if (file.size > MAX_FARMER_DOC_BYTES) return false;
	const mime = file.type.toLowerCase();
	if (!mime) return true;
	return ALLOWED_MIME_PREFIXES.some(p => (p.endsWith("/") ? mime.startsWith(p) : mime === p));
}

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (typeof indexedDB === "undefined") {
			reject(new Error("IndexedDB не е наличен в тази среда."));
			return;
		}
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
		req.onsuccess = () => resolve(req.result);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(META_STORE)) {
				db.createObjectStore(META_STORE, { keyPath: "id" });
			}
			if (!db.objectStoreNames.contains(BLOB_STORE)) {
				db.createObjectStore(BLOB_STORE);
			}
		};
	});
}

function txDone(tx: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error ?? new Error("IDB transaction failed"));
		tx.onabort = () => reject(tx.error ?? new Error("IDB transaction aborted"));
	});
}

export async function listFarmerDocuments(): Promise<StoredFarmerDocMeta[]> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(META_STORE, "readonly");
		const store = tx.objectStore(META_STORE);
		const req = store.getAll();
		req.onerror = () => reject(req.error);
		req.onsuccess = () => {
			const rows = (req.result as StoredFarmerDocMeta[]) || [];
			resolve(rows.sort((a, b) => b.createdAt - a.createdAt));
		};
	});
}

export async function addFarmerDocument(file: File): Promise<StoredFarmerDocMeta> {
	if (!isAllowedFarmerDoc(file)) {
		throw new Error(
			`Неподдържан тип или файл над ${MAX_FARMER_DOC_BYTES / (1024 * 1024)} MB. Разрешени: PDF, изображения, Word/Excel, текст.`
		);
	}
	const id =
		typeof crypto !== "undefined" && crypto.randomUUID
			? crypto.randomUUID()
			: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	const meta: StoredFarmerDocMeta = {
		id,
		name: file.name.slice(0, 240),
		mime: file.type || "application/octet-stream",
		size: file.size,
		createdAt: Date.now(),
	};
	const db = await openDb();
	const tx = db.transaction([META_STORE, BLOB_STORE], "readwrite");
	tx.objectStore(META_STORE).put(meta);
	tx.objectStore(BLOB_STORE).put(file, id);
	await txDone(tx);
	return meta;
}

export async function getFarmerDocumentBlob(id: string): Promise<Blob | null> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(BLOB_STORE, "readonly");
		const req = tx.objectStore(BLOB_STORE).get(id);
		req.onerror = () => reject(req.error);
		req.onsuccess = () => resolve((req.result as Blob) ?? null);
	});
}

export async function deleteFarmerDocument(id: string): Promise<void> {
	const db = await openDb();
	const tx = db.transaction([META_STORE, BLOB_STORE], "readwrite");
	tx.objectStore(META_STORE).delete(id);
	tx.objectStore(BLOB_STORE).delete(id);
	await txDone(tx);
}

export function formatDocSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
