interface CopySummaryProps {
  copied: boolean;
  clipboardError: boolean;
  summary: string;
  canCopy: boolean;
  onCopy: () => void;
}

/** Copy button plus the read-only fallback shown when the clipboard is unavailable. */
export function CopySummary({ copied, clipboardError, summary, canCopy, onCopy }: CopySummaryProps) {
  return (
    <>
      <button
        type="button"
        className="copy-summary"
        onClick={onCopy}
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
    </>
  );
}
