// InEgypt website (Plan 47 §10.1). Source in src/, output in _site/.
// The site address lives in one place: src/_data/facts.json → site.url + site.pathPrefix (§9.5).
import fs from "node:fs";
import QRCode from "qrcode";

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

  // Bundled legal copies are data, not templates.
  eleventyConfig.ignores.add("src/legal/**");
  eleventyConfig.watchIgnores.add("src/assets/img/**");

  eleventyConfig.addGlobalData("siteUrl", SITE_URL);
  eleventyConfig.addGlobalData("pathPrefix", PATH_PREFIX);

  eleventyConfig.addFilter("appLink", appLink);
  eleventyConfig.addFilter("absUrl", (path) => SITE_URL + PATH_PREFIX.replace(/\/$/, "") + path);
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  // Free/paid table rows from the fact sheet: free items are in both columns, paid items only in Pro.
  eleventyConfig.addFilter("plansRows", (f) => [
    ...f.free.value.map((label) => ({ label, free: true, pro: true })),
    ...f.paid.value.map((label) => ({ label, free: false, pro: true })),
  ]);
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

  // Static QR code (P1 M1), built at build time; no script, no third-party request.
  eleventyConfig.addAsyncShortcode("qr", async (url, label = "Scan with your iPhone") => {
    const svg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#17130E", light: "#0000" } });
    return svg.replace("<svg ", `<svg role="img" aria-label="${label}" class="qr__code" `);
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix: PATH_PREFIX,
    templateFormats: ["njk", "11ty.js", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
