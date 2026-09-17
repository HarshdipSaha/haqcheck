import { mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const policies = join(here, "..", "..", "policies");
const out = join(here, "..", "src", "data");
mkdirSync(out, { recursive: true });

writeFileSync(join(out, "requirements.json"), readFileSync(join(policies, "requirements.json")));

const readDir = (d) =>
  readdirSync(join(policies, d)).filter((f) => f.endsWith(".cedar"))
    .map((f) => ({ file: `${d}/${f}`, text: readFileSync(join(policies, d, f), "utf8") }));
const rulebooks = {
  central: { displayName: "Central (Social Security Rules 2026)", common: readDir("common"), overlay: [] },
  karnataka: { displayName: "Karnataka (Central + Karnataka HC order)", common: readDir("common"), overlay: readDir("karnataka") },
};
writeFileSync(join(out, "rulebooks.json"), JSON.stringify(rulebooks, null, 2));
console.log("synced policies into src/data");
