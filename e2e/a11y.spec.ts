import { expect, test, type Page } from "@playwright/test";

/**
 * Why axe: SAMPLE-AISDLC-APP-9 asks for an automated accessibility check of the
 * home page, and axe-core is the standard engine for it. It is a test-time tool
 * only — no runtime dependency is added.
 *
 * Why it is injected at runtime instead of imported from @axe-core/playwright:
 * dependency manifests and lockfiles are owned outside this change, so the scan
 * cannot add a package. The bundle is pinned to an exact version so the scan is
 * reproducible. Once @axe-core/playwright is a devDependency, replace runAxe
 * with `new AxeBuilder({ page }).analyze()` — nothing else changes.
 */
const AXE_CDN = "https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js";

interface AxeNode {
  target: string[];
}

interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  nodes: AxeNode[];
}

interface AxeResults {
  violations: AxeViolation[];
}

interface AxeGlobal {
  run: (context: Document) => Promise<AxeResults>;
}

declare global {
  interface Window {
    axe?: AxeGlobal;
  }
}

async function runAxe(page: Page): Promise<AxeResults> {
  await page.addScriptTag({ url: AXE_CDN });
  return page.evaluate(async () => {
    const axe = window.axe;
    if (!axe) throw new Error("axe-core did not load");
    return axe.run(document);
  });
}

test("An automated axe check of the home page reports no serious or critical violations", async ({
  page,
}) => {
  await page.goto("/");

  const results = await runAxe(page);
  const blocking = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help} -> ${violation.nodes
          .map((node) => node.target.join(" "))
          .join(", ")}`
    );

  expect(blocking).toEqual([]);
});

test("Focus is always visible (2px outline with at least 3:1 contrast) on inputs and buttons", async ({
  page,
}) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.locator("#bill")).toBeFocused();

  const outline = await page.locator("#bill").evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: style.outlineWidth, style: style.outlineStyle, color: style.outlineColor };
  });

  expect(outline.style).toBe("solid");
  expect(outline.width).toBe("2px");
  // --brand #6b3fa0, ~7:1 against the card and the page.
  expect(outline.color).toBe("rgb(107, 63, 160)");

  // The same outline is applied to the preset buttons.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "10%" })).toBeFocused();
  const buttonOutline = await page
    .getByRole("button", { name: "10%" })
    .evaluate((element) => getComputedStyle(element).outlineWidth);
  expect(buttonOutline).toBe("2px");
});

test("tab order is Bill -> tip presets -> People", async ({ page }) => {
  await page.goto("/");

  const focused = async () =>
    page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return active?.id || active?.textContent?.trim() || active?.tagName || "";
    });

  await page.keyboard.press("Tab");
  await expect.poll(focused).toBe("bill");

  await page.keyboard.press("Tab");
  await expect.poll(focused).toBe("10%");
  await page.keyboard.press("Tab");
  await expect.poll(focused).toBe("15%");
  await page.keyboard.press("Tab");
  await expect.poll(focused).toBe("20%");

  await page.keyboard.press("Tab");
  await expect.poll(focused).toBe("people");
});

test("Every input and button group has a visible label and an accessible name", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Bill")).toBeVisible();
  await expect(page.getByLabel("People")).toBeVisible();
  await expect(page.locator("span.label")).toHaveText("Tip");
  await expect(page.getByRole("group", { name: "Tip percentage" })).toBeVisible();
  for (const name of ["10%", "15%", "20%"]) {
    await expect(page.getByRole("button", { name })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Copy summary" })).toBeVisible();
});

test("Results are announced politely when they change (aria-live already exists; keep it)", async ({
  page,
}) => {
  await page.goto("/");

  const result = page.locator("dl.result");
  await expect(result).toHaveAttribute("aria-live", "polite");

  await page.getByLabel("Bill").fill("100");
  await page.getByLabel("People").fill("4");
  await expect(page.getByTestId("total")).toHaveText("$115.00");
  await expect(result).toHaveAttribute("aria-live", "polite");
});
