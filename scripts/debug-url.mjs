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

const FILE_EXT_PATTERN = /\.(pdf|doc|docx|xls|xlsx)(\?|#|$)/i;
const SKIP_EXT_PATTERN = /\.(jpg|jpeg|png|gif|svg|css|js|ico|json|xml|rss|atom|woff2?|ttf|eot|mp[3-4]|avi|mov|webm)(\?|#|$)/i;

function isHttpPageUrl(u, feedOrigin) {
  let parsed;
  try { parsed = new URL(u); } catch { return false; }
  console.log("  origin:", parsed.origin, "feedOrigin:", feedOrigin);
  console.log("  protocol:", parsed.protocol);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") { console.log("  fail: protocol"); return false; }
  if (parsed.origin !== feedOrigin) { console.log("  fail: different origin"); return false; }
  if (FILE_EXT_PATTERN.test(parsed.href)) { console.log("  ok: file ext"); return true; }
  if (SKIP_EXT_PATTERN.test(parsed.href)) { console.log("  fail: skip ext"); return false; }
  const path = parsed.pathname;
  if (path === "/" || path === "") { console.log("  fail: root path"); return false; }
  const segs = path.split("/").filter(Boolean);
  console.log("  path:", path, "segments:", segs.length);
  if (segs.length < 2) { console.log("  fail: too few segments"); return false; }
  console.log("  ok: html page");
  return true;
}

const url = "https://mzh.government.bg/bg/ministerstvo/ministar-na-zemedelieto/";
console.log("Testing URL:", url);
console.log("Result:", isHttpPageUrl(url, "https://mzh.government.bg"));

// Also test fetchText and sitemap parsing
console.log("\nFetching MZH sitemap...");
const xml = await (await fetch("https://www.mzh.government.bg/sitemap.xml", {
  headers: { "User-Agent": "AgriNexusBot/1.0 (+document-sync)" }
})).text();
console.log("XML length:", xml.length);

const locs = xml.match(/<loc>\s*([^<\s]+)\s*<\/loc>/gi);
console.log("Locs found:", locs ? locs.length : 0);

if (locs) {
  // Test a few locs against isHttpPageUrl
  for (let i = 0; i < Math.min(locs.length, 5); i++) {
    const u = locs[i].replace(/<\/?loc>/g, "").trim();
    console.log("\n  Loc:", u.slice(0, 100));
    console.log("  isHttpPageUrl:", isHttpPageUrl(u, "https://mzh.government.bg"));
  }
}
