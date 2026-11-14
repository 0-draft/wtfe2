import { z } from "zod";

/** [x, y, width, height] in the comic image's own pixels. */
export const Box = z.tuple([
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.number().int().positive(),
  z.number().int().positive(),
]);
export type Box = z.infer<typeof Box>;

const Bilingual = z.object({ en: z.string().min(1), ja: z.string().min(1) }).strict();
export type Bilingual = z.infer<typeof Bilingual>;

/** A proper name stays one string; anything with words in it carries both languages. */
const Text = z.union([z.string().min(1), Bilingual]);
export type Text = z.infer<typeof Text>;
export function inLang(t: Text, lang: "en" | "ja"): string {
  return typeof t === "string" ? t : t[lang];
}

/**
 * One piece of lettering. `box` is where the original lettering sits: the plate
 * builder erases the ink inside it, and the translation is set inside it unless
 * `text` gives a different (usually larger) area to set it in.
 */
export const Region = z
  .object({
    box: Box,
    text: Box.optional(),
    /**
     * strokes: erase only ink strokes that lie wholly inside `box` (keeps lines that cross it).
     * rect: erase every dark pixel inside `box`, for lettering that touches a border.
     */
    erase: z.enum(["strokes", "rect"]).default("strokes"),
    /** The original lettering, verbatim (line breaks as drawn). */
    en: z.string().min(1),
    /** The Japanese lettering, broken into lines by hand. */
    ja: z.string().min(1),
    /** Font size for the Japanese lettering, in image pixels. */
    size: z.number().positive(),
    align: z.enum(["left", "center", "right"]).default("left"),
    font: z.enum(["hand", "sans"]).default("hand"),
    weight: z.union([z.literal(400), z.literal(600), z.literal(700)]).default(600),
    underline: z.boolean().default(false),
    lineHeight: z.number().min(1).max(2).default(1.3),
  })
  .strict();
export type Region = z.infer<typeof Region>;

export const SERIES = ["xkcd", "turnoff", "abstruse-goose"] as const;
export type SeriesId = (typeof SERIES)[number];

export const LICENSES = {
  "CC-BY-NC-2.5": { label: "CC BY-NC 2.5", url: "https://creativecommons.org/licenses/by-nc/2.5/" },
  "CC-BY-NC-SA-4.0": { label: "CC BY-NC-SA 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
  "CC-BY-NC-3.0-US": { label: "CC BY-NC 3.0 US", url: "https://creativecommons.org/licenses/by-nc/3.0/us/" },
} as const;
export type LicenseId = keyof typeof LICENSES;

export const Comic = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    series: z.enum(SERIES),
    number: z.number().int().positive().optional(),
    title: z.string().min(1),
    titleJa: z.string().min(1),
    /** Publication date as the publisher gives it; absent when the publisher gives none. */
    published: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    url: z.url(),
    /** Where the image file was taken from, when that is not `url` itself. */
    imageSource: z.url(),
    author: Text,
    /** Where the strip was first published, when that address no longer serves it. Shown as text, not linked. */
    formerUrl: z.string().optional(),
    license: z.enum(Object.keys(LICENSES) as [LicenseId, ...LicenseId[]]),
    image: z
      .object({
        file: z.string().regex(/^[a-z0-9-]+\.png$/),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        /** Widest the strip is shown on its page, in CSS pixels; keeps tall strips and 2x files readable. */
        displayWidth: z.number().int().min(320).max(1200),
      })
      .strict(),
    /** xkcd's hover text. */
    titleText: Bilingual.optional(),
    note: Bilingual,
    related: z.array(z.object({ label: Bilingual, url: z.url(), urlJa: z.url().optional() }).strict()).default([]),
    regions: z.array(Region).min(1),
  })
  .strict();
export type Comic = z.infer<typeof Comic>;

export const Site = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    url: z.url(),
    creator: Text,
    since: z
      .string()
      .regex(/^\d{4}$/)
      .optional(),
    status: z.enum(["active", "irregular", "dormant", "ended"]),
    /** Latest entry seen when the status was last checked. */
    latest: z
      .object({ date: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/), url: z.url() })
      .strict()
      .optional(),
    checked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** translated: shown here with Japanese lettering. linked: described and linked only. */
    tier: z.enum(["translated", "linked"]),
    terms: z
      .object({
        kind: z.enum(["cc", "permission", "noncommercial-use", "reserved", "none-stated"]),
        label: Text,
        url: z.url(),
        quote: z.string().optional(),
      })
      .strict(),
    feed: z.url().optional(),
    about: Bilingual,
    picks: z.array(z.object({ title: z.string().min(1), url: z.url(), why: Bilingual }).strict()).max(3),
  })
  .strict();
export type Site = z.infer<typeof Site>;
