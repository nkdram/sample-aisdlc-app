import { CURRENCIES, type Currency } from "@/lib/currency";

interface CurrencySelectProps {
  currency: Currency;
  onChange: (currency: Currency) => void;
}

/** Currency picker: presentational only, the parent owns the selection. */
export function CurrencySelect({ currency, onChange }: CurrencySelectProps) {
  return (
    <>
      <label htmlFor="currency">Currency</label>
      <select
        id="currency"
        data-testid="currency"
        value={currency}
        onChange={(e) => onChange(e.target.value as Currency)}
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </>
  );
}
