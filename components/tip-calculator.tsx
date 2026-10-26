"use client";

import { useState } from "react";
import { splitBill, TIP_PRESETS, TipInputError, type TipResult } from "@/lib/tip";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function TipCalculator() {
  const [bill, setBill] = useState("");
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [people, setPeople] = useState("1");

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
    </section>
  );
}
