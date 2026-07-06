import { execSync } from "child_process";

try {
  console.log("Generating migrations...");
  execSync("npx drizzle-kit generate", { stdio: "inherit" });

  console.log("Running migrations...");
  execSync("npx drizzle-kit push", { stdio: "inherit" });

  console.log("Migration complete.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
}
