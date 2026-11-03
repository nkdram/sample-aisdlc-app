"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import { BillInput } from "@/components/tip/BillInput";
import { TipPresets } from "@/components/tip/TipPresets";
import { PeopleInput } from "@/components/tip/PeopleInput";
import { ErrorMessage } from "@/components/tip/ErrorMessage";
import { ResultList } from "@/components/tip/ResultList";
import { CopySummary } from "@/components/tip/CopySummary";
import { useTipCalculation } from "@/components/tip/useTipCalculation";
import { useCopySummary } from "@/components/tip/useCopySummary";

export function TipCalculator() {
  const [bill, setBill] = useState("");
  const [tipPercent, setTipPercent] = useState(15);
  const [people, setPeople] = useState("1");
  const { result, error, summary, canCopy } = useTipCalculation({ bill, tipPercent, people }, money.format);
  const copy = useCopySummary(summary, canCopy);

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
      <CopySummary
        enabled={canCopy}
        copied={copy.copied}
        clipboardError={copy.clipboardError}
        summary={summary}
        onCopy={copy.handleCopy}
      />
    </section>
  );
}
