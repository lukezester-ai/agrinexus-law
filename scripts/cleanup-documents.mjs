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

// Delete non-relevant media docs
const { data: mediaDocs, error } = await supabase
  .from("public_documents")
  .select("id, title, source_url")
  .like("source_url", "%/media/filer_public/%");

if (error) { console.error("Error:", error.message); process.exit(1); }

console.log(`Non-relevant media docs to delete: ${mediaDocs.length}`);
for (const doc of mediaDocs) {
  console.log(`  Delete: ${doc.title.slice(0, 50)} — ${doc.source_url.slice(0, 70)}`);
  await supabase.from("public_documents").delete().eq("id", doc.id);
}

// Also delete news pages
const { data: newsDocs } = await supabase
  .from("public_documents")
  .select("id, title")
  .or("source_url.like.%/bg/novini/%,source_url.like.%/bg/obyavi/%");
console.log(`News/announcement docs to delete: ${newsDocs?.length || 0}`);
for (const doc of newsDocs || []) {
  await supabase.from("public_documents").delete().eq("id", doc.id);
}

const { count } = await supabase.from("public_documents").select("*", { count: "exact", head: true });
console.log(`\nTotal after cleanup: ${count}`);
