// Static QR codes for desktop install (P1 M1), made at build time from the campaign link (§9.6).
import QRCode from "qrcode";
import { appLink } from "../../eleventy.config.js";
const CAMPAIGNS = ["web_home_hero_qr", "web_home_final_qr", "web_ar_home_hero_qr", "web_ar_home_final_qr", "web_guide_airport_qr", "web_guide_metro_qr", "web_guide_prices_qr"];
export default async function () {
  const out = {};
  for (const ct of CAMPAIGNS) {
    out[ct] = (await QRCode.toString(appLink(ct), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#17130E", light: "#0000" } }))
      .replace("<svg ", '<svg class="qr__code" aria-hidden="true" focusable="false" ');
  }
  return out;
}
