import { readdirSync } from "node:fs";
import path from "node:path";

/** Slugs of every comic, read from the data directory (the test runner cannot use Astro's import.meta.glob). */
export const comics = readdirSync(path.resolve(import.meta.dirname, "../../src/data/comics"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort();
