/** The single money formatter for the app: the currency ticket changes it here and nowhere else. */
export const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
