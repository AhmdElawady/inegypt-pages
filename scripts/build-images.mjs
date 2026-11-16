// Image build (Plan 47 §10.2, P2 G2). Reads originals from materials/ (never published) and writes
// web sizes to src/assets/img/, plus src/_data/images.json (sizes for width/height attributes).
//   photos  materials/photos/originals/P01-*.jpg → graded AVIF + WebP + JPEG at 640/1024/1600/2400
//   screens materials/screens/{framed,raw}/*.png → AVIF + WebP at 360/540/720 (PNG never shipped)
//   icons   src/assets/logo/favicon.svg → favicon-32.png, apple-touch-icon.png (180), icon-512.png
// Run: npm run images [-- --only=photos|screens|icons]. Skips outputs newer than their source.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1];
const OUT = "src/assets/img";
const manifestPath = "src/_data/images.json";
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};

const fresh = (src, out) => fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs;

// One grade for every photo (G2): warm (+yellow), saturation −8 %, blacks lifted to #14110D,
// highlights rolled off, and a 6 % limestone (#F7F2E8) multiply folded into the channel gains.
function grade(img) {
  const lime = [247, 242, 232].map((c) => 0.94 + 0.06 * (c / 255));
  const warm = [1.02, 1.0, 0.94];
  const gain = warm.map((w, i) => w * lime[i]);
  const black = [20, 17, 13];               // #14110D
  const white = 248;                        // highlight roll-off
  const a = black.map((b) => (white - b) / 255);
  return img
    .modulate({ saturation: 0.92 })
    .recomb([[gain[0], 0, 0], [0, gain[1], 0], [0, 0, gain[2]]])
    .linear(a, black);
}

async function photos() {
  const dir = "materials/photos/originals";
  if (!fs.existsSync(dir)) return;
  fs.mkdirSync(`${OUT}/photos`, { recursive: true });
  for (const f of fs.readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).sort()) {
    const slot = f.split("-")[0];                         // P01
    const src = path.join(dir, f);
    const meta = await sharp(src).rotate().metadata();
    const w0 = meta.autoOrient?.width ?? meta.width, h0 = meta.autoOrient?.height ?? meta.height;
    const widths = [640, 1024, 1600, 2400].filter((w) => w <= w0);
    for (const w of widths) {
      for (const [fmt, opts] of [["avif", { quality: 50, effort: 4 }], ["webp", { quality: 72 }], ["jpg", { quality: 78, mozjpeg: true }]]) {
        const out = `${OUT}/photos/${slot}-${w}.${fmt}`;
        if (fresh(src, out)) continue;
        let img = grade(sharp(src).rotate().resize({ width: w }));
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

async function icons() {
  const svg = "src/assets/logo/favicon.svg";
  for (const [name, size] of [["favicon-32.png", 32], ["apple-touch-icon.png", 180], ["icon-512.png", 512]]) {
    await sharp(svg, { density: 300 }).resize(size, size).png().toFile(`src/assets/logo/${name}`);
  }
  console.log("icons: favicon-32, apple-touch-icon (180), icon-512");
}

if (!ONLY || ONLY === "icons") await icons();
if (!ONLY || ONLY === "screens") await screens();
if (!ONLY || ONLY === "photos") await photos();
fs.writeFileSync(manifestPath, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2) + "\n");
let total = 0;
for (const f of fs.readdirSync(OUT, { recursive: true })) { const p = path.join(OUT, f); if (fs.statSync(p).isFile()) total += fs.statSync(p).size; }
console.log(`images.json: ${Object.keys(manifest).length} entries; src/assets/img total ${(total / 1048576).toFixed(1)} MB`);
