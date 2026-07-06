#!/usr/bin/env node
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

// Directly test the sitemap HTML discovery
const { discoverFromSitemapPages, extractPdfLinksFromHtml } = await import("../lib/ingest/feed-discovery.ts");

// Test MZH
console.log("Testing MZH sitemap...");
try {
  const mzhFiles = await discoverFromSitemapPages("https://www.mzh.government.bg/sitemap.xml", 10);
  console.log(`MZH files: ${mzhFiles.length}`);
  mzhFiles.slice(0, 5).forEach(f => console.log(`  ${f.fileUrl.slice(0, 100)}`));
} catch (e) {
  console.log(`MZH error: ${e.message}`);
}

// Test DFZ
console.log("\nTesting DFZ sitemap...");
try {
  const dfzFiles = await discoverFromSitemapPages("https://dfz.bg/sitemap.xml", 10);
  console.log(`DFZ files: ${dfzFiles.length}`);
  dfzFiles.slice(0, 5).forEach(f => console.log(`  ${f.fileUrl.slice(0, 100)}`));
} catch (e) {
  console.log(`DFZ error: ${e.message}`);
}

// Test PDF extraction from a known MZH page
console.log("\nTesting PDF extraction from MZH page...");
try {
  const pdfs = await extractPdfLinksFromHtml("https://mzh.government.bg/bg/ministerstvo/struktura/");
  console.log(`PDFs found: ${pdfs.length}`);
  pdfs.forEach(f => console.log(`  ${f.fileUrl}`));
} catch (e) {
  console.log(`PDF extraction error: ${e.message}`);
}
