"use client";

import { useEffect } from "react";

interface PrefillSetters {
  setBill: (value: string) => void;
  setTipPercent: (value: number) => void;
  setPeople: (value: string) => void;
}

/** Reads ?bill=&tip=&people= once after mount so a history entry can open the calculator prefilled. */
export function useUrlPrefill({ setBill, setTipPercent, setPeople }: PrefillSetters): void {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bill = params.get("bill");
    const tip = params.get("tip");
    const people = params.get("people");

    if (bill !== null) setBill(bill);
    if (tip !== null && Number.isFinite(Number(tip))) setTipPercent(Number(tip));
    if (people !== null) setPeople(people);
  }, [setBill, setTipPercent, setPeople]);
}
