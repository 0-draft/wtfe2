# wtfe2 (WTF, Engineer?)

[日本語](README.ja.md)

wtfe2 collects comics about the strange job of building software and introduces them in English and Japanese. Strips published under a Creative Commons license that allows adaptation are shown with Japanese lettering; every other site is described and linked, and its comics stay on its own pages.

Site: <https://0-draft.github.io/wtfe2/> (English) · <https://0-draft.github.io/wtfe2/ja/> (日本語)

## What is on it

| Shelf | Sites | What the site does with them |
| --- | --- | --- |
| Lettered here | xkcd (CC BY-NC 2.5), TurnOff.us (CC BY-NC-SA 4.0), Abstruse Goose (CC BY-NC 3.0 US) | Selected strips with the original image on the English page and Japanese lettering on the Japanese page |
| Linked only | SMBC, Existential Comics, MonkeyUser, The Daily WTF, CommitStrip, The Oatmeal, PHD Comics | A description, the site's own reuse terms quoted, and links to strips worth starting with |

Every comic here is licensed for non-commercial use only, so the site carries no ads, sponsorships or affiliate links.

## How the Japanese lettering works

1. Each comic in `src/data/comics/<slug>.json` lists its lettering as regions: the box the lettering occupies in the image, the original text verbatim, and the Japanese text broken into lines by hand.
2. `scripts/plates.ts` builds a clean plate from the untouched original in `public/comics/`. An ink stroke that lies entirely inside a region's box is lettering and is erased; a stroke that leaves the box (a balloon outline, a speech tail, a flowchart diamond) is drawing and is kept. Faint anti-aliasing left behind is cleaned except next to a kept stroke. Lettering that touches a border uses `erase: "rect"`.
3. `src/components/ComicStage.astro` sets the Japanese over the plate as real text. Positions are percentages of the image and font sizes are container-query units, so the lettering scales with the picture at any width. A toggle on the Japanese page swaps back to the original.

Plates and card thumbnails are generated on every `dev`, `build` and `check` and are not committed.

## Adding a comic

1. Confirm the site's license allows adaptation. Only sites with `"tier": "translated"` in `src/data/sites.json` qualify.
2. Save the original image as `public/comics/<slug>.png` (use the 2x file when the publisher offers one).
3. Find each lettering box: `pnpm measure public/comics/<slug>.png x,y,w,h ...` tightens rough boxes to the ink they contain.
4. Write `src/data/comics/<slug>.json`, then run `pnpm plates <slug>` and look at `public/plates/<slug>.png`.
5. Run the checks below. The end-to-end suite fails if any Japanese lettering overflows its box.

## Development

Requires Node 24+ and pnpm.

```sh
pnpm install
pnpm dev            # http://localhost:4321/wtfe2/
pnpm build          # plates, thumbnails, then the static site in dist/
pnpm validate:data  # schema, image sizes, region bounds, license rules
pnpm test           # unit tests (Vitest)
pnpm test:e2e       # Playwright + axe against the built site, desktop and mobile
pnpm lint && pnpm lint:md && pnpm check
```

## CI

Every push and pull request runs Biome, markdownlint, `astro check`, Vitest with coverage, the data-integrity check, the build, Playwright with axe on desktop and mobile, an internal link check, actionlint and zizmor, and a dependency audit. CodeQL runs weekly and on pushes. Links out to the original comics are checked weekly. Pull requests also get a Claude review that looks for mistranslations, licensing problems and factual errors. Dependabot updates npm packages and GitHub Actions weekly. Pushes to `main` deploy to GitHub Pages after the checks pass.

## License

- Code: [MIT](LICENSE).
- Site text and translations written for this site: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
- Comics: their creators. Each comic page names the original, its author and its license. Adapted images are shared under the same license as the original.

If you made one of these comics and want it changed or removed, [open an issue](https://github.com/0-draft/wtfe2/issues).
