import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), ".");
const target = join(root, "public/fonts");

const sourceCandidates = [
  join(root, "node_modules/@createnew/tokens/dist/fonts"),
  join(root, "../../node_modules/@createnew/tokens/dist/fonts"),
];

const source = sourceCandidates.find((candidate) => existsSync(candidate));

if (!source) {
  console.warn("[cnds-npm] @createnew/tokens fonts not found — run npm install first.");
  process.exit(0);
}

mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log("[cnds-npm] Copied token fonts to public/fonts");
