// Image build (Plan 47 §10.2, P2 G2). Reads originals from materials/ (never published) and writes
// web sizes to src/assets/img/, plus src/_data/images.json (sizes for width/height attributes).
//   photos  materials/photos/originals/P01-*.jpg → graded AVIF + WebP + JPEG at 640/1024/1600/2400
//   screens materials/screens/{framed,raw}/*.png → AVIF + WebP at 360/540/720 (PNG never shipped)
//   icons   favicon.svg → favicon-32.png; Icon Composer export (materials/logo/source-png) → apple-touch-icon (180), icon-512, icon-1024
// Run: npm run images [-- --only=photos|screens|icons]. Skips outputs newer than their source.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1];
const OUT = "src/assets/img";
const manifestPath = "src/_data/images.json";
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};

// Per-photo crops (fractions of the auto-rotated original), applied before resizing.
// P13: cut the top 36 % to remove the roadside billboards (photo-shortlist note); trains and tracks stay.
const CROPS = { P13: { left: 0, top: 0.36, width: 1, height: 0.64 } };

const fresh = (src, out) => fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs;

// One grade for every photo (revised 2026-11-16, owner: no beige): natural colour, a little more
// saturation so sky and Nile read blue/green, blacks lifted slightly to the dark-band colour.
function grade(img) {
  const black = [11, 14, 19];               // #0B0E13
  const white = 252;
  const a = black.map((b) => (white - b) / 255);
  return img.modulate({ saturation: 1.08 }).linear(a, black);
}

async function photos() {
  const dir = "materials/photos/originals";
  if (!fs.existsSync(dir)) return;
  fs.mkdirSync(`${OUT}/photos`, { recursive: true });
  for (const f of fs.readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).sort()) {
    const slot = f.split("-")[0];                         // P01
    const src = path.join(dir, f);
    const meta = await sharp(src).rotate().metadata();
    let w0 = meta.autoOrient?.width ?? meta.width, h0 = meta.autoOrient?.height ?? meta.height;
    const c = CROPS[slot];
    const region = c ? { left: Math.round(c.left * w0), top: Math.round(c.top * h0), width: Math.round(c.width * w0), height: Math.round(c.height * h0) } : null;
    if (region) { w0 = region.width; h0 = region.height; }
    const base = () => (region ? sharp(src).rotate().extract(region) : sharp(src).rotate());
    const widths = [640, 1024, 1600, 2400].filter((w) => w <= w0);
    for (const w of widths) {
      for (const [fmt, opts] of [["avif", { quality: 50, effort: 4 }], ["webp", { quality: 72 }], ["jpg", { quality: 78, mozjpeg: true }]]) {
        const out = `${OUT}/photos/${slot}-${w}.${fmt}`;
        if (fresh(src, out)) continue;
        let img = grade(base().resize({ width: w }));
        img = fmt === "jpg" ? img.jpeg(opts) : img[fmt](opts);
        await img.toFile(out);
      }
    }
    manifest[`photos/${slot}`] = { src: f, width: w0, height: h0, widths, formats: ["avif", "webp", "jpg"], dir: "photos", base: slot };
    console.log(`photo ${slot}: ${widths.join("/")} (${w0}×${h0})`);
  }
}

async function screens() {
  for (const kind of ["framed", "raw"]) {
    const dir = `materials/screens/${kind}`;
    if (!fs.existsSync(dir)) continue;
    fs.mkdirSync(`${OUT}/screens`, { recursive: true });
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort()) {
      const base = f.replace(/\.png$/, "").replace(/\./g, "-");   // s03-trip-day-framed-demo
      const src = path.join(dir, f);
      const { width, height } = await sharp(src).metadata();
      const widths = [360, 540, 720];
      for (const w of widths) {
        for (const [fmt, opts] of [["avif", { quality: 55, effort: 4 }], ["webp", { quality: 80 }]]) {
          const out = `${OUT}/screens/${base}-${w}.${fmt}`;
          if (fresh(src, out)) continue;
          await sharp(src).resize({ width: w })[fmt](opts).toFile(out);
        }
      }
      manifest[`screens/${base}`] = { src: `${kind}/${f}`, width, height, widths, formats: ["avif", "webp"], dir: "screens", base, framed: kind === "framed", demo: f.includes(".demo") };
      console.log(`screen ${base}: ${width}×${height}`);
    }
  }
}

// The app icon's source is Icon Composer (InEgyptUI/InEgypt/AppIcon.icon); its Liquid Glass look only exists as
// the exported PNG. Flat SVGs (favicon, marks) are hand-kept to the same shapes and gradient (#FF832B → #EC4400).
async function icons() {
  const LOGO = "src/assets/logo";
  const glass = "materials/logo/source-png/AppIcon-iOS-Default-1024x1024@1x.png"; // Icon Composer export, rounded, transparent corners
  await sharp(`${LOGO}/favicon.svg`, { density: 300 }).resize(32, 32).png().toFile(`${LOGO}/favicon-32.png`);
  // apple-touch-icon: iOS applies its own rounded mask and paints transparent corners black, so fill the square first
  const square = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#EF8A42"/><stop offset="1" stop-color="#DA5224"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/></svg>');
  const filled = await sharp(square).composite([{ input: glass }]).png().toBuffer();
  await sharp(filled).resize(180, 180).png().toFile(`${LOGO}/apple-touch-icon.png`);
  // Press kit: the glossy icon as exported, transparent corners kept
  await sharp(glass).resize(512, 512).png().toFile(`${LOGO}/icon-512.png`);
  await sharp(glass).png({ compressionLevel: 9 }).toFile(`${LOGO}/icon-1024.png`);
  console.log("icons: favicon-32, apple-touch-icon (180), icon-512, icon-1024");
}

if (!ONLY || ONLY === "icons") await icons();
if (!ONLY || ONLY === "screens") await screens();
if (!ONLY || ONLY === "photos") await photos();
fs.writeFileSync(manifestPath, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2) + "\n");
let total = 0;
for (const f of fs.readdirSync(OUT, { recursive: true })) { const p = path.join(OUT, f); if (fs.statSync(p).isFile()) total += fs.statSync(p).size; }
console.log(`images.json: ${Object.keys(manifest).length} entries; src/assets/img total ${(total / 1048576).toFixed(1)} MB`);
