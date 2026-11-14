// Tighten rough text boxes to the ink they contain, so a translation mask covers the
// original lettering exactly. Usage:
//   pnpm measure public/comics/<file>.png x,y,w,h [x,y,w,h ...]
// Prints one JSON box per argument: [x, y, w, h] in the image's own pixels.
import sharp from "sharp";

const [file, ...boxes] = process.argv.slice(2);
if (!file || boxes.length === 0) {
  console.error("usage: pnpm measure <image> x,y,w,h [...]");
  process.exit(2);
}

const PAD = 4;
const INK = 140; // luminance below this counts as lettering

const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
const at = (x: number, y: number) => data[y * info.width + x]!;

for (const arg of boxes) {
  const [x, y, w, h] = arg.split(",").map(Number) as [number, number, number, number];
  let x0 = Number.POSITIVE_INFINITY;
  let y0 = Number.POSITIVE_INFINITY;
  let x1 = -1;
  let y1 = -1;
  for (let yy = Math.max(0, y); yy < Math.min(info.height, y + h); yy++) {
    for (let xx = Math.max(0, x); xx < Math.min(info.width, x + w); xx++) {
      if (at(xx, yy) < INK) {
        if (xx < x0) x0 = xx;
        if (yy < y0) y0 = yy;
        if (xx > x1) x1 = xx;
        if (yy > y1) y1 = yy;
      }
    }
  }
  if (x1 < 0) {
    console.log(JSON.stringify({ hint: arg, box: null }));
    continue;
  }
  const bx = Math.max(0, x0 - PAD);
  const by = Math.max(0, y0 - PAD);
  const bw = Math.min(info.width, x1 + PAD + 1) - bx;
  const bh = Math.min(info.height, y1 + PAD + 1) - by;
  console.log(JSON.stringify({ hint: arg, box: [bx, by, bw, bh] }));
}
