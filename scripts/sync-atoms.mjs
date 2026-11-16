// Copy published knowledge atoms from the app into src/_data/atoms.json (Plan 47 §10.1, Plan 46 §4.4).
// Every number on the site comes from here. Run locally; the output is committed so CI needs no app repo.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const APP = process.env.INEGYPT_APP_REPO || path.join(os.homedir(), "Desktop/InEgyptUI");
const K = path.join(APP, "InEgypt/Resources/Knowledge");

// Fares that the app computes from FareCalculator tables instead of storing a static value.
// Each entry is checked against the cited source's note so a fare change cannot slip past silently.
const PROVIDER_RANGES = {
  METRO: { min: 10, max: 20, mustMatchSourceNote: "10/12/15/20" },
};

const sources = Object.fromEntries(
  JSON.parse(fs.readFileSync(path.join(K, "knowledge_sources.json"), "utf8")).sources.map((s) => [s.id, s])
);
const out = {};
let revision = null;
for (const f of fs.readdirSync(path.join(K, "topics")).filter((f) => f.endsWith(".json")).sort()) {
  const doc = JSON.parse(fs.readFileSync(path.join(K, "topics", f), "utf8"));
  revision = doc.contentRevision ?? revision;
  for (const a of doc.atoms) {
    if (a.lifecycle !== "published") continue;
    const src = sources[a.provenance?.sourceID] || null;
    const p = a.payload || {};
    let min = p.staticValue?.min ?? null;
    let max = p.staticValue?.max ?? null;
    if (p.valueProvider?.kind === "fare_calculator") {
      const r = PROVIDER_RANGES[p.valueProvider.mode];
      // Modes not mapped yet keep min/max null: the site cannot print a number for them.
      if (r) {
        if (!src?.editorialNote?.includes(r.mustMatchSourceNote))
          throw new Error(`${a.id}: source note no longer says "${r.mustMatchSourceNote}"; update PROVIDER_RANGES`);
        ({ min, max } = r);
      }
    }
    out[a.id] = {
      kind: a.kind,
      en: a.content.en,
      ar: a.content.ar,
      ...(a.kind === "price" ? { min, max, currency: p.currency ?? null, unit: p.unit ?? null, negotiable: !!p.negotiable } : {}),
      lastVerifiedAt: a.lastVerifiedAt ?? null,
      siteUsable: !!a.lastVerifiedAt && (a.kind !== "price" || min !== null),
      evidence: a.provenance?.evidence ?? null,
      estimate: /estimate/.test(a.provenance?.evidence ?? ""),
      source: src ? { id: src.id, kind: src.kind, url: src.url ?? null } : null,
    };
  }
}
const data = { syncedAt: new Date().toISOString().slice(0, 10), contentRevision: revision, count: Object.keys(out).length, atoms: out };
fs.writeFileSync("src/_data/atoms.json", JSON.stringify(data, null, 2) + "\n");
console.log(`atoms.json: ${data.count} published atoms (revision ${revision})`);
for (const id of ["price_airport_taxi", "price_metro_single_journey", "price_bottled_water", "price_camel_ride_short"]) {
  const a = out[id];
  console.log(`  ${id}: ${a ? `${a.min}–${a.max} ${a.currency}, checked ${a.lastVerifiedAt}, evidence ${a.evidence}` : "MISSING"}`);
}
