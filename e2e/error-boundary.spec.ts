import { expect, test } from "@playwright/test";

test("shows the error boundary, reports the error and recovers on Try again", async ({ page }) => {
  const reports: Record<string, unknown>[] = [];
  await page.route("**/api/errors", async (route) => {
    reports.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/?crash=1");

  await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();

  await expect.poll(() => reports.length).toBeGreaterThan(0);
  const report = reports[0] ?? {};
  expect(report.message).toBe("Test crash triggered by ?crash=1");
  expect(typeof report.stack).toBe("string");
  expect(typeof report.digest).toBe("string");
  expect(typeof report.version).toBe("string");
  expect(report.url).toBe(new URL(page.url()).origin + "/");
  expect(report).not.toHaveProperty("bill");
  expect(report).not.toHaveProperty("people");

  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Tip splitter" })).toBeVisible();
});

test("does not crash without the trigger", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tip splitter" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toHaveCount(0);
});
