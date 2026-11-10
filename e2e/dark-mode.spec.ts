import { expect, test } from "@playwright/test";
import { measureContrast, measureFocusOutline, type ContrastCheck } from "./contrast";

// Dark mode is pure CSS: app/globals.css overrides the --* tokens inside a
// prefers-color-scheme: dark media query. These tests emulate the system
// setting and check the resulting computed colors and WCAG AA contrast.
// No axe dependency is installed, so contrast is computed numerically.

const TEXT_MIN = 4.5;
const NON_TEXT_MIN = 3;

const LIGHT_BG = "rgb(247, 245, 251)"; // #f7f5fb
const DARK_BG = "rgb(20, 16, 31)"; // #14101f
const DARK_INK = "rgb(242, 238, 252)"; // #f2eefc

const CONTRAST_TARGETS: ContrastCheck[] = [
  { label: "body text", selector: "h1", min: TEXT_MIN },
  { label: "muted lead", selector: ".lead", min: TEXT_MIN },
  { label: "result values", selector: ".result dd", min: TEXT_MIN },
  { label: "pressed preset label", selector: '.presets button[aria-pressed="true"]', min: TEXT_MIN },
  { label: "copy summary label", selector: ".copy-summary", min: TEXT_MIN },
];

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });

  test("With prefers-color-scheme: dark, the page uses a dark background and light text.", async ({
    page,
  }) => {
    await page.goto("/");

    const colors = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const root = getComputedStyle(document.documentElement);
      return {
        bodyBackground: body.backgroundColor,
        bodyColor: body.color,
        rootBackground: root.backgroundColor,
        rootColor: root.color,
      };
    });

    expect(colors.bodyBackground).toBe(DARK_BG);
    expect(colors.bodyColor).toBe(DARK_INK);
    expect(colors.rootBackground).toBe(DARK_BG);
    expect(colors.rootColor).toBe(DARK_INK);

    // "Dark" means a low relative luminance, not merely a different hex.
    const backgroundLuminance = await page.evaluate((color) => {
      const match = color.match(/rgba?\(([^)]+)\)/);
      if (!match || !match[1]) throw new Error(`Unsupported color: ${color}`);
      const [r = 0, g = 0, b = 0] = match[1]
        .split(",")
        .map((part) => Number(part.trim()));
      const channel = (value: number) => {
        const scaled = value / 255;
        return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    }, colors.bodyBackground);

    expect(backgroundLuminance).toBeLessThan(0.2);
  });
});

test("All text and focus outlines keep AA contrast in both themes.", async ({ page }) => {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    // A valid bill keeps the copy button enabled, so its label is checked in its
    // active state (disabled controls are exempt from WCAG 1.4.3).
    await page.getByLabel("Bill").fill("100");
    await page.getByLabel("People").fill("4");
    await expect(page.getByTestId("copy-summary")).toBeEnabled();

    const results = await page.evaluate(measureContrast, CONTRAST_TARGETS);
    for (const result of results) {
      expect(result.ratio, `${colorScheme} theme: ${result.label}`).toBeGreaterThanOrEqual(
        result.min
      );
    }

    // The error message only exists for invalid input.
    await page.getByLabel("People").fill("0");
    await expect(page.getByRole("alert")).toBeVisible();
    const errorResults = await page.evaluate(measureContrast, [
      { label: "error message", selector: ".error", min: TEXT_MIN },
    ]);
    for (const result of errorResults) {
      expect(result.ratio, `${colorScheme} theme: ${result.label}`).toBeGreaterThanOrEqual(
        result.min
      );
    }

    // Keyboard focus triggers :focus-visible, which must stay visible in both themes.
    await page.getByLabel("Bill").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "10%" })).toBeFocused();

    const outline = await page.evaluate(measureFocusOutline);
    expect(outline, `${colorScheme} theme: focus outline`).not.toBeNull();
    expect(outline!.outlineStyle, `${colorScheme} theme: focus outline style`).not.toBe("none");
    expect(
      outline!.outlineWidth,
      `${colorScheme} theme: focus outline width`
    ).toBeGreaterThanOrEqual(2);
    expect(outline!.ratio, `${colorScheme} theme: focus outline contrast`).toBeGreaterThanOrEqual(
      NON_TEXT_MIN
    );
  }
});

test("No toggle; the system setting decides.", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  // No control offers a theme choice.
  await expect(page.getByRole("button", { name: /dark|light|theme/i })).toHaveCount(0);
  await expect(page.getByRole("switch")).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);

  const lightBackground = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor
  );
  expect(lightBackground).toBe(LIGHT_BG);

  // Only the emulated system setting changes the theme; the page is untouched.
  await page.emulateMedia({ colorScheme: "dark" });
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .toBe(DARK_BG);

  await page.emulateMedia({ colorScheme: "light" });
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .toBe(lightBackground);
});
