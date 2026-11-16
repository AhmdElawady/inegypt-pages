// The hosted privacy and terms pages must equal the app's bundled copies byte for byte, apart from the marked
// site footer (Plan 47 §10.1, §11 phase 1). Also warns if src/legal/ is behind the app repo.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
const APP = process.env.INEGYPT_APP_REPO || path.join(os.homedir(), "Desktop/InEgyptUI");
let fail = 0;
for (const doc of ["privacy", "terms"]) {
  const built = fs.readFileSync(`_site/${doc}.html`);
  const bundled = fs.readFileSync(`src/legal/${doc}.bundled.html`);
  let s = built.toString("utf8");
  let missing = false;
  for (const part of ["site-box", "site-footer"]) {   // site parts between markers are removed before comparing
    const a = s.indexOf(`<!-- ${part}:start -->`), end = `<!-- ${part}:end -->\n`, b = s.indexOf(end);
    if (a < 0 || b < 0) { console.log(`FAIL ${doc}: ${part} markers missing`); fail++; missing = true; break; }
    s = s.slice(0, a) + s.slice(b + end.length);
  }
  if (missing) continue;
  const stripped = Buffer.from(s, "utf8");
  const same = Buffer.compare(stripped, bundled) === 0;
  console.log(`${same ? "ok  " : "FAIL"} ${doc}.html equals src/legal/${doc}.bundled.html outside the site box and footer (${bundled.length} bytes)`);
  if (!same) fail++;
  const appFile = path.join(APP, `InEgypt/Resources/${doc}.html`);
  if (fs.existsSync(appFile)) {
    const inApp = Buffer.compare(fs.readFileSync(appFile), bundled) === 0;
    console.log(`${inApp ? "ok  " : "FAIL"} src/legal/${doc}.bundled.html equals the app's ${doc}.html${inApp ? "" : " — run npm run sync"}`);
    if (!inApp) fail++;
  } else console.log(`--   app repo not found; skipped the sync check for ${doc}`);
}
if (fail) { console.error(`check-legal: ${fail} problem(s)`); process.exit(1); }
console.log("check-legal: pass");
