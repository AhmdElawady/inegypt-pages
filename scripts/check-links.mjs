// Every internal link resolves, every #anchor exists on its target page, and every hreflang pair points both ways.
// Runs on the built site (_site). Part of `npm run check`.
import fs from "node:fs";
import path from "node:path";

const facts = JSON.parse(fs.readFileSync("src/_data/facts.json", "utf8"));
const SITE = "_site";
const PREFIX = facts.site.pathPrefix.value;                      // /inegypt-pages/
const ORIGIN = facts.site.url.value + PREFIX.replace(/\/$/, ""); // https://…/inegypt-pages

const pages = new Map(); // site-relative URL ("/ar/about/") → html
for (const rel of fs.readdirSync(SITE, { recursive: true })) {
  if (!rel.endsWith(".html")) continue;
  const url = "/" + rel.replace(/\\/g, "/").replace(/index\.html$/, "");
  pages.set(url, fs.readFileSync(path.join(SITE, rel), "utf8"));
}
const exists = (url) => pages.has(url) || fs.existsSync(path.join(SITE, decodeURIComponent(url)));
const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const alternates = (html) => Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="(\w+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]));

let fail = 0, links = 0;
const problem = (msg) => { fail++; console.log("FAIL " + msg); };

for (const [url, html] of pages) {
  // 1. internal links and their anchors
  for (const [, href] of html.matchAll(/\shref="([^"]+)"/g)) {
    let target;
    if (href.startsWith(PREFIX)) target = "/" + href.slice(PREFIX.length);
    else if (href.startsWith("#")) target = url + href;
    else continue; // external, mailto:, App Store
    links++;
    const [pq, hash] = target.split("#");
    const p = pq.split("?")[0];
    if (!exists(p)) { problem(`${url}: link to missing page ${href}`); continue; }
    if (hash && pages.has(p) && !ids(pages.get(p)).has(decodeURIComponent(hash))) problem(`${url}: link to missing anchor ${href}`);
  }
  // 2. hreflang pairs: each alternate exists and lists this page back
  const alt = alternates(html);
  for (const [lang, abs] of Object.entries(alt)) {
    if (lang === "x-default") continue;
    const p = abs.replace(ORIGIN, "");
    if (!pages.has(p)) { problem(`${url}: hreflang ${lang} points to missing ${p}`); continue; }
    const back = alternates(pages.get(p));
    if (Object.values(back).every((a) => a.replace(ORIGIN, "") !== url)) problem(`${url}: hreflang ${lang} → ${p} does not point back`);
  }
  // 3. Arabic pages: a link marked "(بالإنجليزية)" must really go to an English page
  if (/<html lang="ar"/.test(html)) {
    for (const [, href, text] of html.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([^<]*بالإنجليزية[^<]*)<\/a>/g)) {
      if (href.startsWith(PREFIX + "ar/")) problem(`${url}: "${text.trim()}" is marked English but links to the Arabic page ${href}`);
    }
  }
}
if (fail) { console.error(`check-links: ${fail} problem(s)`); process.exit(1); }
console.log(`check-links: ${links} internal links and every hreflang pair resolve on ${pages.size} pages`);
