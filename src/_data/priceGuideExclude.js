// Price atoms kept off the price guide: facts.knowledge.notForTheSite (F9 visa price, unverified train fare) and
// price_transit_metro, which repeats price_metro_single_journey.
import fs from "node:fs";
const facts = JSON.parse(fs.readFileSync(new URL("./facts.json", import.meta.url), "utf8"));
export default [...facts.knowledge.notForTheSite.value.map((s) => s.split(" ")[0]), "price_transit_metro"];
