// Build the inline SVG sprite from Phosphor Icons (MIT), Plan 47 §2.5.
// Regular weight for lists, fill weight for tiles. Add a name here to use it with {% icon "name" %}.
import fs from "node:fs";
const ROOT = "node_modules/@phosphor-icons/core/assets";
const REGULAR = ["map-trifold", "path", "tag", "shield-check", "train", "train-simple", "tram", "bus", "airplane",
  "compass", "magnifying-glass", "microphone", "wifi-slash", "translate", "check", "x", "tilde", "arrow-right",
  "arrow-left", "caret-down", "caret-right", "caret-left", "list", "copy", "share-network", "globe", "calendar-blank",
  "clock", "map-pin", "lightbulb", "warning", "phone", "sparkle", "device-mobile", "check-circle", "x-circle",
  "question", "envelope-simple", "qr-code", "lock-simple", "receipt", "ticket", "taxi", "first-aid", "boat",
  "storefront", "cloud-sun", "list-checks", "clipboard-text", "user", "instagram-logo", "facebook-logo"];
const FILL = ["map-trifold", "path", "tag", "shield-check", "check-circle", "x-circle", "sparkle", "warning",
  "map-pin", "train", "tram", "bus", "airplane", "device-mobile", "microphone", "wifi-slash", "translate", "arrow-circle-down", "android-logo"];
const inner = (file) => fs.readFileSync(file, "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
let out = '<svg xmlns="http://www.w3.org/2000/svg">\n';
for (const n of REGULAR) out += `<symbol id="i-${n}" viewBox="0 0 256 256" fill="currentColor">${inner(`${ROOT}/regular/${n}.svg`)}</symbol>\n`;
for (const n of FILL) out += `<symbol id="i-${n}-fill" viewBox="0 0 256 256" fill="currentColor">${inner(`${ROOT}/fill/${n}-fill.svg`)}</symbol>\n`;
out += "</svg>\n";
fs.mkdirSync("src/assets/icons", { recursive: true });
fs.writeFileSync("src/assets/icons/sprite.svg", out);
console.log(`sprite.svg: ${REGULAR.length} regular + ${FILL.length} fill symbols, ${(out.length / 1024).toFixed(1)} KB`);
