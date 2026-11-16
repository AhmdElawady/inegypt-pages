// /privacy.html and /terms.html: the app's bundled legal pages, byte for byte, plus the site footer
// between two markers (Plan 47 §10.1). scripts/check-legal.mjs removes the marked block and compares bytes.
// Addresses never change: the app links to them. The plain summary box (Plan 46 §4.5) comes in phase 6.
import fs from "node:fs";

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

export const data = {
  pagination: { data: "legalDocs", size: 1, alias: "doc" },
  legalDocs: ["privacy", "terms"],
  permalink: (d) => `/${d.doc}.html`,
  eleventyExcludeFromCollections: true,
};

export function render({ doc }) {
  const bundled = fs.readFileSync(`src/legal/${doc}.bundled.html`, "utf8");
  const i = bundled.lastIndexOf("</body>");
  if (i < 0) throw new Error(`${doc}: no </body> in the bundled file`);
  return bundled.slice(0, i) + FOOTER(doc) + bundled.slice(i);
}
