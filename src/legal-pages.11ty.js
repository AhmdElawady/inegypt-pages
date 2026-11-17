// /privacy.html and /terms.html: the app's bundled legal pages, byte for byte, plus the site footer
// between two markers (Plan 47 §10.1). scripts/check-legal.mjs removes the marked block and compares bytes.
// Addresses never change: the app links to them. The plain summary box (Plan 46 §4.5) comes in phase 6.
import fs from "node:fs";
import { proPrices, hasOneTime } from "./_lib/facts-text.js";
const facts = JSON.parse(fs.readFileSync("src/_data/facts.json", "utf8"));
const MAIL = facts.site.contactEmail.value;

// The site footer, the same as on every other page (labels from strings/en.json, links relative to the site root):
// dark, light grey links that turn white on hover and for the page you are on, the logo in a soft pill on hover. Self-contained styles, since these
// pages keep the app's own stylesheet; the block breaks out of the 680 px column to run full width.
const T = JSON.parse(fs.readFileSync("src/_data/strings/en.json", "utf8")).footer, SOCIAL = facts.site.social;
const FOOTER = (doc) => {
  const link = (href, label, extra = "") => `<li><a href="${href}"${href === `${doc}.html` ? ' aria-current="page"' : ""}${extra}>${label}</a></li>`;
  return `<!-- site-footer:start -->
<style>
  .sf { margin: 64px calc(50% - 50vw) 0; padding: 56px max(16px, calc(50vw - 560px)) 28px; border-top: 1px solid rgba(255, 255, 255, .1); background: #101010; color: #E5E7EB; font-size: 14px; line-height: 1.5; }
  .sf a { color: #A6A7AB; text-decoration: none; transition: color .15s; }
  .sf a:hover, .sf a:focus-visible, .sf a[aria-current="page"] { color: #FFFFFF; }
  .sf a[aria-current="page"] { font-weight: 500; }
  .sf__grid { display: grid; gap: 32px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (min-width: 640px) { .sf__grid { grid-template-columns: 1.4fr repeat(4, minmax(0, 1fr)); } }
  .sf h2 { margin: 0 0 12px; font-size: 15px; color: #FFFFFF; }
  .sf ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .sf__logo { display: inline-flex; align-items: center; gap: 8px; padding: 4px 14px 4px 6px; margin-inline-start: -6px; border-radius: 999px; transition: background-color .15s;
    font: 700 20px/1 -apple-system, BlinkMacSystemFont, sans-serif; color: #FFFFFF !important; }
  .sf__logo:hover, .sf__logo:focus-visible { background: rgba(255, 255, 255, .08); }
  .sf__logo img { width: 32px; height: 32px; }
  .sf__tag { margin: 12px 0 0; color: #828385; }
  .sf__pro { display: inline-block; padding: 3px 6px; border-radius: 6px; color: #101010; font: 700 11px/1.1 ui-rounded, -apple-system, sans-serif; letter-spacing: .03em; background: linear-gradient(to top left, #CC4600, #F25C00); }
  .sf__base { margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, .12); display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: center; color: #828385; }
  .sf__social { display: flex; gap: 8px; }
  .sf__social a { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; }
</style>
<footer class="sf">
  <div class="sf__grid">
    <div><a class="sf__logo" href="./"><img src="assets/logo/mark-orange.svg" alt="" width="32" height="32"><span>InEgypt</span></a><p class="sf__tag">${T.tagline}</p></div>
    <div><h2>${T.app}</h2><ul>${link("features/", T.features)}${link("whats-new/", T.whatsNew)}${link("pro/", 'InEgypt <span class="sf__pro">PRO</span>', ' dir="ltr"')}${link("android/", T.android)}</ul></div>
    <div><h2>${T.guides}</h2><ul>${link("guides/", T.allGuides)}</ul></div>
    <div><h2>${T.about}</h2><ul>${link("about/", T.aboutPage)}${link("press/", T.press)}${link(`mailto:${MAIL}`, T.contact)}</ul></div>
    <div><h2>${T.legal}</h2><ul>${link("privacy.html", T.privacy)}${link("terms.html", T.terms)}${link("support.html", T.support)}</ul></div>
  </div>
  <div class="sf__base"><span>&copy; ${new Date().getUTCFullYear()} InEgypt</span><span class="sf__social">${[["instagram", "instagram-logo"], ["facebook", "facebook-logo"]].map(([k, icon]) =>
    `<a href="${SOCIAL[k].value}" rel="noopener" aria-label="${T[k]}"><svg width="22" height="22" aria-hidden="true" focusable="false"><use href="assets/icons/sprite.svg#i-${icon}"></use></svg></a>`).join("")}</span></div>
</footer>
<!-- site-footer:end -->
`;
};

