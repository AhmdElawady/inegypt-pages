// Share cards, 1200 × 630 PNG (Plan 47 §7.4): limestone, logo, page title (≤ 8 words), one photo, the line motif.
// Run: npm run share. Output: src/assets/share/<name>.png (each < 300 KB).
import fs from "node:fs";
import sharp from "sharp";

const CARDS = [
  { name: "home", title: ["Plan your Egypt trip.", "Get around with", "confidence."], sub: ["Trip plans, metro and train routes,", "fair prices. Free on iPhone."], photo: "photos/P01" },
];
const images = JSON.parse(fs.readFileSync("src/_data/images.json", "utf8"));
const mark = fs.readFileSync("src/assets/logo/mark-on-light.svg", "utf8").replace(/^<svg[^>]*>/, "").replace("</svg>", "");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
fs.mkdirSync("src/assets/share", { recursive: true });

for (const c of CARDS) {
  const im = images[c.photo];
  const photo = await sharp(`src/assets/img/${im.dir}/${im.base}-1024.jpg`).resize(480, 630, { fit: "cover", position: "right" })
    .composite([{ input: Buffer.from('<svg width="480" height="630"><polygon points="0,0 452,0 480,28 480,630 0,630" fill="#fff"/></svg>'), blend: "dest-in" }])
    .png().toBuffer();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#F7F2E8"/>
  <rect x="56" y="64" width="4" height="470" rx="2" fill="#4E7A28"/>
  <circle cx="58" cy="64" r="9" fill="#4E7A28"/><circle cx="58" cy="534" r="9" fill="#B81D24"/>
  <svg x="96" y="64" width="64" height="64" viewBox="84 70 860 860">${mark}</svg>
  <text x="172" y="110" font-family="SF Pro Rounded, Rubik, Helvetica, Arial" font-weight="800" font-size="36" fill="#17130E">InEgypt</text>
  ${c.title.map((t, i) => `<text x="96" y="${226 + i * 64}" font-family="SF Pro Rounded, Rubik, Helvetica, Arial" font-weight="800" font-size="56" letter-spacing="-1" fill="#17130E">${esc(t)}</text>`).join("")}
  ${c.sub.map((t, i) => `<text x="96" y="${250 + c.title.length * 64 + i * 34}" font-family="SF Pro Text, Helvetica, Arial" font-size="26" fill="#5C5346">${esc(t)}</text>`).join("")}
</svg>`;
  const out = `src/assets/share/${c.name}.png`;
  await sharp(Buffer.from(svg)).composite([{ input: photo, left: 720, top: 0 }]).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
  console.log(`${out}: ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}
