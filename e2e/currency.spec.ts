import { expect, test } from "@playwright/test";

// The euro/pound ticket: the currency choice changes formatting (and how a
// comma is read) only, never the calculation.

test("defaults to USD and formats amounts in en-US", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("currency")).toHaveValue("USD");

  await page.getByLabel("Bill").fill("100");
  await page.getByLabel("People").fill("4");
  await expect(page.getByTestId("tip")).toHaveText("$15.00");
  await expect(page.getByTestId("total")).toHaveText("$115.00");
  await expect(page.getByTestId("per-person")).toHaveText("$28.75");
});

test("switch to EUR, bill 100, 4 people -> per person shows 28,75 €", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("100");
  await page.getByLabel("People").fill("4");
  await page.getByTestId("currency").selectOption("EUR");

  await expect(page.getByTestId("tip")).toHaveText("15,00\u00a0€");
  await expect(page.getByTestId("total")).toHaveText("115,00\u00a0€");
  await expect(page.getByTestId("per-person")).toHaveText("28,75\u00a0€");
});

test("accepts a comma as the decimal separator when EUR is selected", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("currency").selectOption("EUR");
  await page.getByLabel("Bill").fill("42,50");
  await page.getByLabel("People").fill("1");

  await expect(page.getByTestId("tip")).toHaveText("6,38\u00a0€");
  await expect(page.getByTestId("total")).toHaveText("48,88\u00a0€");
  await expect(page.getByTestId("per-person")).toHaveText("48,88\u00a0€");
});

test("formats GBP in en-GB", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("100");
  await page.getByLabel("People").fill("4");
  await page.getByTestId("currency").selectOption("GBP");

  await expect(page.getByTestId("per-person")).toHaveText("£28.75");
});

test("switching back to USD shows the same amounts in dollars", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("100");
  await page.getByLabel("People").fill("4");
  await page.getByTestId("currency").selectOption("EUR");
  await expect(page.getByTestId("per-person")).toHaveText("28,75\u00a0€");

  await page.getByTestId("currency").selectOption("USD");
  await expect(page.getByTestId("per-person")).toHaveText("$28.75");
});

test("the choice changes formatting only, never the calculation", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bill").fill("100");
  await page.getByLabel("People").fill("4");

  const amounts: string[] = [];
  for (const currency of ["USD", "EUR", "GBP"]) {
    await page.getByTestId("currency").selectOption(currency);
    const text = await page.getByTestId("per-person").innerText();
    amounts.push(text.replace(/[^0-9.,]/g, ""));
  }

  // Same digits in every currency: only the locale formatting differs.
  expect(amounts).toEqual(["28.75", "28,75", "28.75"]);
});
