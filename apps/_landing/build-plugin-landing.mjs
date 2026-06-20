#!/usr/bin/env node
/**
 * Build plugin marketing landing HTML for Vercel (not stored inside app folders).
 *
 *   node ../_landing/build-plugin-landing.mjs              # -> index.html
 *   node ../_landing/build-plugin-landing.mjs landing.html
 *
 * Copy + content live in apps/_landing/{content,heroes}/ — not in plugin app dirs.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = process.cwd();
const outName = process.argv[2] || "index.html";
const landingDir = join(dirname(fileURLToPath(import.meta.url)));
const shellPath = join(landingDir, "shell.html");

const card = JSON.parse(readFileSync(join(appDir, "lab.card.json"), "utf8"));
const slug = card.slug;

const contentPath = join(landingDir, "content", `${slug}.json`);
const content = existsSync(contentPath)
  ? JSON.parse(readFileSync(contentPath, "utf8"))
  : {};

const repoUrl = `https://github.com/vkogmail/lab/tree/main/apps/${slug}`;
const label = content.label ?? card.tags?.[0] ?? slug;
const headline = content.headline ?? card.title;
const lead = content.lead ?? card.intent;
const asideIntro = content.asideIntro ?? card.move;

const asideItems =
  content.aside ??
  [
    "Install the plugin from the repo manifest",
    card.move,
    "Runs inside the host app — this page is a static preview only",
  ];

const modalSections =
  content.modal ??
  [
    {
      title: "In the host app",
      body: `<p>${card.intent}</p>`,
    },
    {
      title: "This page",
      body: "<p>Static preview for the live demo URL. Clone the repo and load the plugin from <code>manifest.json</code> to use it on a real file.</p>",
    },
  ];

const heroSrc = join(landingDir, "heroes", `${slug}.jpg`);
const publicDir = join(appDir, "public");
const heroPath = join(publicDir, "hero.jpg");
if (existsSync(heroSrc)) {
  mkdirSync(publicDir, { recursive: true });
  copyFileSync(heroSrc, heroPath);
}

const heroAlt = content.heroAlt ?? `${card.title} plugin preview`;
const hero = existsSync(heroPath)
  ? `<figure class="hero-shot"><img src="/hero.jpg" alt="${esc(heroAlt)}" /></figure>`
  : `<figure class="hero-shot"><div class="hero-placeholder" aria-hidden="true"></div></figure>`;

let html = readFileSync(shellPath, "utf8");
html = html
  .replaceAll("{{repoUrl}}", esc(repoUrl))
  .replaceAll("{{title}}", esc(card.title))
  .replaceAll("{{intent}}", esc(card.intent))
  .replaceAll("{{label}}", esc(label))
  .replaceAll("{{headline}}", esc(headline))
  .replaceAll("{{lead}}", esc(lead))
  .replaceAll("{{asideIntro}}", esc(asideIntro))
  .replaceAll("{{asideList}}", asideItems.map((t) => `<li>${esc(t)}</li>`).join("\n                    "))
  .replaceAll(
    "{{modalSections}}",
    modalSections
      .map(
        (s) => `<div class="explanation-section">
                <h3>${esc(s.title)}</h3>
                ${s.body}
            </div>`
      )
      .join("\n\n            ")
  )
  .replaceAll("{{hero}}", hero);

writeFileSync(join(appDir, outName), html);
console.log(`[landing] wrote ${outName} for ${slug}${existsSync(heroPath) ? " (+ hero.jpg)" : ""}`);

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
