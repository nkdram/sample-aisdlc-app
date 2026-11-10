import { expect, test, type Page } from "@playwright/test";

/**
 * axe-core is injected at runtime instead of imported from @axe-core/playwright:
 * dependency manifests are owned outside this change, so the scan must not add a
 * package. Swapping the two lines in runAxe for `new AxeBuilder({ page })` is the
 * only change needed once the devDependency is added.
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

test("home page has no serious or critical axe violations", async ({ page }) => {
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

test("keyboard focus is visible with a 2px brand outline", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.locator("#bill")).toBeFocused();

  const outline = await page.locator("#bill").evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: style.outlineWidth, style: style.outlineStyle, color: style.outlineColor };
  });

  expect(outline.style).toBe("solid");
  expect(outline.width).toBe("2px");
  // --brand #6b3fa0
  expect(outline.color).toBe("rgb(107, 63, 160)");
});

test("every input and button group has a visible label and an accessible name", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Bill")).toBeVisible();
  await expect(page.getByLabel("People")).toBeVisible();
  await expect(page.locator("span.label")).toHaveText("Tip");
  await expect(page.getByRole("group", { name: "Tip percentage" })).toBeVisible();
  for (const name of ["10%", "15%", "20%"]) {
    await expect(page.getByRole("button", { name })).toBeVisible();
  }
});
