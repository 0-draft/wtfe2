// Measure the Japanese lettering in a real browser and fit font sizes to their boxes.
//
//   pnpm build && pnpm preview &           # or any server for dist/
//   pnpm fit [slug ...]                    # report: current size, size that fills the box
//   pnpm fit --apply [slug ...]            # shrink any region above 95% of its fit to 94%
//                                          (CI's Linux renders Klee One a few % wider)
//
// FIT_ORIGIN overrides the server (default http://127.0.0.1:4321). Sizes are in image
// pixels, as stored in src/data/comics/<slug>.json.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { loadComics } from "./plates.ts";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const only = new Set(args.filter((a) => !a.startsWith("--")));
const origin = process.env.FIT_ORIGIN ?? "http://127.0.0.1:4321";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
let overflowing = 0;

for (const comic of await loadComics()) {
  if (only.size > 0 && !only.has(comic.slug)) continue;
  await page.goto(`${origin}/wtfe2/ja/comics/${comic.slug}/`);
  await page.$$eval("[data-region] .l__t", (els) =>
    Promise.all(
      els.map((t) => {
        const cs = getComputedStyle(t);
        return document.fonts.load(`${cs.fontWeight} 16px ${cs.fontFamily}`, t.textContent ?? "");
      }),
    ),
  );
  // fit = the size (in image px) at which the text exactly fills its box in the tighter direction.
  const fits = await page.$$eval("[data-region]", (els) => {
    const stage = els[0]!.closest(".stage")!;
    const img = stage.querySelector("img")!;
    const scale = img.naturalWidth / stage.getBoundingClientRect().width;
    return els.map((e) => {
      const t = e.firstElementChild as HTMLElement;
      t.style.display = "inline-block";
      const r = e.getBoundingClientRect();
      const tr = t.getBoundingClientRect();
      const fs = Number.parseFloat(getComputedStyle(e).fontSize);
      return (fs * scale * Math.min(r.width / tr.width, r.height / tr.height)) / 0.96;
    });
  });

  const file = path.join(root, "src/data/comics", `${comic.slug}.json`);
  let json = await readFile(file, "utf8");
  let changed = false;
  comic.regions.forEach((r, i) => {
    const fit = fits[i]!;
    const ratio = r.size / fit;
    const flag = ratio > 1 ? "OVERFLOW" : ratio > 0.97 ? "tight" : "";
    if (flag === "OVERFLOW") overflowing++;
    console.log(
      `${comic.slug} #${i}\tsize ${r.size}\tfits ${fit.toFixed(1)}\t${(ratio * 100).toFixed(0)}%\t${flag}\t${r.ja.split("\n")[0]}`,
    );
    if (apply && ratio > 0.95) {
      const next = Math.floor(fit * 0.94 * 2) / 2;
      let n = -1;
      json = json.replace(/"size": [0-9.]+/g, (m) => (++n === i ? `"size": ${next}` : m));
      changed = true;
    }
  });
  if (changed) await writeFile(file, json);
}

await browser.close();
if (overflowing > 0 && !apply) {
  console.error(`${overflowing} region(s) overflow; rerun with --apply to shrink them.`);
  process.exit(1);
}
