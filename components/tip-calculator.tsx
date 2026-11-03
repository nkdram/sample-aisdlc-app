"use client";

import { useEffect, useRef, useState } from "react";
import { splitBill, summaryText, TipInputError, type TipResult } from "@/lib/tip";
import { money } from "@/lib/format";
import { BillInput } from "@/components/tip/BillInput";
import { TipPresets } from "@/components/tip/TipPresets";
import { PeopleInput } from "@/components/tip/PeopleInput";
import { ErrorMessage } from "@/components/tip/ErrorMessage";
import { ResultList } from "@/components/tip/ResultList";

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
      <BillInput value={bill} onChange={setBill} />
      <TipPresets value={tipPercent} onChange={setTipPercent} />
      <PeopleInput value={people} onChange={setPeople} />
      <ErrorMessage message={error} />
      <ResultList
        tip={money.format(result?.tip ?? 0)}
        total={money.format(result?.total ?? 0)}
        perPerson={money.format(result?.perPerson ?? 0)}
      />

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
