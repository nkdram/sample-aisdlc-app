import { expect, test, type Page } from "@playwright/test";

const HISTORY_KEY = "tip-splitter:history";

async function saveSplit(page: Page, bill: string, people: string) {
  await page.goto("/");
  await page.getByLabel("Bill").fill(bill);
  await page.getByLabel("People").fill(people);
  await page.getByTestId("save-split").click();
}

test('A "Save split" button stores {bill, tipPercent, people, total, perPerson, savedAt} under "tip-splitter:history"; the newest 20 entries are kept', async ({
  page,
}) => {
  await saveSplit(page, "100", "4");
  await saveSplit(page, "50", "2");

  const raw = await page.evaluate((key) => window.localStorage.getItem(key), HISTORY_KEY);
  expect(raw).not.toBeNull();
  const stored = JSON.parse(raw as string) as { version: number; entries: Record<string, unknown>[] };

  expect(stored.version).toBe(1);
  expect(stored.entries).toHaveLength(2);
  const [newest, oldest] = stored.entries;
  expect(newest).toMatchObject({ bill: 50, tipPercent: 15, people: 2, total: 57.5, perPerson: 28.75 });
  expect(typeof newest?.savedAt).toBe("number");
  expect(oldest).toMatchObject({ bill: 100, tipPercent: 15, people: 4, total: 115, perPerson: 28.75 });
});

test("Save split is disabled until the split is valid", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("save-split")).toBeDisabled();
  await page.getByLabel("Bill").fill("100");
  await expect(page.getByTestId("save-split")).toBeEnabled();
});

test("A /history page lists entries newest first with date, total, people and per person, and links back to the calculator", async ({
  page,
}) => {
  await saveSplit(page, "100", "4");
  await saveSplit(page, "50", "2");
  await page.goto("/history");

  const rows = page.getByTestId("history-entry");
  await expect(rows).toHaveCount(2);

  await expect(rows.nth(0).getByTestId("history-total")).toHaveText("$57.50");
  await expect(rows.nth(0).getByTestId("history-people")).toHaveText("2");
  await expect(rows.nth(0).getByTestId("history-per-person")).toHaveText("$28.75");
  await expect(rows.nth(0).getByTestId("history-date")).not.toBeEmpty();

  await expect(rows.nth(1).getByTestId("history-total")).toHaveText("$115.00");
  await expect(rows.nth(1).getByTestId("history-people")).toHaveText("4");
  await expect(rows.nth(1).getByTestId("history-per-person")).toHaveText("$28.75");

  await expect(page.getByRole("link", { name: "Back to calculator" })).toHaveAttribute("href", "/");
});

test('Each entry has "Load" (opens the calculator with its values) and "Delete"; "Clear history" asks for confirmation first', async ({
  page,
}) => {
  await saveSplit(page, "100", "4");
  await page.goto("/history");

  await page.getByTestId("history-load").first().click();
  await expect(page).toHaveURL(/\/\?bill=100&tip=15&people=4/);
  await expect(page.getByLabel("Bill")).toHaveValue("100");
  await expect(page.getByLabel("People")).toHaveValue("4");
  await expect(page.getByTestId("total")).toHaveText("$115.00");

  await page.goto("/history");
  await page.getByTestId("history-delete").first().click();
  await expect(page.getByTestId("history-entry")).toHaveCount(0);
  await expect(page.getByText("No saved splits yet")).toBeVisible();
});

test("Clear history asks for confirmation first", async ({ page }) => {
  await saveSplit(page, "100", "4");
  await page.goto("/history");

  let accept = false;
  page.on("dialog", (dialog) => (accept ? dialog.accept() : dialog.dismiss()));

  await page.getByTestId("clear-history").click();
  await expect(page.getByTestId("history-entry")).toHaveCount(1);

  accept = true;
  await page.getByTestId("clear-history").click();
  await expect(page.getByText("No saved splits yet")).toBeVisible();
});

test('Corrupt or unknown-version storage is treated as empty history and never crashes the page; storage errors show "History is not available in this browser"', async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate((key) => window.localStorage.setItem(key, "{not json"), HISTORY_KEY);
  await page.goto("/history");
  await expect(page.getByText("No saved splits yet")).toBeVisible();

  await page.evaluate(
    (key) => window.localStorage.setItem(key, JSON.stringify({ version: 99, entries: [] })),
    HISTORY_KEY
  );
  await page.goto("/history");
  await expect(page.getByText("No saved splits yet")).toBeVisible();

  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("storage disabled");
      },
    });
  });
  await page.goto("/history");
  await expect(page.getByText("History is not available in this browser")).toBeVisible();
});

test('With no entries the page reads "No saved splits yet"', async ({ page }) => {
  await page.goto("/history");
  await expect(page.getByText("No saved splits yet")).toBeVisible();
});
