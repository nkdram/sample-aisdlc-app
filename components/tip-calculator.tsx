"use client";

import { useState } from "react";
import { BillInput } from "@/components/tip/BillInput";
import { CopySummary } from "@/components/tip/CopySummary";
import { CurrencySelect } from "@/components/tip/CurrencySelect";
import { ErrorMessage } from "@/components/tip/ErrorMessage";
import { PeopleInput } from "@/components/tip/PeopleInput";
import { ResultList } from "@/components/tip/ResultList";
import { TipPresets } from "@/components/tip/TipPresets";
import { useCopySummary } from "@/components/tip/useCopySummary";
import { useTipCalculation } from "@/components/tip/useTipCalculation";
import type { Currency } from "@/lib/currency";

export function TipCalculator() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [bill, setBill] = useState("");
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [people, setPeople] = useState("1");
  const { result, error, summary, canCopy } = useTipCalculation(bill, tipPercent, people, currency);
  const { copied, clipboardError, handleCopy } = useCopySummary(canCopy, summary);

  return (
    <section className="card" aria-label="Tip calculator">
      <CurrencySelect currency={currency} onChange={setCurrency} />
      <BillInput bill={bill} onChange={setBill} />
      <TipPresets tipPercent={tipPercent} onSelect={setTipPercent} />
      <PeopleInput people={people} onChange={setPeople} />
      {error ? <ErrorMessage message={error} /> : null}
      <ResultList result={result} currency={currency} />
      <CopySummary copied={copied} clipboardError={clipboardError} summary={summary} canCopy={canCopy} onCopy={handleCopy} />
    </section>
  );
}
