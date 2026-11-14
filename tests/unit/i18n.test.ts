import { describe, expect, it } from "vitest";
import { asset, formatDate, href, other, ui } from "../../src/lib/i18n.ts";

describe("href", () => {
  it("prefixes Japanese pages with ja/ and keeps English at the root", () => {
    expect(href("en", "shelf/")).toBe(`${import.meta.env.BASE_URL.replace(/\/?$/, "/")}shelf/`);
    expect(href("ja", "shelf/")).toBe(`${import.meta.env.BASE_URL.replace(/\/?$/, "/")}ja/shelf/`);
    expect(href("ja")).toMatch(/\/ja\/$/);
  });

  it("strips leading slashes", () => {
    expect(href("en", "/about/")).toBe(href("en", "about/"));
    expect(asset("/comics/x.png")).toBe(asset("comics/x.png"));
  });
});

describe("formatDate", () => {
  it("formats full and month-only dates in both languages", () => {
    expect(formatDate("2020-08-17", "ja")).toBe("2020年8月17日");
    expect(formatDate("2020-08-17", "en")).toBe("17 Aug 2020");
    expect(formatDate("2024-08", "ja")).toBe("2024年8月");
    expect(formatDate("2024-08", "en")).toBe("Aug 2024");
  });
});

describe("ui strings", () => {
  it("has the same keys in both languages", () => {
    expect(Object.keys(ui.ja).sort()).toEqual(Object.keys(ui.en).sort());
    expect(Object.keys(ui.ja.status).sort()).toEqual(Object.keys(ui.en.status).sort());
  });

  it("switches language", () => {
    expect(other("en")).toBe("ja");
    expect(other("ja")).toBe("en");
  });
});
