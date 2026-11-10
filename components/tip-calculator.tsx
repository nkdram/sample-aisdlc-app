"use client";

import { useState } from "react";
import { BillInput } from "@/components/tip/BillInput";
import { CopySummary } from "@/components/tip/CopySummary";
import { ErrorMessage } from "@/components/tip/ErrorMessage";
import { PeopleInput } from "@/components/tip/PeopleInput";
import { ResultList } from "@/components/tip/ResultList";
import { SaveSplit } from "@/components/tip/SaveSplit";
import { TipPresets } from "@/components/tip/TipPresets";
import { useCopySummary } from "@/components/tip/useCopySummary";
import { useSaveSplit } from "@/components/tip/useSaveSplit";
import { useTipCalculation } from "@/components/tip/useTipCalculation";
import { useUrlPrefill } from "@/components/tip/useUrlPrefill";

export function TipCalculator() {
  const [bill, setBill] = useState("");
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [people, setPeople] = useState("1");
  const { result, error, summary, canCopy } = useTipCalculation(bill, tipPercent, people);
  const { copied, clipboardError, handleCopy } = useCopySummary(canCopy, summary);
  const { canSave, unavailable, save } = useSaveSplit(bill, tipPercent, people, result);
  useUrlPrefill({ setBill, setTipPercent, setPeople });

  return (
    <section className="card" aria-label="Tip calculator">
      <BillInput bill={bill} onChange={setBill} />
      <TipPresets tipPercent={tipPercent} onSelect={setTipPercent} />
      <PeopleInput people={people} onChange={setPeople} />
      {error ? <ErrorMessage message={error} /> : null}
      <ResultList result={result} />
      <CopySummary copied={copied} clipboardError={clipboardError} summary={summary} canCopy={canCopy} onCopy={handleCopy} />
      <SaveSplit canSave={canSave} unavailable={unavailable} onSave={save} />
    </section>
  );
}
