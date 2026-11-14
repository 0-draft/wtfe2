// Build the "clean plates" the Japanese pages letter over.
//
// For every region of every comic, the lettering inside `box` is erased and the
// rest of the drawing is kept. Erasing a rectangle would also wipe whatever line
// crosses it (a balloon outline, a flowchart diamond, a speech tail), so the
// plate works on connected strokes instead: an ink component that lies entirely
// inside the box is lettering and goes; a component that leaves the box is part
// of the drawing and stays. Anti-aliasing left around an erased stroke is
// cleaned up with a small dilation.
//
// Input:  public/comics/<file>.png (the untouched original)
// Output: public/plates/<file>.png and card thumbnails in public/thumbs/
//         (generated on every dev/build; not committed)

import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { Comic, type Region } from "../src/data/schema.ts";

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, "src/data/comics");
const srcDir = path.join(root, "public/comics");
const outDir = path.join(root, "public/plates");
const thumbDir = path.join(root, "public/thumbs");
const THUMB_WIDTH = 720;

/** A component may poke this many pixels past the box and still count as lettering. */
const SLACK = 2;
/** Ink is anything this much darker than the region's background. */
const INK_DELTA = 40;
/** After strokes are judged, anything this much darker than the paper is cleaned too. */
const FAINT_DELTA = 3;
/** ...except this close to a stroke that was kept. */
const GUARD = 2;

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

export async function buildPlate(comic: Comic): Promise<{ erased: number; kept: number }> {
  const src = path.join(srcDir, comic.image.file);
  const { data, info } = await sharp(src)
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  if (W !== comic.image.width || H !== comic.image.height) {
    throw new Error(`${comic.slug}: image is ${W}x${H}, data says ${comic.image.width}x${comic.image.height}`);
  }
  const px = new Uint8Array(data);
  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) lum[i] = luma(px[i * 3]!, px[i * 3 + 1]!, px[i * 3 + 2]!);

  let erasedTotal = 0;
  let keptTotal = 0;
  for (const region of comic.regions) {
    const { erased, kept } = eraseRegion(region, px, lum, W, H);
    erasedTotal += erased;
    keptTotal += kept;
  }

  await mkdir(outDir, { recursive: true });
  await mkdir(thumbDir, { recursive: true });
  const plate = sharp(Buffer.from(px), { raw: { width: W, height: H, channels: 3 } });
  await plate.clone().png({ compressionLevel: 9 }).toFile(path.join(outDir, comic.image.file));
  const tw = Math.min(THUMB_WIDTH, W);
  await plate
    .clone()
    .resize({ width: tw })
    .webp({ quality: 82 })
    .toFile(path.join(thumbDir, `${comic.slug}.plate.webp`));
  await sharp(src)
    .flatten({ background: "#ffffff" })
    .resize({ width: tw })
    .webp({ quality: 82 })
    .toFile(path.join(thumbDir, `${comic.slug}.webp`));
  return { erased: erasedTotal, kept: keptTotal };
}

