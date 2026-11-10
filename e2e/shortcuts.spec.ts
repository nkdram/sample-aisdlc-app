import { expect, test } from "@playwright/test";

// Keyboard shortcuts: presets 1/2/3, +/- people, / bill, ? help, Escape close.

const presets = (page: import("@playwright/test").Page) => page.getByRole("group", { name: "Tip percentage" });

/** Moves focus out of the inputs so shortcuts are not ignored. */
async function leaveInputs(page: import("@playwright/test").Page) {
  await page.locator("h1").click();
}

test("1, 2 and 3 select the first, second and third tip preset; + and - change People with the stepper's limits (1-50).", async ({ page }) => {
  await page.goto("/");
  await leaveInputs(page);

  await page.keyboard.press("1");
  await expect(presets(page).getByRole("button", { name: "10%" })).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("2");
  await expect(presets(page).getByRole("button", { name: "15%" })).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("3");
  await expect(presets(page).getByRole("button", { name: "20%" })).toHaveAttribute("aria-pressed", "true");

  await expect(page.getByLabel("People")).toHaveValue("1");
  await page.keyboard.press("+");
  await page.keyboard.press("+");
  await expect(page.getByLabel("People")).toHaveValue("3");
  await page.keyboard.press("-");
  await expect(page.getByLabel("People")).toHaveValue("2");

  // The stepper's limits hold: never below 1, never above 50.
  await page.keyboard.press("-");
  await page.keyboard.press("-");
  await expect(page.getByLabel("People")).toHaveValue("1");
  for (let i = 0; i < 55; i += 1) await page.keyboard.press("+");
  await expect(page.getByLabel("People")).toHaveValue("50");
});

test("/ moves focus to the Bill input; ? opens a dialog listing all shortcuts; Escape closes it and returns focus.", async ({ page }) => {
  await page.goto("/");
  await leaveInputs(page);

  await page.keyboard.press("/");
  await expect(page.getByLabel("Bill")).toBeFocused();

  await page.keyboard.press("?");
  const dialog = page.getByTestId("shortcuts-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("role", "dialog");
  await expect(dialog).toHaveAttribute("aria-label", "Keyboard shortcuts");
  for (const keys of ["1 / 2 / 3", "+ / -", "/", "?", "Escape"]) {
    await expect(dialog).toContainText(keys);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByLabel("Bill")).toBeFocused();
});

test("Shortcuts are ignored while typing in an input (except Escape).", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Bill").fill("100");
  await page.getByLabel("Bill").press("2");
  await expect(page.getByLabel("Bill")).toHaveValue("1002");
  await expect(presets(page).getByRole("button", { name: "15%" })).toHaveAttribute("aria-pressed", "true");

  await page.getByLabel("People").fill("4");
  await page.getByLabel("People").press("+");
  await expect(page.getByLabel("People")).toHaveValue("4");

  // Escape still works while typing.
  await page.keyboard.press("?");
  await expect(page.getByTestId("shortcuts-dialog")).toBeHidden();
  await leaveInputs(page);
  await page.keyboard.press("?");
  await expect(page.getByTestId("shortcuts-dialog")).toBeVisible();
  await page.getByLabel("Bill").focus();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("shortcuts-dialog")).toBeHidden();
});

test("Changes made by shortcuts are announced through the existing aria-live result.", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("100");
  await leaveInputs(page);

  const result = page.locator("dl.result");
  await expect(result).toHaveAttribute("aria-live", "polite");
  await expect(page.getByTestId("tip")).toHaveText("$15.00");

  await page.keyboard.press("3");
  await expect(page.getByTestId("tip")).toHaveText("$20.00");
  await expect(page.getByTestId("total")).toHaveText("$120.00");

  await page.keyboard.press("+");
  await expect(page.getByTestId("per-person")).toHaveText("$60.00");
});
