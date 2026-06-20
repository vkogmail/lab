#!/usr/bin/env node
/**
 * Download book cover JPEGs from Open Library and write public/assets/covers/manifest.json
 * Usage: node scripts/download-covers.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(__dirname, '..');
const outDir = path.join(appRoot, 'public/assets/covers');
const sourcePath = path.join(__dirname, 'covers-source.json');

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const MIN_BYTES = 8000;
const covers = [];

for (const item of source) {
  const url = `https://covers.openlibrary.org/b/isbn/${item.isbn}-L.jpg?default=false`;
  const dest = path.join(outDir, `${item.id}.jpg`);

  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      console.warn(`skip ${item.id} (${item.isbn}): HTTP ${res.status}`);
      continue;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES) {
      console.warn(`skip ${item.id}: only ${buf.length} bytes`);
      continue;
    }

    fs.writeFileSync(dest, buf);
    covers.push({
      id: item.id,
      file: `/assets/covers/${item.id}.jpg`,
      isbn: item.isbn,
      title: item.title,
      author: item.author,
    });
    console.log(`ok  ${item.title}`);
  } catch (err) {
    console.warn(`fail ${item.id}: ${err.message}`);
  }
}

const manifest = {
  source: 'Open Library — https://openlibrary.org/dev/docs/api/covers',
  note: 'Cover thumbnails for bibliographic illustration in a color-extraction demo.',
  covers,
};

fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`\nDownloaded ${covers.length} covers → ${outDir}`);

if (covers.length < 50) {
  console.error(`Warning: ${covers.length} covers downloaded — expected ~60; add ISBNs to covers-source.json`);
  process.exitCode = 1;
}
