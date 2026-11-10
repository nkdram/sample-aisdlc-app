import { describe, expect, it } from "vitest";
import { isCrashRequested } from "./crash-trigger";

describe("isCrashRequested", () => {
  it("is on for ?crash=1 outside production", () => {
    expect(isCrashRequested("?crash=1", "development", false)).toBe(true);
    expect(isCrashRequested("?crash=1", "test", false)).toBe(true);
  });

  it("is off for any other value", () => {
    expect(isCrashRequested("", "development", false)).toBe(false);
    expect(isCrashRequested("?crash=0", "development", false)).toBe(false);
    expect(isCrashRequested("?crash", "development", false)).toBe(false);
  });

  it("is off in production unless the build opts in", () => {
    expect(isCrashRequested("?crash=1", "production", false)).toBe(false);
    expect(isCrashRequested("?crash=1", "production", true)).toBe(true);
  });
});
