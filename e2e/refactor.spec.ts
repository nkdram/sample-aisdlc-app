import { expect, test } from "@playwright/test";

// Safety net for the split into components/tip/*: the page must look and behave
// exactly as before, and must not gain any control from the conflicting tickets.

test("keeps the same labels, test ids, aria attributes and text", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Bill")).toBeVisible();
  await expect(page.getByLabel("People")).toBeVisible();

  const presets = page.getByRole("group", { name: "Tip percentage" });
  await expect(presets.getByRole("button")).toHaveText(["10%", "15%", "20%"]);
  await expect(presets.getByRole("button", { name: "15%" })).toHaveAttribute("aria-pressed", "true");
  await expect(presets.getByRole("button", { name: "10%" })).toHaveAttribute("aria-pressed", "false");

  const result = page.locator("dl.result");
  await expect(result).toHaveAttribute("aria-live", "polite");
  await expect(page.getByTestId("tip")).toHaveText("$0.00");
  await expect(page.getByTestId("total")).toHaveText("$0.00");
  await expect(page.getByTestId("per-person")).toHaveText("$0.00");

  const copy = page.getByTestId("copy-summary");
  await expect(copy).toHaveText("Copy summary");
  await expect(copy).toHaveAttribute("aria-live", "polite");
  await expect(copy).toBeDisabled();
});

test("keeps the same focus order", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("100");

  await page.getByLabel("Bill").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "10%" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "15%" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "20%" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("People")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("copy-summary")).toBeFocused();
});

test("keeps the same error text and alert role", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("10");
  await page.getByLabel("People").fill("0");
  await expect(page.getByRole("alert")).toHaveText("At least one person must pay");
});

test("adds no controls from the conflicting feature tickets", async ({ page }) => {
  await page.goto("/");

  // Three preset buttons plus the copy button, two text inputs and the currency
  // select added by the euro/pound ticket, nothing else.
  await expect(page.getByRole("button")).toHaveCount(4);
  await expect(page.locator("input")).toHaveCount(2);
  await expect(page.getByRole("combobox")).toHaveCount(1);
  await expect(page.getByRole("spinbutton")).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
});
