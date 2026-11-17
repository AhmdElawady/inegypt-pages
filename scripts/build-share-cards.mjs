// Share cards, 1200 × 630 PNG (Plan 47 §7.4): station photograph, logo, page title (≤ 8 words), one photo, the line motif.
// Run: npm run share. Output: src/assets/share/<name>.png (each < 300 KB).
import fs from "node:fs";
import sharp from "sharp";

const CARDS = [
  { name: "home", title: ["Plan your Egypt trip.", "Get around with", "confidence."], sub: ["Day-by-day trip plans, metro and train", "routes, fair prices. Free on iPhone."], photo: "photos/P19", position: "centre" },
];
// Arabic home card: mirrored, words taken from src/_data/home/ar.json (the owner's copy), not written here.
const ar = JSON.parse(fs.readFileSync("src/_data/home/ar.json", "utf8"));
CARDS.push({ name: "home-ar", rtl: true, title: ar.hero.h1.split(/(?<=\.)\s+/), sub: [ar.hero.underBadge], photo: "photos/P19", position: "centre" });
const images = JSON.parse(fs.readFileSync("src/_data/images.json", "utf8"));
const mark = fs.readFileSync("src/assets/logo/mark-orange.svg", "utf8").replace(/^<svg[^>]*>/, "").replace("</svg>", "");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
fs.mkdirSync("src/assets/share", { recursive: true });

for (const c of CARDS) {
  const im = images[c.photo];
  const photo = await sharp(`src/assets/img/${im.dir}/${im.base}-1024.jpg`).resize(480, 630, { fit: "cover", position: c.position || "right" })
    .composite([{ input: Buffer.from(c.rtl
      ? '<svg width="480" height="630"><polygon points="28,0 480,0 480,630 0,630 0,28" fill="#fff"/></svg>'
      : '<svg width="480" height="630"><polygon points="0,0 452,0 480,28 480,630 0,630" fill="#fff"/></svg>'), blend: "dest-in" }])
    .png().toBuffer();
  const R = !!c.rtl;                       // RTL: photo on the left, text anchored at the right edge
  const tx = R ? 1104 : 96, anchor = R ? "end" : "start", photoLeft = R ? 0 : 720;
  const lineX = R ? 1142 : 56;
  const font = R ? "SF Arabic Rounded, SF Arabic, Rubik, Geeza Pro, Arial" : "SF Pro Rounded, Rubik, Helvetica, Arial";
  const bodyFont = R ? "SF Arabic, Geeza Pro, Arial" : "SF Pro Text, Helvetica, Arial";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#EFF4F4"/>
  <rect x="${lineX - 2}" y="64" width="4" height="470" rx="2" fill="#236662"/>
  <circle cx="${lineX}" cy="64" r="9" fill="#236662"/><circle cx="${lineX}" cy="534" r="9" fill="#236662"/>
  <svg x="${R ? 1040 : 96}" y="64" width="64" height="64" viewBox="84 70 860 860">${mark}</svg>
  <text x="${R ? 1026 : 172}" y="110" text-anchor="${anchor}" font-family="SF Pro Rounded, Rubik, Helvetica, Arial" font-weight="800" font-size="36" fill="#122C33">InEgypt</text>
  ${c.title.map((t, i) => `<text x="${tx}" y="${226 + i * 70}" text-anchor="start"${R ? ' direction="rtl"' : ""} font-family="${font}" font-weight="800" font-size="${R ? 54 : 56}" ${R ? "" : 'letter-spacing="-1"'} fill="#122C33">${esc(t)}</text>`).join("")}
  ${c.sub.map((t, i) => `<text x="${tx}" y="${256 + c.title.length * 70 + i * 34}" text-anchor="start"${R ? ' direction="rtl"' : ""} font-family="${bodyFont}" font-size="26" fill="#40585E">${esc(t)}</text>`).join("")}
</svg>`;
  const out = `src/assets/share/${c.name}.png`;
  await sharp(Buffer.from(svg)).composite([{ input: photo, left: c.rtl ? 0 : 720, top: 0 }]).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
  console.log(`${out}: ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}
