import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CurrencySelect } from "./CurrencySelect";
import type { Currency } from "@/lib/currency";

function render(currency: Currency): string {
  return renderToStaticMarkup(createElement(CurrencySelect, { currency, onChange: () => {} }));
}

describe("CurrencySelect", () => {
  it("A currency select with USD (default), EUR and GBP", () => {
    const markup = render("USD");

    expect(markup).toContain('<label for="currency">Currency</label>');
    expect(markup).toContain('data-testid="currency"');
    expect(markup).toContain('<option value="USD" selected="">USD</option>');
    expect(markup).toContain('<option value="EUR">EUR</option>');
    expect(markup).toContain('<option value="GBP">GBP</option>');
  });

  it("shows the selected currency as the current option", () => {
    expect(render("EUR")).toContain('<option value="EUR" selected="">EUR</option>');
    expect(render("GBP")).toContain('<option value="GBP" selected="">GBP</option>');
  });
});
