"use client";

import Link from "next/link";
import { useHistory } from "@/components/tip/useHistory";
import { money } from "@/lib/format";

export default function HistoryPage() {
  const { entries, unavailable, remove, clear } = useHistory();

  function handleClear() {
    if (window.confirm("Clear all saved splits?")) clear();
  }

  return (
    <main className="page">
      <h1>History</h1>
      <p className="lead">Splits saved on this device, newest first.</p>

      {unavailable ? (
        <p role="alert" className="error">
          History is not available in this browser
        </p>
      ) : entries.length === 0 ? (
        <p className="empty">No saved splits yet</p>
      ) : (
        <>
          <ul className="history">
            {entries.map((entry, index) => (
              <li className="history-entry" data-testid="history-entry" key={`${entry.savedAt}-${index}`}>
                <p className="history-date" data-testid="history-date">
                  {new Date(entry.savedAt).toLocaleString()}
                </p>
                <dl className="result">
                  <dt>Total</dt>
                  <dd data-testid="history-total">{money.format(entry.total)}</dd>
                  <dt>People</dt>
                  <dd data-testid="history-people">{entry.people}</dd>
                  <dt>Per person</dt>
                  <dd data-testid="history-per-person">{money.format(entry.perPerson)}</dd>
                </dl>
                <div className="history-actions">
                  <Link
                    className="history-load"
                    data-testid="history-load"
                    href={`/?bill=${entry.bill}&tip=${entry.tipPercent}&people=${entry.people}`}
                  >
                    Load
                  </Link>
                  <button
                    type="button"
                    className="history-delete"
                    data-testid="history-delete"
                    onClick={() => remove(entry.savedAt)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button type="button" className="clear-history" data-testid="clear-history" onClick={handleClear}>
            Clear history
          </button>
        </>
      )}

      <Link className="history-link" href="/">
        Back to calculator
      </Link>
    </main>
  );
}
