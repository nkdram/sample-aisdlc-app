import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ErrorPage from "@/app/error";
import GlobalError from "@/app/global-error";
import { resetReportBudget } from "./report-error";

/**
 * The error pages are client components and the unit tests run in a node
 * environment (no DOM), so they are rendered to static markup and `useEffect`
 * runs its callback immediately: that is enough to prove the page reports the
 * error it was given, with the right scope, through the stubbed fetch.
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

type ErrorPageProps = { error: Error & { digest?: string }; reset: () => void };

function errorWithDigest(message: string, digest?: string): Error & { digest?: string } {
  const error: Error & { digest?: string } = new Error(message);
  if (digest) error.digest = digest;
  return error;
}

function render(page: (props: ErrorPageProps) => ReactElement, props: ErrorPageProps): string {
  return renderToStaticMarkup(createElement(page, props));
}

function sentBodies(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown>[] {
  return fetchMock.mock.calls.map((call) => {
    const init = (call as unknown[])[1] as RequestInit;
    return JSON.parse(String(init.body)) as Record<string, unknown>;
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetReportBudget();
  vi.stubGlobal("window", {
    location: { origin: "http://localhost:3000", pathname: "/", search: "?bill=42.50&name=Ada" },
  });
  fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  resetReportBudget();
});

describe("app/error.tsx", () => {
  it("shows the friendly message and a Try again button", () => {
    const html = render(ErrorPage, { error: errorWithDigest("boom"), reset: () => {} });

    expect(html).toContain("Something went wrong");
    expect(html).toContain("Try again");
    expect(html).toContain('type="button"');
  });

  it("reports the error with the app/error scope", async () => {
    render(ErrorPage, { error: errorWithDigest("boom", "digest-1"), reset: () => {} });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/errors");
    expect(init.method).toBe("POST");

    const body = sentBodies(fetchMock)[0] ?? {};
    expect(body).toMatchObject({ message: "boom", digest: "digest-1", scope: "app/error" });
    expect(body.url).toBe("http://localhost:3000/");
  });
});

describe("app/global-error.tsx", () => {
  it("covers the root layout: it renders its own html and body", () => {
    const html = render(GlobalError, { error: errorWithDigest("boom"), reset: () => {} });

    expect(html.startsWith("<html")).toBe(true);
    expect(html).toContain("<body>");
    expect(html).toContain("Something went wrong");
    expect(html).toContain("Try again");
  });

  it("reports the error with the app/global-error scope", async () => {
    render(GlobalError, { error: errorWithDigest("layout boom", "digest-2"), reset: () => {} });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = sentBodies(fetchMock)[0] ?? {};
    expect(body).toMatchObject({ message: "layout boom", digest: "digest-2", scope: "app/global-error" });
  });

  it("never sends the bill or names from the page", async () => {
    render(GlobalError, { error: errorWithDigest("boom"), reset: () => {} });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const serialised = JSON.stringify(sentBodies(fetchMock)[0] ?? {});
    expect(serialised).not.toMatch(/bill/i);
    expect(serialised).not.toMatch(/people/i);
    expect(serialised).not.toMatch(/42\.5/);
    expect(serialised).not.toMatch(/Ada/);
  });
});
