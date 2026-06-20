#!/usr/bin/env node
/**
 * After vite build: park the Framer plugin under /panel/ and promote landing.html to /.
 */
import { copyFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const panelDir = join(dist, "panel");
const builtIndex = join(dist, "index.html");

if (!existsSync(builtIndex)) {
  console.error("[landing] dist/index.html missing — run vite build first");
  process.exit(1);
}

mkdirSync(panelDir, { recursive: true });
renameSync(builtIndex, join(panelDir, "index.html"));

const assetsDir = join(dist, "assets");
if (existsSync(assetsDir)) {
  renameSync(assetsDir, join(panelDir, "assets"));
}

copyFileSync(join(root, "landing.html"), join(dist, "index.html"));
console.log("[landing] promoted landing.html -> dist/index.html; plugin at dist/panel/");
