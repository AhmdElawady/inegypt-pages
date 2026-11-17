// Static QR codes for desktop install (P1 M1), made at build time from the campaign link (§9.6).
import QRCode from "qrcode";
import { appLink } from "../../eleventy.config.js";
// Every "web_…_qr" campaign named in a template gets a code, so a new page cannot ship without its QR.
import fs from "node:fs";
const SRC = new URL("../", import.meta.url);
const CAMPAIGNS = [...new Set(fs.readdirSync(SRC, { recursive: true })
  .filter((f) => f.endsWith(".njk") && !f.startsWith("_data"))
  .flatMap((f) => fs.readFileSync(new URL(f, SRC), "utf8").match(/\bweb_[a-z_]+_qr\b/g) || [])
)].sort();
export default async function () {
  const out = {};
  for (const ct of CAMPAIGNS) {
    out[ct] = (await QRCode.toString(appLink(ct), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#17130E", light: "#0000" } }))
      .replace("<svg ", '<svg class="qr__code" aria-hidden="true" focusable="false" ');
  }
  return out;
}
