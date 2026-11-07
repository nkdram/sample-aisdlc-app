import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";
import GlobalError from "@/app/global-error";
import { resetReportBudget } from "./report-error";
import {
  errorWithDigest,
  pressButton,
  renderMarkup,
  sentBodies,
  stubBrowserLocation,
  stubFetch,
} from "./testing/error-page-harness";

/**
 * The two error pages (SAMPLE-AISDLC-APP-22). They are client components and the
 * unit tests run in a node environment (no DOM), so `useEffect` runs its effect
 * immediately, the page is rendered to static markup for its text, and the
 * button's own onClick is invoked to prove the click behaviour.
 */
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: (effect: () => void) => {
      effect();
    },
  };
});

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetReportBudget();
  stubBrowserLocation("?bill=42.50&people=3&name=Ada");
  fetchMock = stubFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  resetReportBudget();
});

describe('app/error.tsx shows "Something went wrong" with a "Try again" button that calls reset()', () => {
  it("shows the friendly message and a Try again button", () => {
    const html = renderMarkup(ErrorPage, { error: errorWithDigest("boom"), reset: () => {} });

    expect(html).toContain("Something went wrong");
    expect(html).toContain("Try again");
    expect(html).toContain('type="button"');
  });

  it("calls reset() when Try again is clicked", () => {
    const reset = vi.fn();

    pressButton(ErrorPage({ error: errorWithDigest("boom"), reset }), "Try again");

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("Errors go through reportError(error, context): app/error reports with its own scope", async () => {
    renderMarkup(ErrorPage, { error: errorWithDigest("boom", "digest-1"), reset: () => {} });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/errors");
    expect(init.method).toBe("POST");
    expect(sentBodies(fetchMock)[0] ?? {}).toMatchObject({
      message: "boom",
      digest: "digest-1",
      scope: "app/error",
      url: "http://localhost:3000/",
    });
  });
});

describe("app/global-error.tsx covers errors in the root layout", () => {
  it("renders its own html and body, because the root layout is gone", () => {
    const html = renderMarkup(GlobalError, { error: errorWithDigest("boom"), reset: () => {} });

    expect(html.startsWith("<html")).toBe(true);
    expect(html).toContain('lang="en"');
    expect(html).toContain("<body>");
    expect(html).toContain("Something went wrong");
    expect(html).toContain("Try again");
  });

  it("calls reset() when Try again is clicked", () => {
    const reset = vi.fn();

    pressButton(GlobalError({ error: errorWithDigest("boom"), reset }), "Try again");

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("Covers errors in the root layout: it reports the error through reportError with the app/global-error scope", async () => {
    renderMarkup(GlobalError, { error: errorWithDigest("layout boom", "digest-2"), reset: () => {} });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(sentBodies(fetchMock)[0] ?? {}).toMatchObject({
      message: "layout boom",
      digest: "digest-2",
      scope: "app/global-error",
      url: "http://localhost:3000/",
    });
  });

  it("puts both pages in the app router so Next renders them for the segment and the root", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const files = readdirSync(new URL("../app", import.meta.url)).sort();
    const errorPage = readFileSync(new URL("../app/error.tsx", import.meta.url), "utf8");

    // app/error.tsx handles the page segment; app/global-error.tsx is the only
    // page Next uses when the root layout itself throws.
    expect(files).toContain("error.tsx");
    expect(files).toContain("global-error.tsx");
    expect(files).toContain("layout.tsx");
    expect(errorPage.startsWith('"use client"')).toBe(true);
  });

  it("is the root-level boundary that replaces a failed root layout, styles included", async () => {
    const { readFileSync } = await import("node:fs");
    const globalError = readFileSync(new URL("../app/global-error.tsx", import.meta.url), "utf8");
    const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

    // Next only picks up app/global-error.tsx (a file at the app root), never a
    // nested one, when the root layout of app/layout.tsx throws.
    expect(globalError.startsWith('"use client"')).toBe(true);
    expect(globalError).toContain('import "./globals.css"');
    expect(layout).toContain("<html lang=\"en\">");
    // The root layout is gone when GlobalError renders, so it owns the document.
    expect(globalError).toContain("<html lang=\"en\">");
    expect(globalError).toContain("<body>");
  });

  it("shares the page's segment, so Next renders it for errors thrown by app/page.tsx", async () => {
    const { readdirSync } = await import("node:fs");
    const segment = readdirSync(new URL("../app", import.meta.url)).sort();

    expect(segment).toContain("page.tsx");
    expect(segment).toContain("error.tsx");
  });
});

describe("no personal data (bill amounts, names) is included in a report", () => {
  it("sends nothing from the page, even with a query string full of user data", async () => {
    renderMarkup(GlobalError, { error: errorWithDigest("boom"), reset: () => {} });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = sentBodies(fetchMock)[0] ?? {};
    const serialised = JSON.stringify(body);

    expect(body["url"]).toBe("http://localhost:3000/");
    expect(serialised).not.toMatch(/bill/i);
    expect(serialised).not.toMatch(/people/i);
    expect(serialised).not.toMatch(/42\.5/);
    expect(serialised).not.toMatch(/Ada/);
  });
});
