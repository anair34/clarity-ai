import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "OPENAI_API_KEY",
];

if (!existsSync(envPath)) {
  console.error("Missing .env.local — run: cp .env.local.example .env.local");
  process.exit(1);
}

const content = readFileSync(envPath, "utf8");
const values = Object.fromEntries(
  content
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

let ok = true;

for (const key of required) {
  const value = values[key];
  if (!value || value.startsWith("your-")) {
    console.error(`✗ ${key} is missing or still has the placeholder value`);
    ok = false;
  } else {
    console.log(`✓ ${key}`);
  }
}

if (!ok) {
  console.log("\nSee docs/SUPABASE_SETUP.md for setup steps.");
  process.exit(1);
}

console.log("\nEnv looks good. Run: npm run dev");