/** The most common light colour in the box: the paper (or panel tint) behind the lettering. */
function backgroundOf(box: Region["box"], px: Uint8Array, lum: Float32Array, W: number): [number, number, number] {
  const [bx, by, bw, bh] = box;
  const counts = new Map<number, number>();
  for (let y = by; y < by + bh; y++) {
    for (let x = bx; x < bx + bw; x++) {
      const i = y * W + x;
      if (lum[i]! < 128) continue;
      const key = (px[i * 3]! << 16) | (px[i * 3 + 1]! << 8) | px[i * 3 + 2]!;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let best = 0xffffff;
  let n = -1;
  for (const [key, c] of counts) {
    if (c > n) {
      best = key;
      n = c;
    }
  }
  return [(best >> 16) & 255, (best >> 8) & 255, best & 255];
}

export function eraseRegion(region: Region, px: Uint8Array, lum: Float32Array, W: number, H: number) {
  const [bx, by, bw, bh] = region.box;
  const [br, bg, bb] = backgroundOf(region.box, px, lum, W);
  const bgL = luma(br, bg, bb);
  const inkMax = bgL - INK_DELTA;
  const x0 = bx - SLACK;
  const y0 = by - SLACK;
  const x1 = bx + bw - 1 + SLACK;
  const y1 = by + bh - 1 + SLACK;

  const seen = new Uint8Array(W * H);
  const erase = new Uint8Array(W * H);
  const keep = new Uint8Array(W * H);
  const stack: number[] = [];
  let erased = 0;
  let kept = 0;

  // Strokes mode seeds from the slack ring too: a line running just outside the box
  // must be judged (and kept) as a stroke, or the clean-up pass below would eat it.
  const sx0 = region.erase === "rect" ? bx : Math.max(0, x0);
  const sy0 = region.erase === "rect" ? by : Math.max(0, y0);
  const sx1 = region.erase === "rect" ? bx + bw - 1 : Math.min(W - 1, x1);
  const sy1 = region.erase === "rect" ? by + bh - 1 : Math.min(H - 1, y1);
  for (let y = sy0; y <= sy1; y++) {
    for (let x = sx0; x <= sx1; x++) {
      const start = y * W + x;
      if (seen[start] || lum[start]! >= inkMax) continue;
      if (region.erase === "rect") {
        seen[start] = 1;
        erase[start] = 1;
        erased++;
        continue;
      }
      // Flood the whole stroke, even past the box, so it is judged as one piece.
      const members: number[] = [];
      let escapes = false;
      stack.push(start);
      seen[start] = 1;
      while (stack.length > 0) {
        const i = stack.pop()!;
        members.push(i);
        const cx = i % W;
        const cy = (i - cx) / W;
        if (cx < x0 || cx > x1 || cy < y0 || cy > y1) escapes = true;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = cy + dy;
          if (ny < 0 || ny >= H) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            if (nx < 0 || nx >= W || (dx === 0 && dy === 0)) continue;
            const n = ny * W + nx;
            if (!seen[n] && lum[n]! < inkMax) {
              seen[n] = 1;
              stack.push(n);
            }
          }
        }
      }
      if (escapes) {
        kept++;
        for (const i of members) keep[i] = 1;
      } else {
        erased++;
        for (const i of members) erase[i] = 1;
      }
    }
  }

  // Clean what is left: anti-aliased fringes and strokes too faint to count as
  // ink. Anything darker than the paper inside the box goes, except within
  // GUARD pixels of a stroke that was kept, so crossing lines keep their edges.
  const guard = new Uint8Array(W * H);
  for (let y = Math.max(0, y0 - GUARD); y <= Math.min(H - 1, y1 + GUARD); y++) {
    for (let x = Math.max(0, x0 - GUARD); x <= Math.min(W - 1, x1 + GUARD); x++) {
      if (!keep[y * W + x]) continue;
      for (let dy = -GUARD; dy <= GUARD; dy++) {
        for (let dx = -GUARD; dx <= GUARD; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H) guard[ny * W + nx] = 1;
        }
      }
    }
  }
  // Rect mode stays strictly inside its box: it is used next to borders, and the
  // slack ring would thin them.
  for (let y = sy0; y <= sy1; y++) {
    for (let x = sx0; x <= sx1; x++) {
      const i = y * W + x;
      if (!guard[i] && lum[i]! < bgL - FAINT_DELTA) erase[i] = 1;
    }
  }

  for (let i = 0; i < W * H; i++) {
    if (!erase[i]) continue;
    px[i * 3] = br;
    px[i * 3 + 1] = bg;
    px[i * 3 + 2] = bb;
  }
  return { erased, kept };
}

export async function loadComics(): Promise<Comic[]> {
  const files = (await readdir(dataDir)).filter((f) => f.endsWith(".json")).sort();
  return Promise.all(files.map(async (f) => Comic.parse(JSON.parse(await readFile(path.join(dataDir, f), "utf8")))));
}

if (import.meta.main) {
  const only = process.argv[2];
  for (const comic of await loadComics()) {
    if (only && comic.slug !== only) continue;
    const { erased, kept } = await buildPlate(comic);
    console.log(`${comic.slug}: erased ${erased} strokes, kept ${kept} crossing the boxes`);
  }
}
