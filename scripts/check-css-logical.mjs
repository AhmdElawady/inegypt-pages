// No physical-direction CSS in components (Plan 47 §8.7). Gradient directions and :dir(rtl) overrides are allowed.
import fs from "node:fs";
const FILES = ["src/_includes/css/base.css", "src/_includes/css/components.css"];
const RULES = [
  /\b(margin|padding|border)-(left|right)\b/, /(^|[\s;{])(left|right)\s*:/, /text-align\s*:\s*(left|right)/,
  /float\s*:\s*(left|right)/, /clear\s*:\s*(left|right)/, /border-(top|bottom)-(left|right)-radius/,
];
let fail = 0;
for (const f of FILES) {
  fs.readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    if (line.includes("physical-ok")) return;
    for (const r of RULES) if (r.test(line)) { fail++; console.log(`FAIL ${f}:${i + 1}: ${line.trim()}`); }
  });
}
if (fail) { console.error(`check-css-logical: ${fail} physical propert${fail === 1 ? "y" : "ies"}`); process.exit(1); }
console.log(`check-css-logical: ${FILES.length} files use logical properties only`);
