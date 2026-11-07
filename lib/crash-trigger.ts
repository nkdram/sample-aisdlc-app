/**
 * Test-only crash trigger: `?crash=1` forces an error so e2e can exercise the
 * error boundary. It is never honoured in a production build unless the build
 * explicitly opts in (NEXT_PUBLIC_ALLOW_CRASH_TRIGGER=1, set by the e2e runner).
 */

export const CRASH_PARAM = "crash";

export function isCrashRequested(
  search: string,
  nodeEnv: string | undefined,
  allowInProduction: boolean
): boolean {
  if (nodeEnv === "production" && !allowInProduction) return false;
  return new URLSearchParams(search).get(CRASH_PARAM) === "1";
}
