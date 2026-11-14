// @ts-check
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.SITE_URL ?? "https://0-draft.github.io",
  base: process.env.BASE_PATH ?? "/wtfe2/",
  trailingSlash: "always",
  integrations: [
    sitemap({
      i18n: { defaultLocale: "en", locales: { en: "en", ja: "ja" } },
    }),
  ],
  prefetch: { defaultStrategy: "hover" },
});
