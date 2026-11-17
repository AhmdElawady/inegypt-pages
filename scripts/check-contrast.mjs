// Re-check every text/background token pair (Plan 47 §8.1, §10.5). Fails under 4.5:1 for text, 3:1 for UI shapes.
import fs from "node:fs";
const css = fs.readFileSync("src/_includes/css/tokens.css", "utf8");
function block(selector) {
  const m = css.match(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{([\\s\\S]*?)\\n\\}"));
  const vars = {};
  for (const [, k, v] of m[1].matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g)) vars[k] = v;
  return vars;
}
const light = block(":root");
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const TEXT = 4.5, UI = 3.0;
const pairs = [
  // [foreground, background, minimum, use]
  ["ink", "paper", TEXT, "body text"], ["ink", "surface", TEXT, "card text"], ["ink", "sand", TEXT, "band text"],
  ["ink-2", "paper", TEXT, "secondary text"], ["ink-2", "surface", TEXT, "secondary on cards"], ["ink-2", "sand", TEXT, "secondary on sand"],
  ["link", "paper", TEXT, "links"], ["link", "surface", TEXT, "links on cards"], ["link", "sand", TEXT, "links on sand"],
  ["on-action", "action", TEXT, "button label"],
  ["plan", "paper", TEXT, "plan colour text"], ["route", "paper", TEXT, "route colour text"], ["price", "paper", TEXT, "price colour text"],
  ["safe", "paper", TEXT, "safety colour text"], ["nile", "paper", TEXT, "Nile text"], ["dusk", "paper", TEXT, "dusk text"],
  ["plan", "surface", TEXT, "chip text on cards"], ["route", "surface", TEXT, "x mark on cards"],
  ["focus-ring", "paper", UI, "focus ring"], ["focus-ring", "surface", UI, "focus ring on cards"], ["focus-ring", "sand", UI, "focus ring on sand"],
  // home page palette
  ["teal-ink", "paper", TEXT, "home headings"], ["teal-ink", "teal-tint", TEXT, "headings on the tinted section"], ["teal-ink", "sand", TEXT, "headings on sand"],
  ["teal-muted", "paper", TEXT, "home reading text"], ["teal-muted", "teal-tint", TEXT, "text on the tinted section"], ["teal-muted", "sand", TEXT, "text on sand"],
  ["teal-muted", "plan-tint", TEXT, "paste note text"], ["teal-link", "paper", TEXT, "home links"], ["teal-link", "teal-tint", TEXT, "links on the tinted section"],
  ["teal-link", "sand", TEXT, "links on sand"], ["deep-ink", "deep", TEXT, "text on the dark band"], ["paper", "deep", TEXT, "headings on the dark band"],
  ["deep-accent", "deep", UI, "icons on the dark band"], ["paper", "night", TEXT, "hero text (behind the photo overlay)"],
  // calm pass: home cards are soft grey or warm; the install band is neutral dark
  ["ink", "soft", TEXT, "card text on soft grey"], ["ink-2", "soft", TEXT, "secondary on soft grey"], ["link", "soft", TEXT, "links on soft grey"],
  ["ink", "warm", TEXT, "card text on warm"], ["ink-2", "warm", TEXT, "secondary on warm"], ["action-deep", "warm", UI, "icons on warm"],
  ["action-deep", "soft", UI, "icons on soft grey"], ["action-deep", "paper", UI, "step icons on white"],
  ["deep-ink", "deep-neutral", TEXT, "text on the dark band"], ["paper", "deep-neutral", TEXT, "headings on the dark band"], ["deep-accent", "deep-neutral", UI, "icons on the dark band"],
];
// Reported, not enforced: #F25C00 is used for fills, the logo and decorative shapes, never alone to convey state (§2.2).
const INFO = [["action", "paper", "orange fills on paper"], ["action", "surface", "orange fills on cards"],
];
let fail = 0;
for (const [name, t] of [["light", light]]) {
  for (const [fg, bg, min, use] of pairs) {
    if (!t[fg] || !t[bg]) { console.log(`?? ${name} ${fg}/${bg}: token missing`); fail++; continue; }
    const r = ratio(t[fg], t[bg]);
    const ok = r >= min - 1e-9;
    if (!ok) fail++;
    console.log(`${ok ? "ok  " : "FAIL"} ${name.padEnd(5)} ${(fg + " on " + bg).padEnd(22)} ${r.toFixed(2)}:1 (min ${min}) ${use}`);
  }
}
for (const [name, t] of [["light", light]]) for (const [fg, bg, use] of INFO) console.log(`info ${name.padEnd(5)} ${(fg + " on " + bg).padEnd(22)} ${ratio(t[fg], t[bg]).toFixed(2)}:1 ${use} (decorative)`);
if (fail) { console.error(`check-contrast: ${fail} pair(s) below the minimum`); process.exit(1); }
console.log("check-contrast: all pairs pass");
