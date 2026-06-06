import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** Legacy „next/core-web-vitals“ през FlatCompat — реална поддръжка на ESLint 9. */
const eslintConfig = [
  { ignores: ["scripts/**/*.mjs", ".next/**", "node_modules/**", "dist/**", "android/**", "ios/**"] },
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
