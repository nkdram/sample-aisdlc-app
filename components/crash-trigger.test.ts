import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * The crash trigger is a client component; the unit tests run in a node
 * environment, so `useEffect` runs its callback immediately and the component is
 * rendered to static markup. Each test re-imports the module so the
 * once-per-page-load flag starts fresh.
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

async function renderTrigger(search: string): Promise<string> {
  vi.resetModules();
  vi.stubGlobal("window", { location: { origin: "http://localhost:3000", pathname: "/", search } });
  const { CrashTrigger } = await import("./crash-trigger");
  return renderToStaticMarkup(createElement(CrashTrigger));
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("CrashTrigger", () => {
  it("throws the test error when ?crash=1 is requested", async () => {
    await expect(renderTrigger("?crash=1")).rejects.toThrow("Test crash triggered by ?crash=1");
  });

  it("renders nothing without the trigger", async () => {
    await expect(renderTrigger("")).resolves.toBe("");
  });

  it("stays inert in a production build that did not opt in", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(renderTrigger("?crash=1")).resolves.toBe("");
  });
});
