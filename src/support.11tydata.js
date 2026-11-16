// FAQPage data for /support.html, word for word from the visible questions (Plan 47 §9.1).
import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), "utf8"));
const facts = read("./_data/facts.json"), support = read("./_data/support.json"), home = read("./_data/home/en.json");
const fill = (t) => t.replace(/\{cities\}/g, facts.coverage.cities.display).replace(/\{attractions\}/g, facts.coverage.attractions.display);
export default {
  jsonld: { "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [...support.extra, ...home.faq.items].map((it) => ({ "@type": "Question", name: it.q,
      acceptedAnswer: { "@type": "Answer", text: fill(it.a) + (it.link ? " " + it.link.text : "") } })) },
};