// Plain summary box above the legal text (Plan 46 §4.5), a site part like the footer. It must match the App Privacy
// answers (Marketing/AppStore/app-privacy-answers.md) and the fact sheet. Prices come from facts-text.js, so off-sale options never appear.
const BOX_STYLE = "margin:0 0 32px;padding:20px 22px;border:1px solid var(--border);border-radius:14px;font-size:15px;line-height:1.6";
const BOX = {
  privacy: `<!-- site-box:start -->
<aside style="${BOX_STYLE}" aria-label="Summary in plain words">
    <p style="margin:0 0 8px;font-weight:700">In plain words</p>
    <ul style="margin:0;padding-inline-start:1.2em">
        <li>InEgypt is a free iPhone app for visiting and getting around Egypt. There is no account: we never ask for your name or email.</li>
        <li>No advertising SDK. InEgypt does not track you across other companies' apps or websites.</li>
        <li>Pseudonymous product analytics and crash reports help us improve the app. Turn them off in Settings → Help improve InEgypt; that also deletes anything recorded but not yet sent.</li>
        <li>Your location, the places you search between and your search text are never sent to analytics.</li>
        <li>Your trips, notes, expenses and saved places stay on your device.</li>
        <li>Questions or a request about your data: <a href="mailto:${MAIL}">${MAIL}</a>. The full policy follows.</li>
    </ul>
</aside>
<!-- site-box:end -->
`,
  terms: `<!-- site-box:start -->
<aside style="${BOX_STYLE}" aria-label="Summary in plain words">
    <p style="margin:0 0 8px;font-weight:700">In plain words</p>
    <ul style="margin:0;padding-inline-start:1.2em">
        <li>InEgypt is free to download. Routes, places, the price guide and trip planning are free.</li>
        <li>InEgypt Pro is optional: ${proPrices("en", false)} in the US (your App Store shows your price). It adds offline routes and Discover, more automatic plans, a 10-day weather forecast and expenses.</li>
        <li>Subscriptions renew automatically. Cancel any time in iOS Settings → your name → Subscriptions; Pro stays on until the end of the paid period.${hasOneTime() ? " One-time purchases do not renew." : ""}</li>
        <li>To restore a purchase: in the app, Settings → Your Plan → Restore Purchases.</li>
        <li>Questions: <a href="mailto:${MAIL}">${MAIL}</a>. The full terms follow.</li>
    </ul>
</aside>
<!-- site-box:end -->
`,
};

export const data = {
  pagination: { data: "legalDocs", size: 1, alias: "doc" },
  legalDocs: ["privacy", "terms"],
  permalink: (d) => `/${d.doc}.html`,
  eleventyExcludeFromCollections: true,
};

export function render({ doc }) {
  const bundled = fs.readFileSync(`src/legal/${doc}.bundled.html`, "utf8");
  const i = bundled.lastIndexOf("</body>");
  const m = bundled.match(/<body[^>]*>\n/);
  if (i < 0 || !m) throw new Error(`${doc}: no <body> or </body> in the bundled file`);
  const top = m.index + m[0].length;
  return bundled.slice(0, top) + BOX[doc] + bundled.slice(top, i) + FOOTER(doc) + bundled.slice(i);
}
