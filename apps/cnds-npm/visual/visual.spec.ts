import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * Composition-aware visual verification.
 *
 * The model (DEMO-PLAN.md §14): when output is approved-composition (template owns layout +
 * slots filled with approved blocks), ugliness is designed out — so we PROVE composition and
 * that states render, rather than judge taste. Screenshots are a human ARTIFACT, not a gate.
 */
const SHOTS = "visual/__screens__";
mkdirSync(SHOTS, { recursive: true });

async function go(page: Page, scenario: string) {
  await page.goto(`/visual/index.html?scenario=${scenario}`);
  await page.waitForSelector(`[data-scenario="${scenario}"]`);
}

/** Screenshots are a human ARTIFACT, not a gate — a capture hiccup must never fail the suite. */
async function shoot(page: Page, name: string) {
  try {
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true, animations: "disabled" });
  } catch (e) {
    console.warn(`  (screenshot artifact "${name}" skipped: ${(e as Error).message})`);
  }
}

test.describe("component states", () => {
  test("timeline: default renders a list of events", async ({ page }) => {
    await go(page, "timeline-default");
    const list = page.getByRole("list", { name: /activity timeline/i });
    await expect(list).toBeVisible();
    expect(await list.getByRole("listitem").count()).toBeGreaterThan(0);
    await shoot(page, "timeline-default");
  });

  test("timeline: empty state renders (proves the empty branch)", async ({ page }) => {
    await go(page, "timeline-empty");
    await expect(page.getByRole("status")).toContainText(/no activity/i);
    await shoot(page, "timeline-empty");
  });
});

test.describe("screen states (these branches are dead under the static data seam)", () => {
  test("loading branch renders", async ({ page }) => {
    await go(page, "screen-loading");
    await expect(page.getByText(/loading review item/i)).toBeVisible();
    await shoot(page, "screen-loading");
  });

  test("error branch renders", async ({ page }) => {
    await go(page, "screen-error");
    await expect(page.getByText(/couldn.t load this item/i)).toBeVisible();
    await shoot(page, "screen-error");
  });

  test("not-found branch renders", async ({ page }) => {
    await go(page, "screen-notfound");
    await expect(page.getByText(/item not found/i)).toBeVisible();
    await shoot(page, "screen-notfound");
  });

  test("data state: composes a template + approved blocks, tokens resolve, no overflow", async ({ page }) => {
    await go(page, "screen-data");

    // composition is present: heading + the new compound rendered
    await expect(page.getByRole("heading", { name: /activity/i })).toBeVisible();
    await expect(page.getByRole("list", { name: /activity timeline/i })).toBeVisible();

    // runtime token conformance: a token-driven background actually resolved to a real color
    // (this is what would have caught the dead --color-surface-* / signal vars at render time).
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).not.toBe("rgba(0, 0, 0, 0)");
    expect(bodyBg).not.toBe("transparent");

    // no horizontal overflow (broken-layout guard)
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement as Element;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);

    await shoot(page, "screen-data");
  });
});
