// Inline SVG line art (src/assets/art/*.svg) for templates: {{ art.pyramids | safe }}.
// The current set is agent-drawn PLACEHOLDER art; the Claude Design set (Plan 47 §7.3 brief 1) replaces the files.
import fs from "node:fs";
const dir = new URL("../assets/art/", import.meta.url);
const out = {};
for (const f of fs.readdirSync(dir)) if (f.endsWith(".svg"))
  out[f.replace(/\.svg$/, "").replace(/-(\w)/g, (_, c) => c.toUpperCase())] = fs.readFileSync(new URL(f, dir), "utf8").trim()
    .replace("<svg ", '<svg aria-hidden="true" focusable="false" ').replace(/<title>[^<]*<\/title>/, "");
export default out;
