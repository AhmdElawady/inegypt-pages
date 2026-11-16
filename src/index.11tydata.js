// Structured data for the English home (Plan 47 §9.1): SoftwareApplication + WebSite + FAQPage.
// Values come from facts.json and the visible FAQ copy, word for word. No aggregateRating (§6.1).
import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), "utf8"));
const facts = read("./_data/facts.json");
const home = read("./_data/home/en.json");
const base = facts.site.url.value + facts.site.pathPrefix.value;
const fill = (t) => t.replace(/\{cities\}/g, facts.coverage.cities.display).replace(/\{attractions\}/g, facts.coverage.attractions.display);
const langCodes = { English: "en", Arabic: "ar", German: "de", French: "fr", Spanish: "es", Italian: "it", Russian: "ru", Turkish: "tr", "Chinese (Simplified)": "zh-Hans" };

export default {
  jsonld: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": base + "#app",
        name: facts.app.name.value,
        alternateName: facts.app.formerName.value,
        description: facts.sentence.en,
        applicationCategory: "TravelApplication",
        operatingSystem: "iOS 18 or later",
        url: base,
        downloadUrl: facts.app.appStoreUrl.value,
        inLanguage: facts.app.languages.value.map((l) => langCodes[l]).filter(Boolean),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free download. InEgypt Pro is an optional in-app subscription." },
        author: { "@type": "Person", name: "Ahmed Elawady" },
      },
      { "@type": "WebSite", "@id": base + "#site", url: base, name: facts.app.name.value, inLanguage: "en" },
      {
        "@type": "FAQPage",
        mainEntity: home.faq.items.map((it) => ({
          "@type": "Question",
          name: it.q,
          acceptedAnswer: { "@type": "Answer", text: fill(it.a) + (it.link ? " " + it.link.text : "") },
        })),
      },
    ],
  },
};
