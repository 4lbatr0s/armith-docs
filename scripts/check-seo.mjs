#!/usr/bin/env node
/**
 * After `npm run build`: every page has exactly one canonical, one og:title and one og:description,
 * the canonical matches the page's own path, and Learn pages carry valid JSON-LD.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = '.vitepress/dist';
const HOST = 'https://armith-docs-standalone.onrender.com';
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const pages = walk(dist).filter((f) => f.endsWith('.html') && !f.endsWith('404.html'));
let bad = 0;
const fail = (m) => { bad += 1; console.error('FAIL', m); };

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const rel = file.slice(dist.length + 1);
  const count = (re) => (html.match(re) || []).length;
  if (count(/<link rel="canonical"/g) !== 1) fail(`${rel}: canonical count ${count(/<link rel="canonical"/g)}`);
  if (count(/property="og:title"/g) !== 1) fail(`${rel}: og:title count ${count(/property="og:title"/g)}`);
  if (count(/property="og:description"/g) !== 1) fail(`${rel}: og:description count ${count(/property="og:description"/g)}`);
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const expected = rel === 'index.html' ? `${HOST}/` : rel.endsWith('/index.html') ? `${HOST}/${rel.slice(0, -'index.html'.length)}` : `${HOST}/${rel.replace(/\.html$/, '')}`;
  if (canonical !== expected) fail(`${rel}: canonical ${canonical} expected ${expected}`);
  if (/^(tr\/)?learn\//.test(rel) || rel === 'tr/tc-kimlik-dogrulama.html') {
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!m) { fail(`${rel}: no JSON-LD`); continue; }
    try {
      const j = JSON.parse(m[1]);
      if (j['@type'] !== 'TechArticle' || !j.headline || !j.description || j.url !== canonical) fail(`${rel}: JSON-LD incomplete`);
    } catch (e) { fail(`${rel}: JSON-LD does not parse`); }
  }
}
console.log(`checked ${pages.length} pages, ${bad} problems`);
process.exit(bad ? 1 : 0);
