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
