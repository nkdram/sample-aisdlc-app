/**
 * Error reporting: the one seam a real collector can replace later.
 *
 * Rules (see SAMPLE-AISDLC-APP-22):
 * - reporting never throws and never rejects;
 * - at most MAX_REPORTS_PER_PAGE_LOAD reports per page load;
 * - the payload is a fixed whitelist of fields, so no bill amounts, names or
 *   other user data can leak into a report.
 */

/** How many reports one page load may send. */
export const MAX_REPORTS_PER_PAGE_LOAD = 5;

/** What is POSTed to /api/errors. Exactly these fields, nothing else. */
export interface ErrorReport {
  readonly message: string;
  readonly stack: string;
  readonly digest: string;
  readonly url: string;
  readonly version: string;
  /** Where the error was caught, e.g. "app/error". Never user data. */
  readonly scope?: string;
}

/** Extra context for a report. Only `scope` is copied into the payload. */
export interface ErrorContext {
  readonly scope?: string;
}

interface ErrorLike {
  readonly message?: unknown;
  readonly stack?: unknown;
  readonly digest?: unknown;
}

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

let reportsSent = 0;

/** Test helper: a fresh page load starts with a fresh budget. */
export function resetReportBudget(): void {
  reportsSent = 0;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asErrorLike(error: unknown): ErrorLike {
  return typeof error === "object" && error !== null ? (error as ErrorLike) : {};
}

/** Origin and path only: query strings and hashes can carry user data. */
function currentUrl(): string {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  return `${origin}${pathname}`;
}

/** Builds the report payload from an error and a whitelisted context. */
export function buildErrorReport(error: unknown, context: ErrorContext = {}): ErrorReport {
  const err = asErrorLike(error);
  const report: ErrorReport = {
    message: text(err.message, "Unknown error"),
    stack: text(err.stack),
    digest: text(err.digest),
    url: currentUrl(),
    version: VERSION,
  };
  return context.scope ? { ...report, scope: context.scope } : report;
}

/**
 * Sends one report to /api/errors. Never throws and never rejects: a broken
 * reporter must not break the page it is reporting on.
 */
export async function reportError(error: unknown, context: ErrorContext = {}): Promise<void> {
  if (reportsSent >= MAX_REPORTS_PER_PAGE_LOAD) return;
  reportsSent += 1;

  try {
    const body = JSON.stringify(buildErrorReport(error, context));
    await fetch("/api/errors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Swallowed on purpose: reporting is best effort.
  }
}

/** Normalises an untrusted request body into a report, dropping unknown fields. */
export function parseErrorReport(body: unknown): ErrorReport {
  const raw = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  return {
    message: text(raw.message, "Unknown error"),
    stack: text(raw.stack),
    digest: text(raw.digest),
    url: text(raw.url),
    version: text(raw.version, "unknown"),
  };
}

/** One JSON line for the server log; the route's only side effect. */
export function formatErrorLogLine(body: unknown): string {
  return JSON.stringify({ level: "error", event: "client_error", ...parseErrorReport(body) });
}
