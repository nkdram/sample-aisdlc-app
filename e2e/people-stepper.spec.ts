import { expect, test } from "@playwright/test";

test("E2E: click + three times from 1 -> 4 and the per-person amount updates.", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("100");
  await page.getByRole("button", { name: "More people" }).click();
  await page.getByRole("button", { name: "More people" }).click();
  await page.getByRole("button", { name: "More people" }).click();
  await expect(page.getByLabel("People")).toHaveValue("4");
  await expect(page.getByTestId("per-person")).toHaveText("$28.75");
});
