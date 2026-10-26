import { expect, test } from "@playwright/test";

test("splits a bill with the default 15% tip", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("100");
  await page.getByLabel("People").fill("4");
  await expect(page.getByTestId("tip")).toHaveText("$15.00");
  await expect(page.getByTestId("total")).toHaveText("$115.00");
  await expect(page.getByTestId("per-person")).toHaveText("$28.75");
});

test("switches tip preset", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("50");
  await page.getByRole("button", { name: "20%" }).click();
  await expect(page.getByTestId("total")).toHaveText("$60.00");
});

test("explains invalid input", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("10");
  await page.getByLabel("People").fill("0");
  await expect(page.getByRole("alert")).toHaveText("At least one person must pay");
});

test("copy summary button is disabled without a valid bill", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("copy-summary")).toBeDisabled();
});

test("copies the summary and shows Copied for 2 seconds", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByLabel("Bill").fill("100");
  await page.getByLabel("People").fill("4");

  await page.getByTestId("copy-summary").click();
  await expect(page.getByTestId("copy-summary")).toHaveText("Copied");
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toBe(
    "Bill $100.00 + tip $15.00 (15%) = $115.00. Each of 4 pays $28.75."
  );

  await expect(page.getByTestId("copy-summary")).toHaveText("Copy summary", { timeout: 3000 });
});

test("shows a read-only fallback when clipboard is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () => Promise.reject(new Error("Clipboard unavailable")),
      },
    });
  });
  await page.goto("/");
  await page.getByLabel("Bill").fill("100");
  await page.getByLabel("People").fill("4");

  await page.getByTestId("copy-summary").click();
  const fallback = page.locator("#copy-fallback");
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveValue(
    "Bill $100.00 + tip $15.00 (15%) = $115.00. Each of 4 pays $28.75."
  );
});
