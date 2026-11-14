import { z } from "zod";
import { Comic, Explainer, LICENSES, SERIES, type SeriesId, Site } from "../data/schema.ts";
import rawSites from "../data/sites.json";

const comicModules = import.meta.glob<{ default: unknown }>("../data/comics/*.json", { eager: true });
const explainerModules = import.meta.glob<{ default: unknown }>("../data/explainers/*.json", { eager: true });

const seriesOrder = new Map(SERIES.map((s, i) => [s, i]));

/** All comics, grouped by series in site order, newest first within a series (undated last, by number). */
export const comics: Comic[] = Object.values(comicModules)
  .map((m) => Comic.parse(m.default))
  .sort(
    (a, b) =>
      seriesOrder.get(a.series)! - seriesOrder.get(b.series)! ||
      (b.published ?? "").localeCompare(a.published ?? "") ||
      (b.number ?? 0) - (a.number ?? 0),
  );

export const sites: Site[] = z.array(Site).parse(rawSites);

const siteOrder = new Map(sites.map((s, i) => [s.id, i]));

/** Strips from sites that do not allow adaptation, explained here; in site order, newest first. */
export const explainers: Explainer[] = Object.values(explainerModules)
  .map((m) => Explainer.parse(m.default))
  .sort(
    (a, b) =>
      (siteOrder.get(a.site) ?? 99) - (siteOrder.get(b.site) ?? 99) ||
      (b.published ?? "").localeCompare(a.published ?? "") ||
      a.slug.localeCompare(b.slug),
  );

export function explainerFor(url: string): Explainer | undefined {
  return explainers.find((e) => e.url === url);
}

export function siteFor(series: SeriesId | string): Site {
  const site = sites.find((s) => s.id === series);
  if (!site) throw new Error(`no site entry for series ${series}`);
  return site;
}

export function licenseOf(comic: Comic) {
  return LICENSES[comic.license];
}

export function comicLabel(comic: Comic): string {
  const site = siteFor(comic.series);
  return comic.number ? `${site.name} #${comic.number}` : site.name;
}
