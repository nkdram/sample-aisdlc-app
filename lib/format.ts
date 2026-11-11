import { formatMoney } from "./currency";

/** The single money formatter for the app: the currency ticket changes it here and nowhere else. */
export const money = formatMoney("USD");

/** Re-exported so every caller (results, summary, later tickets) uses one formatter seam. */
export { formatMoney };
