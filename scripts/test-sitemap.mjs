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

const { discoverFromSitemapPages, discoverFromSitemap } = await import("../lib/ingest/feed-discovery.ts");

console.log("Testing discoverFromSitemapPages with MZH...");
const result = await discoverFromSitemapPages("https://www.mzh.government.bg/sitemap.xml", 10);
console.log("Results:", result.length);
result.forEach((r, i) => console.log(`  ${i+1}. ${r.title.slice(0,60)} — ${r.fileUrl.slice(0,80)}`));
