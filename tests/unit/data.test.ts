import { describe, expect, it } from "vitest";
import { LICENSES, SERIES } from "../../src/data/schema.ts";
import { comicLabel, comics, siteFor, sites } from "../../src/lib/data.ts";

describe("comics", () => {
  it("loads every comic and keeps series order", () => {
    expect(comics.length).toBeGreaterThanOrEqual(11);
    const order = comics.map((c) => c.series);
    expect(order).toEqual([...order].sort((a, b) => SERIES.indexOf(a) - SERIES.indexOf(b)));
  });

  it.each(comics.map((c) => [c.slug, c] as const))("%s keeps every region inside the image", (_, c) => {
    for (const r of c.regions) {
      for (const b of [r.box, r.text]) {
        if (!b) continue;
        const [x, y, w, h] = b;
        expect(x + w).toBeLessThanOrEqual(c.image.width);
        expect(y + h).toBeLessThanOrEqual(c.image.height);
      }
    }
  });

  it.each(comics.map((c) => [c.slug, c] as const))("%s is adapted only under a license that allows it", (_, c) => {
    expect(Object.keys(LICENSES)).toContain(c.license);
    expect(siteFor(c.series).tier).toBe("translated");
    expect(["cc", "translation-permitted"]).toContain(siteFor(c.series).terms.kind);
  });

  it("labels numbered strips with their number", () => {
    const x = comics.find((c) => c.slug === "xkcd-2347-dependency")!;
    expect(comicLabel(x)).toBe("xkcd #2347");
    const t = comics.find((c) => c.series === "turnoff")!;
    expect(comicLabel(t)).toBe("TurnOff.us");
  });
});

describe("sites", () => {
  it("lists every site once", () => {
    expect(sites.length).toBeGreaterThanOrEqual(10);
    expect(new Set(sites.map((s) => s.id)).size).toBe(sites.length);
  });

  it("adapts a site exactly when its terms allow adaptation or translation", () => {
    for (const s of sites) {
      const adaptable = ["cc", "translation-permitted"].includes(s.terms.kind);
      expect(adaptable).toBe(s.tier === "translated");
    }
  });

  it("throws for an unknown series", () => {
    expect(() => siteFor("nope")).toThrow();
  });
});

describe("explainers", () => {
  it("only shows images for sites whose terms allow reuse", async () => {
    const { explainers } = await import("../../src/lib/data.ts");
    expect(explainers.length).toBeGreaterThanOrEqual(12);
    for (const e of explainers) {
      const site = siteFor(e.site);
      expect(site.tier).toBe("linked");
      if (e.image) expect(site.terms.kind).toBe("noncommercial-use");
      else expect(e.beats?.length ?? 0).toBeGreaterThan(0);
      expect(e.takeaway.en.length).toBeGreaterThan(0);
      expect(e.takeaway.ja.length).toBeGreaterThan(0);
    }
  });
});
