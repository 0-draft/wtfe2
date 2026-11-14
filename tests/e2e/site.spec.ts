import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { comics } from "./fixtures.ts";

const pages = ["", "sites/", "about/", ...comics.map((s) => `comics/${s}/`)];

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(1);
}

for (const lang of ["", "ja/"] as const) {
  for (const p of pages) {
    const url = `${lang}${p}`;
    test(`renders /${url} without errors, sideways scroll or broken images`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      const res = await page.goto(url);
      expect(res?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", lang ? "ja" : "en");
      await expect(page.locator("h1")).toHaveCount(1);
      await noHorizontalScroll(page);
      // Load lazy images, then make sure every one decoded.
      await page.evaluate(async () => {
        for (const img of Array.from(document.images)) img.loading = "eager";
        await Promise.all(Array.from(document.images).map((i) => i.decode().catch(() => undefined)));
      });
      const broken = await page.$$eval("img", (imgs) =>
        imgs.filter((i) => getComputedStyle(i).display !== "none" && i.naturalWidth === 0).map((i) => i.src),
      );
      expect(broken).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

test("the language switch leads to the same page in the other language", async ({ page }) => {
  await page.goto("comics/xkcd-1172-workflow/");
  await page.getByRole("link", { name: "日本語" }).click();
  await expect(page).toHaveURL(/\/wtfe2\/ja\/comics\/xkcd-1172-workflow\/$/);
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/wtfe2\/comics\/xkcd-1172-workflow\/$/);
});

test("Japanese pages letter over the clean plate, English pages show the original", async ({ page }) => {
  await page.goto("comics/xkcd-927-standards/");
  await expect(page.locator(".lettering")).toHaveCount(0);
  await expect(page.locator(".art--main")).toHaveAttribute("src", /\/comics\/xkcd-927-standards\.png$/);

  await page.goto("ja/comics/xkcd-927-standards/");
  await expect(page.locator(".art--main")).toHaveAttribute("src", /\/plates\/xkcd-927-standards\.png$/);
  await expect(page.locator("[data-region]")).toHaveCount(7);
  await expect(page.locator(".lettering")).toContainText("規格が増殖するしくみ");
});

test("the toggle swaps the Japanese lettering for the original", async ({ page }) => {
  await page.goto("ja/comics/xkcd-303-compiling/");
  const original = page.locator(".art--original");
  await expect(original).toBeHidden();
  await page.getByText("原文の描き文字を表示").click();
  await expect(original).toBeVisible();
  await expect(page.locator(".lettering")).toBeHidden();
  await page.keyboard.press("Space");
  await expect(original).toBeHidden();
});

for (const slug of comics) {
  test(`Japanese lettering of ${slug} stays inside its boxes`, async ({ page }) => {
    await page.goto(`ja/comics/${slug}/`);
    await page.evaluate(() => document.fonts.ready);
    // Load every region's own face for its own text, so overflow is measured with the real font.
    await page.$$eval("[data-region] .l__t", (els) =>
      Promise.all(
        els.map((t) => {
          const cs = getComputedStyle(t);
          return document.fonts.load(`${cs.fontWeight} 16px ${cs.fontFamily}`, t.textContent ?? "");
        }),
      ),
    );
    const faces = await page.$$eval("[data-region] .l__t", (els) => [
      ...new Set(els.map((t) => getComputedStyle(t).fontFamily.split(",")[0]!.replaceAll('"', "").trim())),
    ]);
    for (const face of faces) {
      expect(
        await page.evaluate((f) => [...document.fonts].some((x) => x.family === f && x.status === "loaded"), face),
      ).toBe(true);
    }
    const over = await page.$$eval("[data-region]", (els) =>
      els
        .map((e, i) => {
          const t = e.firstElementChild as HTMLElement;
          t.style.display = "inline-block";
          const r = e.getBoundingClientRect();
          const tr = t.getBoundingClientRect();
          return { i, x: (tr.width - r.width) / r.width, y: (tr.height - r.height) / r.height, text: t.textContent };
        })
        .filter((o) => o.x > 0.02 || o.y > 0.05),
    );
    expect(over).toEqual([]);
  });
}

for (const url of [
  "",
  "ja/",
  "sites/",
  "ja/sites/",
  "about/",
  "comics/turnoff-dont-sigkill/",
  "ja/comics/turnoff-dont-sigkill/",
]) {
  test(`/${url} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(url);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}

test("unknown pages get the 404 page", async ({ page }) => {
  const res = await page.goto("no-such-page/");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("Page not found");
});
