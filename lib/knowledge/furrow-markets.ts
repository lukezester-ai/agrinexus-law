import fs from "fs";
import path from "path";

export function getFurrowMarketsData(): string {
  try {
    const filePath = path.join(process.cwd(), "lib", "knowledge", "furrow-knowledge.json");
    if (!fs.existsSync(filePath)) {
      return "";
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const chunks = data.chunks || [];
    
    if (chunks.length === 0) return "";

    const formatted = chunks.map((c: any) => `- ${c.text}`).join("\n");
    return `\n--- АКТУАЛНИ ДАННИ ОТ FURROW MARKETS ---\n${formatted}\n----------------------------------------`;
  } catch (err) {
    console.error("Error reading furrow-knowledge.json:", err);
    return "";
  }
}
