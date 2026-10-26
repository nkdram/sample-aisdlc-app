"use client";

import { useEffect, useRef, useState } from "react";
import { splitBill, summaryText, TIP_PRESETS, TipInputError, type TipResult } from "@/lib/tip";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function TipCalculator() {
  const [bill, setBill] = useState("");
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [people, setPeople] = useState("1");
  const [copied, setCopied] = useState(false);
  const [clipboardError, setClipboardError] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  let result: TipResult | null = null;
  let error: string | null = null;
  if (bill !== "") {
    try {
      result = splitBill({ bill: Number(bill), tipPercent, people: Number(people) });
    } catch (e) {
      if (!(e instanceof TipInputError)) throw e;
      error = e.message;
    }
  }

  const canCopy = result !== null && !error;
  const summary =
    canCopy && result !== null
      ? summaryText(result, { bill: Number(bill), tipPercent, people: Number(people) }, money.format)
      : "";

  async function handleCopy() {
    if (!canCopy || summary === "") return;
    setClipboardError(false);
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setClipboardError(true);
    }
  }

  return (
    <section className="card" aria-label="Tip calculator">
      <label htmlFor="bill">Bill</label>
      <input id="bill" inputMode="decimal" value={bill} onChange={(e) => setBill(e.target.value)} placeholder="0.00" />

      <span className="label">Tip</span>
      <div className="presets" role="group" aria-label="Tip percentage">
        {TIP_PRESETS.map((p) => (
          <button key={p} type="button" aria-pressed={tipPercent === p} onClick={() => setTipPercent(p)}>
            {p}%
          </button>
        ))}
      </div>

      <label htmlFor="people">People</label>
      <input id="people" inputMode="numeric" value={people} onChange={(e) => setPeople(e.target.value)} />

      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : null}

      <dl className="result" aria-live="polite">
        <dt>Tip</dt>
        <dd data-testid="tip">{money.format(result?.tip ?? 0)}</dd>
        <dt>Total</dt>
        <dd data-testid="total">{money.format(result?.total ?? 0)}</dd>
        <dt>Per person</dt>
        <dd data-testid="per-person">{money.format(result?.perPerson ?? 0)}</dd>
      </dl>

      <button
        type="button"
        className="copy-summary"
        onClick={handleCopy}
        disabled={!canCopy}
        aria-live="polite"
        data-testid="copy-summary"
      >
        {copied ? "Copied" : "Copy summary"}
      </button>

      {clipboardError ? (
        <div className="copy-fallback">
          <label htmlFor="copy-fallback">Clipboard unavailable. Copy this summary by hand:</label>
          <textarea id="copy-fallback" readOnly value={summary} rows={3} />
        </div>
      ) : null}
    </section>
  );
}
