import { describe, expect, it } from "vitest";
import { LICENSES } from "../../src/data/schema.ts";
import { comicLabel, comics, siteFor, sites } from "../../src/lib/data.ts";

describe("comics", () => {
  it("loads every comic and keeps series order", () => {
    expect(comics.length).toBeGreaterThanOrEqual(11);
    const order = comics.map((c) => c.series);
    expect(order).toEqual(
      [...order].sort(
        (a, b) => ["xkcd", "turnoff", "abstruse-goose"].indexOf(a) - ["xkcd", "turnoff", "abstruse-goose"].indexOf(b),
      ),
    );
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
    expect(siteFor(c.series).terms.kind).toBe("cc");
  });

  it("labels numbered strips with their number", () => {
    const x = comics.find((c) => c.slug === "xkcd-2347-dependency")!;
    expect(comicLabel(x)).toBe("xkcd #2347");
    const t = comics.find((c) => c.series === "turnoff")!;
    expect(comicLabel(t)).toBe("TurnOff.us");
  });
});

describe("sites", () => {
  it("lists ten sites with unique ids", () => {
    expect(sites).toHaveLength(10);
    expect(new Set(sites.map((s) => s.id)).size).toBe(10);
  });

  it("never adapts a site whose terms are not Creative Commons", () => {
    for (const s of sites) {
      if (s.tier === "translated") expect(s.terms.kind).toBe("cc");
      else expect(s.terms.kind).not.toBe("cc");
    }
  });

  it("throws for an unknown series", () => {
    // @ts-expect-error deliberately wrong id
    expect(() => siteFor("nope")).toThrow();
  });
});
