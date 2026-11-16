// /privacy.html and /terms.html: the app's bundled legal pages, byte for byte, plus the site footer
// between two markers (Plan 47 §10.1). scripts/check-legal.mjs removes the marked block and compares bytes.
// Addresses never change: the app links to them. The plain summary box (Plan 46 §4.5) comes in phase 6.
import fs from "node:fs";
const facts = JSON.parse(fs.readFileSync("src/_data/facts.json", "utf8"));
const P = facts.prices, MAIL = facts.site.contactEmail.value;

const FOOTER = (doc) => `<!-- site-footer:start -->
<hr class="divider">
<div style="text-align:center; font-size:14px; color:var(--muted); padding-top:8px;">
    <p><a href="index.html">Home</a> &nbsp;&middot;&nbsp; ${doc === "privacy"
      ? '<a href="terms.html">Terms of Service</a>'
      : '<a href="privacy.html">Privacy Policy</a>'} &nbsp;&middot;&nbsp; <a href="support.html">Support</a></p>
    <p style="margin-top:8px;">&copy; ${new Date().getUTCFullYear()} InEgypt. All rights reserved.</p>
</div>
<!-- site-footer:end -->
`;

// Plain summary box above the legal text (Plan 46 §4.5), a site part like the footer. It must match the App Privacy
// answers (Marketing/AppStore/app-privacy-answers.md) and the fact sheet. No Trip Pass line while passes are off sale.
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
        <li>InEgypt Pro is an optional subscription, ${P.proMonthly.value} a month or ${P.proYearly.value} a year in the US (your App Store shows your price). It adds offline routes and Discover, more automatic plans, trip weather and expenses.</li>
        <li>Subscriptions renew automatically. Cancel any time in iOS Settings → your name → Subscriptions; Pro stays on until the end of the paid period.</li>
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
