import { expect, test } from "@playwright/test";

// SAMPLE-AISDLC-APP-10: the result list gains a "Tip per person" row.

test('A "Tip per person" row after "Per person", formatted as currency', async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("100");
  await page.getByLabel("People").fill("4");

  const row = page.getByTestId("tip-per-person");
  await expect(row).toBeVisible();
  await expect(row).toHaveText("$3.75");

  // The row sits directly after "Per person" in the result list.
  const labels = page.locator("dl.result dt");
  await expect(labels).toHaveText(["Tip", "Total", "Per person", "Tip per person"]);
  const perPersonIndex = await labels.evaluateAll((nodes) =>
    nodes.findIndex((node) => node.textContent === "Per person")
  );
  const tipPerPersonIndex = await labels.evaluateAll((nodes) =>
    nodes.findIndex((node) => node.textContent === "Tip per person")
  );
  expect(tipPerPersonIndex).toBe(perPersonIndex + 1);
});

test("Tip per person = tip / people, rounded to cents", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("10");
  await page.getByLabel("People").fill("3");
  await page.getByRole("button", { name: "10%" }).click();

  await expect(page.getByTestId("tip")).toHaveText("$1.00");
  await expect(page.getByTestId("tip-per-person")).toHaveText("$0.33");
});

test("With 1 person it equals the tip", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("100");
  await page.getByLabel("People").fill("1");

  await expect(page.getByTestId("tip")).toHaveText("$15.00");
  await expect(page.getByTestId("tip-per-person")).toHaveText("$15.00");
});
