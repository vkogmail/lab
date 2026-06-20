/**
 * Figma plugin UI iframes do not load external stylesheets — inline plugin-ui.css
 * into ui.html before dev/build. Edit plugin-ui.css; run this script to sync.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(root, "plugin-ui.css"), "utf8").trim();
const uiPath = join(root, "ui.html");
const ui = readFileSync(uiPath, "utf8");

const styleBlock = `<style>\n${css}\n</style>`;
const linked = /<link rel="stylesheet" href="plugin-ui\.css"\s*\/?>/;
const styled = /<style>[\s\S]*?<\/style>/;

let next;
if (linked.test(ui)) {
  next = ui.replace(linked, styleBlock);
} else if (styled.test(ui)) {
  next = ui.replace(styled, styleBlock);
} else {
  next = ui.replace("</head>", `${styleBlock}\n</head>`);
}

if (next === ui) {
  console.warn("[inline-ui-css] ui.html unchanged — check for <link> or <style> in head");
} else {
  writeFileSync(uiPath, next);
  console.log("[inline-ui-css] synced plugin-ui.css -> ui.html");
}
