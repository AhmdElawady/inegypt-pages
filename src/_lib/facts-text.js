// One place for the numbers and prices that appear in copy (Plan 47 §9.5). Everything comes from src/_data/facts.json:
// change a price there and every page, the structured data and the legal summaries follow.
import fs from "node:fs";
const facts = JSON.parse(fs.readFileSync(new URL("../_data/facts.json", import.meta.url), "utf8"));
const C = facts.coverage, P = facts.prices;

/** Tokens usable in any copy string: "{cities}", "{monthly}", … Unknown tokens are left as they are. */
const TOKENS = {
  cities: C.cities.display, attractions: C.attractions.display, routes: C.routes.value, stops: C.stops.display, modes: C.transitModes.value,
  monthly: P.proMonthly.value, yearly: P.proYearly.value, pass: P.tripPass.value, lifetime: P.lifetime.value,
};
export const fillFacts = (text) => String(text).replace(/\{(\w+)\}/g, (m, k) => (k in TOKENS ? String(TOKENS[k]) : m));

/** Every Pro option on sale, as one phrase: "$2.99 a month or $19.99 a year, or one payment: …".
    One-time options appear only while facts.prices says they are on sale. `html` wraps prices in <bdi> for Arabic pages. */
export function proPrices(lang = "en", html = true) {
  const $ = (v) => (html ? `<bdi>${v}</bdi>` : v);
  const ar = lang === "ar";
  const once = [];
  if (P.passesOnSale.value) once.push(ar ? `${$(P.tripPass.value)} لتذكرة الرحلة` : `${$(P.tripPass.value)} for a Trip Pass`);
  if (P.lifetimeProduct.value) once.push(ar ? `${$(P.lifetime.value)} للوصول مدى الحياة` : `${$(P.lifetime.value)} for Lifetime`);
  const subs = ar ? `${$(P.proMonthly.value)} شهريًا أو ${$(P.proYearly.value)} سنويًا` : `${$(P.proMonthly.value)} a month or ${$(P.proYearly.value)} a year`;
  if (!once.length) return subs;
  return ar ? `${subs}، أو دفعة واحدة: ${once.join(" أو ")}` : `${subs}, or one payment: ${once.join(" or ")}`;
}

/** True when a one-time option (Trip Pass or Lifetime) is on sale. */
export const hasOneTime = () => Boolean(P.passesOnSale.value || P.lifetimeProduct.value);
