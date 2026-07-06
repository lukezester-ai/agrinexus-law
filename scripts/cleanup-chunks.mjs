import { readFileSync, existsSync } from "fs";
function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv(".env");
loadEnv(".env.local");

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Count before
const { count: before } = await supabase.from("knowledge_chunks").select("*", { count: "exact", head: true });
console.log(`Chunks before cleanup: ${before}`);

// Get all valid public_document IDs
const { data: docIds } = await supabase.from("public_documents").select("id");
const validIds = new Set(docIds.map(d => d.id));
console.log(`Valid public_document IDs: ${validIds.size}`);

// Get all chunk IDs with source_type=public_document
const { data: chunks } = await supabase
  .from("knowledge_chunks")
  .select("id, source_id")
  .eq("source_type", "public_document");

console.log(`public_document chunks: ${chunks.length}`);

// Find orphan chunks
const toDelete = chunks.filter(c => !validIds.has(c.source_id));
console.log(`Orphan chunks to delete: ${toDelete.length}`);

// Delete in batches of 100
let deleted = 0;
for (let i = 0; i < toDelete.length; i += 100) {
  const batch = toDelete.slice(i, i + 100).map(c => c.id);
  await supabase.from("knowledge_chunks").delete().in("id", batch);
  deleted += batch.length;
  console.log(`  Deleted ${deleted}/${toDelete.length}`);
}
console.log(`Deleted ${deleted} orphan chunks`);

// Count after
const { count: after } = await supabase.from("knowledge_chunks").select("*", { count: "exact", head: true });
console.log(`Chunks after cleanup: ${after}`);
