/** Shared money formatter. Change the currency here only (see the currency ticket). */
export const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
