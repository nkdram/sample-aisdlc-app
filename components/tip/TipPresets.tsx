import { TIP_PRESETS } from "@/lib/tip";

interface TipPresetsProps {
  tipPercent: number;
  onSelect: (tipPercent: number) => void;
}

/** Preset tip buttons: presentational only, the parent owns the selection. */
export function TipPresets({ tipPercent, onSelect }: TipPresetsProps) {
  return (
    <>
      <span className="label">Tip</span>
      <div className="presets" role="group" aria-label="Tip percentage">
        {TIP_PRESETS.map((p) => (
          <button key={p} type="button" aria-pressed={tipPercent === p} onClick={() => onSelect(p)}>
            {p}%
          </button>
        ))}
      </div>
    </>
  );
}
