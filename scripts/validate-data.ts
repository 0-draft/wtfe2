// Data integrity: everything the schema cannot express on its own.
// Runs in CI before the build; exits non-zero with a list of every problem found.
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { Comic, Explainer, inLang, LICENSES, Site } from "../src/data/schema.ts";

const root = path.resolve(import.meta.dirname, "..");
const problems: string[] = [];
const fail = (where: string, msg: string) => problems.push(`${where}: ${msg}`);

const sites = z.array(Site).parse(JSON.parse(await readFile(path.join(root, "src/data/sites.json"), "utf8")));
const siteIds = new Set<string>();
for (const s of sites) {
  if (siteIds.has(s.id)) fail(`sites/${s.id}`, "duplicate id");
  siteIds.add(s.id);
  if (s.latest && s.latest.date > s.checked) fail(`sites/${s.id}`, "latest entry is dated after the check date");
  const adaptable = s.terms.kind === "cc" || s.terms.kind === "translation-permitted";
  if (s.tier === "linked" && adaptable)
    fail(`sites/${s.id}`, "a site that allows translation should be translated, not linked");
  if (s.tier === "translated" && !adaptable)
    fail(`sites/${s.id}`, "only sites that allow adaptation or translation may be adapted");
}

const dir = path.join(root, "src/data/comics");
const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
const slugs = new Set<string>();
for (const f of files) {
  const where = `comics/${f}`;
  const parsed = Comic.safeParse(JSON.parse(await readFile(path.join(dir, f), "utf8")));
  if (!parsed.success) {
    fail(where, z.prettifyError(parsed.error));
    continue;
  }
  const c = parsed.data;
  if (`${c.slug}.json` !== f) fail(where, `slug ${c.slug} does not match the file name`);
  if (`${c.slug}.png` !== c.image.file) fail(where, `image file should be ${c.slug}.png`);
  if (slugs.has(c.slug)) fail(where, "duplicate slug");
  slugs.add(c.slug);

  const site = sites.find((s) => s.id === c.series);
  if (!site) fail(where, `no site entry for series ${c.series}`);
  else {
    if (site.tier !== "translated") fail(where, `${site.id} is not a translated site`);
    if (inLang(site.terms.label, "en") !== LICENSES[c.license].label) {
      fail(where, `license ${LICENSES[c.license].label} differs from the site's ${inLang(site.terms.label, "en")}`);
    }
  }

  const img = path.join(root, "public/comics", c.image.file);
  if (!existsSync(img)) fail(where, `missing image ${c.image.file}`);
  else {
    const meta = await sharp(img).metadata();
    if (meta.width !== c.image.width || meta.height !== c.image.height) {
      fail(where, `image is ${meta.width}x${meta.height}, data says ${c.image.width}x${c.image.height}`);
    }
  }

  c.regions.forEach((r, i) => {
    const at = `${where} region ${i}`;
    for (const [name, b] of [
      ["box", r.box],
      ["text", r.text],
    ] as const) {
      if (!b) continue;
      const [x, y, w, h] = b;
      if (x + w > c.image.width || y + h > c.image.height) fail(at, `${name} ${JSON.stringify(b)} leaves the image`);
    }
    if (r.ja.trim() !== r.ja || r.en.trim() !== r.en) fail(at, "leading or trailing whitespace");
    let rest = r.ja.replace(
      /Linux|Emacs|Excel|IKEA|SIGKILL|SIGTERM|LongtimeUser|kill|submodule|git|Ctrl|CPU|C\+\+/g,
      "",
    );
    for (const k of r.keep ?? []) {
      if (!r.ja.includes(k)) fail(at, `keep lists "${k}", which is not in the Japanese lettering`);
      rest = rest.replaceAll(k, "");
    }
    if (/[A-Za-z]{4,}/.test(rest)) {
      fail(at, `untranslated English left in the Japanese lettering: ${r.ja}`);
    }
    if (r.size * r.lineHeight * r.ja.split("\n").length > (r.text ?? r.box)[3] * 1.15) {
      fail(at, "lettering cannot fit its box at this size and line count");
    }
  });
}

// Explainers: an image may be shown only where the site's own terms allow reuse with
// credit; every other strip is retold, never copied.
const exDir = path.join(root, "src/data/explainers");
const exFiles = (await readdir(exDir)).filter((f) => f.endsWith(".json")).sort();
const shownStrips = new Set<string>();
for (const f of exFiles) {
  const where = `explainers/${f}`;
  const parsed = Explainer.safeParse(JSON.parse(await readFile(path.join(exDir, f), "utf8")));
  if (!parsed.success) {
    fail(where, z.prettifyError(parsed.error));
    continue;
  }
  const e = parsed.data;
  if (`${e.slug}.json` !== f) fail(where, `slug ${e.slug} does not match the file name`);
  const site = sites.find((s) => s.id === e.site);
  if (!site) {
    fail(where, `no site entry for ${e.site}`);
    continue;
  }
  if (site.tier !== "linked") fail(where, `${site.id} is adapted, so its strips belong in comics/, not explainers/`);
  if (e.image) {
    if (site.terms.kind !== "noncommercial-use") fail(where, `${site.id}'s terms do not allow showing its strips`);
    const img = path.join(root, "public/strips", e.image.file);
    if (!existsSync(img)) fail(where, `missing image ${e.image.file}`);
    else {
      const meta = await sharp(img).metadata();
      if (meta.width !== e.image.width || meta.height !== e.image.height) {
        fail(where, `image is ${meta.width}x${meta.height}, data says ${e.image.width}x${e.image.height}`);
      }
    }
    shownStrips.add(e.image.file);
  }
  if (!new URL(e.url).hostname.endsWith(new URL(site.url).hostname.replace(/^www\./, ""))) {
    fail(where, `url ${e.url} is not on ${site.url}`);
  }
}
for (const f of await readdir(path.join(root, "public/strips"))) {
  if (!shownStrips.has(f)) fail(`public/strips/${f}`, "image is not used by any explainer");
}

// Only images of adapted comics may ship: anything else in public/comics would be
// a copy of a strip this site has no licence to show.
const referenced = new Set([...slugs].map((s) => `${s}.png`));
for (const f of await readdir(path.join(root, "public/comics"))) {
  if (!referenced.has(f)) fail(`public/comics/${f}`, "image is not used by any comic entry");
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`ok: ${files.length} comics, ${exFiles.length} explainers, ${sites.length} sites`);
