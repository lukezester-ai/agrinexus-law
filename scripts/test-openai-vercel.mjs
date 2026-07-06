import OpenAI from "openai";

const key = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o";

console.log("OPENAI_API_KEY set:", Boolean(key));
console.log("OPENAI_MODEL:", model);

if (!key) {
  console.log("No key available");
  process.exit(1);
}

try {
  const client = new OpenAI({ apiKey: key });
  const chat = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: "Say hello in 3 words" }],
    max_tokens: 20,
  });
  console.log("Response:", chat.choices[0]?.message?.content);
  console.log("Model used:", chat.model);
  console.log("SUCCESS");
} catch (err) {
  console.error("Error:", err instanceof Error ? err.message : String(err));
  if (err instanceof Error && 'status' in err) {
    console.error("Status:", err.status);
  }
}
