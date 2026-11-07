import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, vi } from "vitest";

/**
 * Shared helpers for the unit tests of the two error pages (app/error.tsx and
 * app/global-error.tsx). They are client components and the unit tests run in a
 * node environment (no DOM), so a page is rendered to static markup for its
 * text, and its button handlers are invoked directly to prove the click
 * behaviour. Each test file still mocks `react`'s useEffect to run the reporting
 * effect immediately.
 */

export type ErrorPageProps = { error: Error & { digest?: string }; reset: () => void };

export type ErrorPageComponent = (props: ErrorPageProps) => ReactElement;

export function errorWithDigest(message: string, digest?: string): Error & { digest?: string } {
  const error: Error & { digest?: string } = new Error(message);
  if (digest) error.digest = digest;
  return error;
}

export function renderMarkup(page: ErrorPageComponent, props: ErrorPageProps): string {
  return renderToStaticMarkup(createElement(page, props));
}

interface ElementLike {
  readonly type: unknown;
  readonly props: Record<string, unknown>;
}

function isElementLike(value: unknown): value is ElementLike {
  return typeof value === "object" && value !== null && "props" in value && "type" in value;
}

/** Depth-first search of a rendered element tree for the node with this text. */
function findElementWithText(node: unknown, text: string): ElementLike | undefined {
  if (!isElementLike(node)) return undefined;
  const children = node.props["children"];
  if (children === text) return node;
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    const found = findElementWithText(child, text);
    if (found !== undefined) return found;
  }
  return undefined;
}

/** Presses the button labelled `text` the way a user would. */
export function pressButton(page: ReactElement, text: string): void {
  const button = findElementWithText(page, text);
  expect(button).toBeDefined();
  const onClick = button?.props["onClick"];
  expect(typeof onClick).toBe("function");
  (onClick as () => void)();
}

/** The unit tests run in a node environment, so stand in for the browser location. */
export function stubBrowserLocation(search = ""): void {
  vi.stubGlobal("window", {
    location: { origin: "http://localhost:3000", pathname: "/", search },
  });
}

export function stubFetch(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The JSON bodies reportError sent, in order. */
export function sentBodies(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown>[] {
  return fetchMock.mock.calls.map((call) => {
    const init = (call as unknown[])[1] as RequestInit;
    return JSON.parse(String(init.body)) as Record<string, unknown>;
  });
}
