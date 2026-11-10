/** The currencies the app can display. The calculation is currency-agnostic: only parsing and formatting differ. */
export type Currency = "USD" | "EUR" | "GBP";

/** The currencies offered in the picker, in display order. USD is the default. */
export const CURRENCIES: readonly Currency[] = ["USD", "EUR", "GBP"];

/** Currency -> locale for Intl.NumberFormat. */
const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

const formatters = new Map<Currency, Intl.NumberFormat>();

/** The one money formatter: amounts are shown in the selected currency's locale. */
export function formatMoney(currency: Currency): Intl.NumberFormat {
  const cached = formatters.get(currency);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat(CURRENCY_LOCALES[currency], { style: "currency", currency });
  formatters.set(currency, formatter);
  return formatter;
}

/**
 * Reads a bill amount typed by the user. EUR accepts a comma as the decimal
 * separator; anything else is left to Number, which yields NaN for garbage.
 */
export function parseBillAmount(input: string, currency: Currency): number {
  const normalized = currency === "EUR" ? input.replace(",", ".") : input;
  return Number(normalized);
}
