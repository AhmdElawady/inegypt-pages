// Fail the build if an output page says something the app does not do (Plan 47 §10.1, Plan 46 "never write").
// Legal pages are excluded: they are byte copies of the app's bundled text and are checked by check-legal.mjs.
import fs from "node:fs";
import path from "node:path";
const facts = JSON.parse(fs.readFileSync("src/_data/facts.json", "utf8"));
const SITE = "_site";
const EXCLUDE = new Set(["privacy.html", "terms.html"]);

// Allowed sentences are removed before the banned list is applied.
const ALLOWED = [/is there an android version\?/gi, /توجد نسخة android/gi, /no live tracking/gi, /no android version/gi, /not on android/gi, /no android/gi, /there is no android/gi];
const BANNED = [
  [/free trial/i, "free trial"], [/7[\s-]days? free/i, "7 days free"], [/real[\s-]?time/i, "real-time"],
  [/live tracking/i, "live tracking"], [/\blive (bus|train|metro) /i, "live vehicles"], [/100\s?% offline/i, "100% offline"],
  [/works fully offline/i, "works fully offline"], [/\bandroid\b/i, "Android"], [/lifetime/i, "Lifetime"],
  [/book tickets in the app/i, "ticket sales"], [/all of egypt'?s buses/i, "all buses"], [/900\+/, "900+ stops (the count is 897)"],
  [/family sharing/i, "Family Sharing (F4: unknown)"], [/\bweekly plan\b/i, "weekly product (F3)"],
  [/seamless/i, "voice: seamless"], [/\bultimate\b/i, "voice: ultimate"], [/ai-powered/i, "voice: AI-powered"],
  [/hidden gems?/i, "voice: hidden gems"], [/like a local/i, "voice: like a local"],
  [/تجربة مجانية/, "free trial (ar)"], [/مدى الحياة/, "lifetime (ar)"],
];
if (!facts.prices.passesOnSale.value) BANNED.push([/trip pass/i, "Trip Pass while passes are not on sale (D6)"], [/تذكرة الرحلة|باقة الرحلة/, "Trip Pass (ar)"]);
for (const [key, label] of [["widgets", "widgets"], ["liveActivity", "Live Activity"], ["controlCenter", "Control Center"]]) {
  if (!facts.iphoneFeatures[key].onSite) BANNED.push([key === "widgets" ? /\bwidgets?\b/i : key === "liveActivity" ? /live activit/i : /control cent(er|re)/i, `${label} (F5: not confirmed shipping)`]);
}
if (!facts.privacy.adSdk.display) BANNED.push([/no advertising sdk/i, "ad SDK line without F6"]);

const text = (html) => html
  .replace(/<script(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/<(meta|img)\b[^>]*?(content|alt)="([^"]*)"[^>]*>/gi, " $3 ")
  .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, " ");

let problems = 0, files = 0;
for (const rel of fs.readdirSync(SITE, { recursive: true })) {
  if (!rel.endsWith(".html") || EXCLUDE.has(rel)) continue;
  files++;
  let t = text(fs.readFileSync(path.join(SITE, rel), "utf8"));
  for (const a of ALLOWED) t = t.replace(a, " ");
  for (const [re, label] of BANNED) {
    const m = t.match(re);
    if (m) { problems++; const i = m.index; console.log(`FAIL ${rel}: ${label} — "…${t.slice(Math.max(0, i - 50), i + 60).trim()}…"`); }
  }
}
if (problems) { console.error(`check-claims: ${problems} problem(s) in ${files} page(s)`); process.exit(1); }
console.log(`check-claims: ${files} page(s) clean (${BANNED.length} rules; legal pages excluded)`);
