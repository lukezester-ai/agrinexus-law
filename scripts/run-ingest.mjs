#!/usr/bin/env node
/**
 * Пуска ingest за ДФЗ и МЗХ с новия sitemap-html режим.
 */
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv(".env");
loadEnv(".env.local");

const { runDocumentIngest } = await import("../lib/ingest/run.ts");

console.log("Започва ingest на документи от ДФЗ и МЗХ...\n");
const results = await runDocumentIngest({ limitPerSource: 80 });

for (const r of results) {
  console.log(`${r.source}: взети ${r.fetched}, записани ${r.stored}, грешки ${r.errors.length}`);
  for (const e of r.errors.slice(0, 3)) console.log(`  ! ${e}`);
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const { count } = await supabase.from("public_documents").select("*", { count: "exact", head: true });
console.log(`\nОбщо public_documents: ${count}`);

// Препоръка за reindex
console.log("\nСледваща стъпка: npm run reindex:direct");
