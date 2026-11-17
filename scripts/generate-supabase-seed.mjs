import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import ts from "typescript";

const root = process.cwd();
const sourcePath = resolve(root, "src/data/candidates-2027.ts");
const source = readFileSync(sourcePath, "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
});
const loadedModule = { exports: {} };
new Function("module", "exports", outputText)(loadedModule, loadedModule.exports);
const candidates = loadedModule.exports.candidates2027;

const require = createRequire(import.meta.url);
const assert = require("node:assert/strict");
assert.equal(candidates.length, 31, "Expected the 31 regional candidates");

function sqlText(value) {
  return value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNumber(value) {
  return Number.isInteger(value) ? String(value) : "null";
}

function sqlTextArray(values = []) {
  return values.length ? `array[${values.map(sqlText).join(", ")}]::text[]` : "'{}'::text[]";
}

function dateToIso(value) {
  if (!value) return null;
  const months = {
    janvier: "01", fevrier: "02", mars: "03", avril: "04", mai: "05", juin: "06",
    juillet: "07", aout: "08", septembre: "09", octobre: "10", novembre: "11", decembre: "12"
  };
  const match = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/(\d{1,2})(?:er)?\s+([a-z]+)\s+(\d{4})/i);
  assert.ok(match, `Unrecognized election date: ${value}`);
  const [, day, month, year] = match;
  return `${year}-${months[month.toLowerCase()]}-${day.padStart(2, "0")}`;
}

const columns = [
  "edition_id", "slug", "candidate_number", "name", "region", "age", "height_cm", "hometown",
  "education", "occupation", "elected_on", "elected_at", "passions", "commitments", "biography",
  "instagram_url", "photo_url", "official_source_url", "profile_source_url", "photo_source_url"
];

const rows = candidates.map((candidate) => {
  const values = [
    "(select id from public.editions where year = 2027)", sqlText(candidate.slug), String(candidate.number),
    sqlText(candidate.name), sqlText(candidate.region), sqlNumber(candidate.age), sqlNumber(candidate.heightCm),
    sqlText(candidate.hometown), sqlText(candidate.education), sqlText(candidate.occupation),
    sqlText(dateToIso(candidate.electedOn)), sqlText(candidate.electedAt), sqlTextArray(candidate.passions),
    sqlTextArray(candidate.commitments), sqlText(candidate.biography), sqlText(candidate.instagramUrl),
    sqlText(candidate.imageSrc), sqlText(candidate.officialSourceUrl), sqlText(candidate.profileSourceUrl),
    sqlText(candidate.photoSourceUrl)
  ];
  return `  (${values.join(", ")})`;
});

const updates = columns.slice(2).map((column) => `${column} = excluded.${column}`).join(",\n  ");
const sql = `-- Generated from src/data/candidates-2027.ts. Run npm run supabase:seed:generate after editing candidate data.\n-- Safe to re-run; it preserves the edition's status and configured dates.\ninsert into public.editions (year, slug, name, status)\nvalues (2027, 'miss-france-2027', 'Miss France 2027', 'upcoming')\non conflict (year) do nothing;\n\ninsert into public.candidates (\n  ${columns.join(",\n  ")}\n)\nvalues\n${rows.join(",\n")}\non conflict (edition_id, slug) do update set\n  ${updates};\n`;

writeFileSync(resolve(root, "supabase/seed.sql"), sql);
console.log(`Generated supabase/seed.sql for ${candidates.length} candidates.`);
