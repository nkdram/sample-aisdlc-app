// Helpers evaluated inside the page. Each function is self-contained because
// Playwright serialises it and runs it in the browser, so it must not close over
// anything from this module.

export interface ContrastCheck {
  label: string;
  selector: string;
  /** Minimum WCAG ratio: 4.5 for text, 3 for non-text (focus outline). */
  min: number;
}

export interface ContrastResult {
  label: string;
  ratio: number;
  min: number;
}

/** WCAG 2.x contrast ratio of each selector's text against its effective background. */
export function measureContrast(checks: ContrastCheck[]): ContrastResult[] {
  const parse = (color: string): [number, number, number] => {
    const match = color.match(/rgba?\(([^)]+)\)/);
    if (!match || !match[1]) throw new Error(`Unsupported color: ${color}`);
    const [r = 0, g = 0, b = 0] = match[1].split(",").map((part) => Number(part.trim()));
    return [r, g, b];
  };

  const luminance = ([r, g, b]: [number, number, number]) => {
    const channel = (value: number) => {
      const scaled = value / 255;
      return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };

  const contrast = (a: [number, number, number], b: [number, number, number]) => {
    const first = luminance(a);
    const second = luminance(b);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  };

  const isTransparent = (color: string) =>
    color === "transparent" || /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(color);

  const effectiveBackground = (element: Element): string => {
    let node: Element | null = element;
    while (node) {
      const background = getComputedStyle(node).backgroundColor;
      if (background && !isTransparent(background)) return background;
      node = node.parentElement;
    }
    return "rgb(255, 255, 255)";
  };

  return checks.map((check) => {
    const element = document.querySelector(check.selector);
    if (!element) return { label: check.label, ratio: -1, min: check.min };
    return {
      label: check.label,
      ratio: contrast(parse(getComputedStyle(element).color), parse(effectiveBackground(element))),
      min: check.min,
    };
  });
}

export interface FocusOutlineResult {
  outlineStyle: string;
  outlineWidth: number;
  ratio: number;
}

/** Outline style, width and contrast of the currently focused element. */
export function measureFocusOutline(): FocusOutlineResult | null {
  const element = document.activeElement as HTMLElement | null;
  if (!element) return null;

  const parse = (color: string): [number, number, number] => {
    const match = color.match(/rgba?\(([^)]+)\)/);
    if (!match || !match[1]) throw new Error(`Unsupported color: ${color}`);
    const [r = 0, g = 0, b = 0] = match[1].split(",").map((part) => Number(part.trim()));
    return [r, g, b];
  };

  const luminance = ([r, g, b]: [number, number, number]) => {
    const channel = (value: number) => {
      const scaled = value / 255;
      return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };

  const isTransparent = (color: string) =>
    color === "transparent" || /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(color);

  // The outline is drawn outside the element, so it sits on the parent's background.
  let node: Element | null = element.parentElement;
  let background = "rgb(255, 255, 255)";
  while (node) {
    const candidate = getComputedStyle(node).backgroundColor;
    if (candidate && !isTransparent(candidate)) {
      background = candidate;
      break;
    }
    node = node.parentElement;
  }

  const style = getComputedStyle(element);
  const first = luminance(parse(style.outlineColor));
  const second = luminance(parse(background));

  return {
    outlineStyle: style.outlineStyle,
    outlineWidth: Number.parseFloat(style.outlineWidth),
    ratio: (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05),
  };
}
