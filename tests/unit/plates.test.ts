import { describe, expect, it } from "vitest";
import { eraseRegion } from "../../scripts/plates.ts";
import { Region } from "../../src/data/schema.ts";

/** A white W×H RGB canvas with helpers to paint black pixels. */
function canvas(W: number, H: number) {
  const px = new Uint8Array(W * H * 3).fill(255);
  const ink = (x: number, y: number, v = 0) => {
    const i = (y * W + x) * 3;
    px[i] = px[i + 1] = px[i + 2] = v;
  };
  const lum = () => {
    const l = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) l[i] = 0.299 * px[i * 3]! + 0.587 * px[i * 3 + 1]! + 0.114 * px[i * 3 + 2]!;
    return l;
  };
  const at = (x: number, y: number) => px[(y * W + x) * 3]!;
  return { px, ink, lum, at };
}

const region = (box: [number, number, number, number], erase: "strokes" | "rect" = "strokes") =>
  Region.parse({ box, en: "X", ja: "X", size: 10, erase });

describe("eraseRegion", () => {
  it("erases a glyph inside the box and keeps a line that crosses it", () => {
    const W = 60;
    const H = 40;
    const c = canvas(W, H);
    // glyph: a 4x4 blob well inside the box
    for (let y = 18; y < 22; y++) for (let x = 20; x < 24; x++) c.ink(x, y);
    // line: crosses the whole canvas at y = 30, through the box
    for (let x = 0; x < W; x++) c.ink(x, 30);
    const { erased, kept } = eraseRegion(region([10, 10, 30, 25]), c.px, c.lum(), W, H);
    expect(erased).toBe(1);
    expect(kept).toBe(1);
    expect(c.at(21, 20)).toBe(255);
    expect(c.at(25, 30)).toBe(0);
    expect(c.at(5, 30)).toBe(0);
  });

  it("cleans a faint anti-aliased fringe left around the glyph", () => {
    const W = 40;
    const H = 40;
    const c = canvas(W, H);
    for (let y = 15; y < 20; y++) for (let x = 15; x < 20; x++) c.ink(x, y);
    c.ink(14, 17, 230); // grey fringe, lighter than the ink threshold
    c.ink(20, 17, 245);
    eraseRegion(region([10, 10, 20, 20]), c.px, c.lum(), W, H);
    expect(c.at(14, 17)).toBe(255);
    expect(c.at(20, 17)).toBe(255);
  });

  it("does not erase the edge of a kept line even in the fringe pass", () => {
    const W = 40;
    const H = 40;
    const c = canvas(W, H);
    for (let x = 0; x < W; x++) {
      c.ink(x, 20);
      c.ink(x, 21, 200); // anti-aliased edge of the line
    }
    eraseRegion(region([10, 10, 20, 20]), c.px, c.lum(), W, H);
    expect(c.at(15, 20)).toBe(0);
    expect(c.at(15, 21)).toBe(200);
  });

  it("keeps a line that runs just outside the box without entering it", () => {
    const W = 40;
    const H = 40;
    const c = canvas(W, H);
    for (let x = 0; x < W; x++) c.ink(x, 31); // one pixel below a box that ends at y = 30
    for (let y = 15; y < 18; y++) for (let x = 15; x < 18; x++) c.ink(x, y);
    eraseRegion(region([10, 10, 20, 21]), c.px, c.lum(), W, H);
    expect(c.at(16, 16)).toBe(255);
    for (let x = 0; x < W; x++) expect(c.at(x, 31)).toBe(0);
  });

  it("rect mode erases ink that touches a border, and nothing outside the box", () => {
    const W = 40;
    const H = 40;
    const c = canvas(W, H);
    for (let x = 0; x < W; x++) c.ink(x, 4); // border one pixel above the box
    for (let y = 5; y < 10; y++) c.ink(15, y); // a glyph stroke hanging from the border
    eraseRegion(region([10, 5, 20, 10], "rect"), c.px, c.lum(), W, H);
    expect(c.at(15, 7)).toBe(255);
    expect(c.at(15, 4)).toBe(0);
    expect(c.at(25, 4)).toBe(0);
  });

  it("fills with the box's own background colour", () => {
    const W = 30;
    const H = 30;
    const c = canvas(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) c.ink(x, y, 204); // grey panel
    for (let y = 12; y < 16; y++) for (let x = 12; x < 16; x++) c.ink(x, y, 0);
    eraseRegion(region([5, 5, 20, 20]), c.px, c.lum(), W, H);
    expect(c.at(13, 13)).toBe(204);
  });
});

describe("eraseRegion on a dark ground", () => {
  it("inverted regions erase light lettering and fill with the dark ground", () => {
    const W = 30;
    const H = 30;
    const px = new Uint8Array(W * H * 3);
    for (let i = 0; i < W * H; i++) {
      px[i * 3] = 20;
      px[i * 3 + 1] = 40;
      px[i * 3 + 2] = 110;
    }
    for (let y = 12; y < 16; y++) for (let x = 12; x < 16; x++) px.fill(255, (y * W + x) * 3, (y * W + x) * 3 + 3);
    const lum = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) lum[i] = 0.299 * px[i * 3]! + 0.587 * px[i * 3 + 1]! + 0.114 * px[i * 3 + 2]!;
    eraseRegion(Region.parse({ box: [5, 5, 20, 20], en: "X", ja: "X", size: 10, invert: true }), px, lum, W, H);
    const i = (13 * W + 13) * 3;
    expect([px[i], px[i + 1], px[i + 2]]).toEqual([20, 40, 110]);
  });
});

describe("hullOf", () => {
  it("contains the inside of a tilted patch and not the corners of its box", async () => {
    const { hullOf } = await import("../../scripts/plates.ts");
    const W = 40;
    const px = new Uint8Array(W * W * 3).fill(255);
    // a diamond of colour (10, 20, 30) centred at (20, 20)
    for (let y = 0; y < W; y++)
      for (let x = 0; x < W; x++) if (Math.abs(x - 20) + Math.abs(y - 20) <= 10) px.set([10, 20, 30], (y * W + x) * 3);
    const inside = hullOf([5, 5, 30, 30], px, W, [10, 20, 30]);
    expect(inside(20, 20)).toBe(true);
    expect(inside(12, 20)).toBe(true);
    expect(inside(6, 6)).toBe(false);
    expect(inside(33, 33)).toBe(false);
  });
});
