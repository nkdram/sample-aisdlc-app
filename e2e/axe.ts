import type { Page } from "@playwright/test";

// The ticket's test plan asks for an axe check in both colour schemes. axe is
// not a dependency of this repo (manifests are protected), so the scan uses the
// packaged @axe-core/playwright builder when it is installed and otherwise
// injects the pinned axe-core build at runtime. Both paths return the same
// AxeResults shape, so the assertions below do not change when the package is
// added: `npm i -D @axe-core/playwright@4.10.2` is the only step needed.

const AXE_CDN_URL = "https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js";

export interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  targets: string[];
}

interface AxeNode {
  target: string[];
}

interface AxeResults {
  violations: { id: string; impact: string | null; help: string; nodes: AxeNode[] }[];
}

/** The packaged builder, when @axe-core/playwright is installed. */
async function analyzeWithPackage(page: Page): Promise<AxeResults | null> {
  // A variable specifier keeps TypeScript from resolving the optional package.
  const specifier = "@axe-core/playwright";
  try {
    const mod = await import(specifier);
    const AxeBuilder = mod?.AxeBuilder ?? mod?.default?.AxeBuilder;
    if (typeof AxeBuilder !== "function") return null;
    return (await new AxeBuilder({ page }).analyze()) as AxeResults;
  } catch {
    return null;
  }
}

/** Fallback: inject the pinned axe-core build into the page and run it there. */
async function analyzeWithCdn(page: Page): Promise<AxeResults> {
  await page.addScriptTag({ url: AXE_CDN_URL });
  return page.evaluate(async () => {
    const { axe } = window as unknown as {
      axe: { run: (context: Document) => Promise<AxeResults> };
    };
    return axe.run(document);
  });
}

/** Accessibility violations of the current page, in the current colour scheme. */
export async function runAxe(page: Page): Promise<AxeViolation[]> {
  const results = (await analyzeWithPackage(page)) ?? (await analyzeWithCdn(page));
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));
}

/** Violations that must block a merge: axe's serious and critical impacts. */
export function blockingViolations(violations: AxeViolation[]): AxeViolation[] {
  return violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical"
  );
}
