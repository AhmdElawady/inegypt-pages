// InEgypt website (Plan 47 §10.1). Source in src/, output in _site/.
// The site address lives in one place: src/_data/facts.json → site.url + site.pathPrefix (§9.5).
import crypto from "node:crypto";
import fs from "node:fs";
import { fillFacts, proPrices } from "./src/_lib/facts-text.js";

const facts = JSON.parse(fs.readFileSync("src/_data/facts.json", "utf8"));
const SITE_URL = facts.site.url.value;            // https://ahmdelawady.github.io
const PATH_PREFIX = facts.site.pathPrefix.value;  // /inegypt-pages/

/** App Store link with campaign token (§9.6). `pt` is added once D4 gives the provider ID. */
export function appLink(ct) {
  const base = facts.app.appStoreUrl.value;
  const pt = facts.app.campaignProviderId_pt.value;
  const params = new URLSearchParams();
  if (pt) params.set("pt", String(pt));
  if (ct) params.set("ct", ct);
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets/fonts": "assets/fonts" });
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "assets/img" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/badges": "assets/badges" });
  eleventyConfig.addPassthroughCopy({ "src/assets/logo": "assets/logo" });
  eleventyConfig.addPassthroughCopy({ "src/assets/icons": "assets/icons" });
  eleventyConfig.addPassthroughCopy({ "src/assets/share": "assets/share" });

  // Bundled legal copies are data, not templates.
  eleventyConfig.ignores.add("src/legal/**");
  eleventyConfig.watchIgnores.add("src/assets/img/**");

  eleventyConfig.addGlobalData("siteUrl", SITE_URL);
  eleventyConfig.addGlobalData("pathPrefix", PATH_PREFIX);

  // Cache busting: ?v=<hash of the sources> on site.css and site.js, so a long browser cache never serves an old file.
  const hashOf = (files) => crypto.createHash("sha256").update(files.map((f) => fs.readFileSync(f)).join("")).digest("hex").slice(0, 10);
  const CSS_DIR = "src/_includes/css/";
  eleventyConfig.addGlobalData("assetVersion", () => ({
    css: hashOf(fs.readdirSync(CSS_DIR).filter((f) => f.endsWith(".css")).sort().map((f) => CSS_DIR + f)),
    js: hashOf(["src/assets/js/site.js"]),
  }));

  // Minify the one stylesheet: drop comments and collapse whitespace. Conservative on purpose: spaces around ":" are kept,
  // because ".a :is(.b)" and ".a:is(.b)" are different selectors.
  eleventyConfig.addTransform("minify-css", function (content) {
    if (!this.page.outputPath || !this.page.outputPath.endsWith(".css")) return content;
    return content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{};,>])\s*/g, "$1").replace(/;}/g, "}").trim();
  });

  // Language pairs, read from each page's front matter (altUrls: { en, ar }), the same data that makes the hreflang links.
  // localUrl("/features/", "ar") → "/ar/features/" when an Arabic copy exists, else the English URL unchanged.
  const enToAr = new Map();
  eleventyConfig.addCollection("i18nPairs", (api) => {
    enToAr.clear();
    for (const item of api.getAll()) if (item.data.altUrls) enToAr.set(item.data.altUrls.en, item.data.altUrls.ar);
    return [];
  });
  eleventyConfig.addFilter("localUrl", (path, lang) => {
    if (lang !== "ar") return path;
    const [base, hash] = String(path).split("#");
    return enToAr.has(base) ? enToAr.get(base) + (hash ? "#" + hash : "") : path;
  });

  eleventyConfig.addFilter("appLink", appLink);
  eleventyConfig.addFilter("absUrl", (path) => SITE_URL + PATH_PREFIX.replace(/\/$/, "") + path);
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  // Price text from an atom: "250–500 EGP", "700 EGP", "10–15 %" (never typed by hand, Plan 46 §4.1 rule 3).
  eleventyConfig.addFilter("priceText", (a) => {
    if (!a || a.min == null) return "";
    const range = a.min === a.max ? `${a.min}` : `${a.min}–${a.max}`;
    return a.unit === "percent" ? `${range} %` : `${range} ${a.currency || ""}`.trim();
  });
  eleventyConfig.addFilter("unitText", (u, lang = "en") => ({
    en: { per_hour: "per hour", per_day: "per day", percent: "of the bill" },
    ar: { per_hour: "في الساعة", per_day: "في اليوم", percent: "من الحساب" } }[lang] || {})[u] || "");
  // Metro fare bands parsed from the published atom's own note ("1–9 stations: 10 · 10–16: 12 · …").
  eleventyConfig.addFilter("fareBands", (note) => [...String(note).matchAll(/(\d+)–(\d+)(?: stations)?: (\d+)/g)].map((m) => ({ from: m[1], to: m[2], fare: m[3] })));
  // Price atoms for the price guide, grouped by topic, without the ones kept off the site (facts.knowledge.notForTheSite).
  eleventyConfig.addFilter("priceGroups", (atoms, groups, exclude = []) => {
    const off = new Set(exclude);
    return groups.map((g) => ({ ...g, rows: Object.entries(atoms)
      .filter(([id, a]) => a.kind === "price" && a.topic === g.topic && a.siteUsable && !off.has(id))
      .sort((x, y) => (x[1].rank ?? 999) - (y[1].rank ?? 999))
      .map(([id, a]) => ({ id, ...a })) })).filter((g) => g.rows.length);
  });
  // Guide cards. Arabic pages link to the Arabic guide when index[slug].ar exists, otherwise to the English one, marked as such.
  const guideCard = (s, g, lang) => (lang === "ar" && g.ar
    ? { href: `/ar/guides/${s}/`, title: g.ar.title, meta: g.ar.short }
    : { href: `/guides/${s}/`, title: g.title, meta: lang === "ar" ? `${g.short} · بالإنجليزية` : g.short, lang: lang === "ar" ? "en" : "" });
  eleventyConfig.addFilter("relatedGuides", (slugs, index, lang = "en") => slugs.map((s) => guideCard(s, index[s], lang)));
  eleventyConfig.addFilter("priceIds", (groups) => groups.flatMap((g) => g.rows.map((r) => r.id)));
  eleventyConfig.addFilter("guideList", (index, lang = "en") => Object.entries(index).filter(([k]) => !k.startsWith("_"))
    .map(([s, g]) => guideCard(s, g, lang)).sort((a, b) => (a.lang ? 1 : 0) - (b.lang ? 1 : 0)));
  eleventyConfig.addFilter("atomKinds", (atoms) => Object.values(atoms).reduce((c, a) => ((c[a.kind] = (c[a.kind] || 0) + 1), c), {}));
  eleventyConfig.addFilter("maxDate", (ids, atoms) => ids.map((id) => atoms[id]?.lastVerifiedAt).filter(Boolean).sort().pop());
  // "{cities}" / "{monthly}" style tokens and the Pro price phrase come from src/_lib/facts-text.js (facts.json).
  eleventyConfig.addFilter("fillFacts", fillFacts);
  eleventyConfig.addFilter("proPrices", (lang) => proPrices(lang));
  // "2026-08-21" → "Aug 2026" (en) / "أغسطس 2026" with Western digits (ar)
  const fmt = {
    en: new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }),
    ar: new Intl.DateTimeFormat("ar-EG-u-nu-latn", { month: "short", year: "numeric", timeZone: "UTC" }),
  };
  eleventyConfig.addFilter("monthYear", (iso, lang = "en") => (iso ? (fmt[lang] || fmt.en).format(new Date(iso + "T00:00:00Z")) : ""));

  // Icon from the generated external sprite (scripts/build-icons.mjs → assets/icons/sprite.svg, cached once).
  eleventyConfig.addShortcode("icon", (name, label = "") => {
    const a11y = label ? `role="img" aria-label="${label}"` : `aria-hidden="true" focusable="false"`;
    return `<svg class="icon" ${a11y}><use href="${PATH_PREFIX}assets/icons/sprite.svg#i-${name}"></use></svg>`;
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix: PATH_PREFIX,
    templateFormats: ["njk", "11ty.js", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
