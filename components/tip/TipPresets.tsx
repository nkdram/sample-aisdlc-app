"use client";

import { TIP_PRESETS } from "@/lib/tip";

interface TipPresetsProps {
  value: number;
  onChange: (percent: number) => void;
}

export function TipPresets({ value, onChange }: TipPresetsProps) {
  return (
    <>
      <span className="label">Tip</span>
      <div className="presets" role="group" aria-label="Tip percentage">
        {TIP_PRESETS.map((p) => (
          <button key={p} type="button" aria-pressed={value === p} onClick={() => onChange(p)}>
            {p}%
          </button>
        ))}
      </div>
    </>
  );
}
