// About page structured data (Plan 47 §9.1): AboutPage about the app, with the maker as a Person.
import fs from "node:fs";
const facts = JSON.parse(fs.readFileSync(new URL("./_data/facts.json", import.meta.url), "utf8"));
const base = facts.site.url.value + facts.site.pathPrefix.value;
export default {
  jsonld: { "@context": "https://schema.org", "@type": "AboutPage", url: base + "about/", name: "About InEgypt",
    about: { "@type": "SoftwareApplication", "@id": base + "#app", name: facts.app.name.value, alternateName: facts.app.formerName.value,
      applicationCategory: "TravelApplication", operatingSystem: "iOS 18 or later", downloadUrl: facts.app.appStoreUrl.value,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
    author: { "@type": "Person", name: "Ahmed Elawady", description: "Independent developer in Egypt, maker of InEgypt" } },
};
