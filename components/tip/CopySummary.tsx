"use client";

interface CopySummaryProps {
  enabled: boolean;
  copied: boolean;
  clipboardError: boolean;
  summary: string;
  onCopy: () => void;
}

export function CopySummary({ enabled, copied, clipboardError, summary, onCopy }: CopySummaryProps) {
  return (
    <>
      <button
        type="button"
        className="copy-summary"
        onClick={onCopy}
        disabled={!enabled}
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
    </>
  );
}
