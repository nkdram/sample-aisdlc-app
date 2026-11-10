interface SaveSplitProps {
  canSave: boolean;
  unavailable: boolean;
  onSave: () => void;
}

/** Save button plus the link to the history page; the parent owns the calculation. */
export function SaveSplit({ canSave, unavailable, onSave }: SaveSplitProps) {
  return (
    <>
      <button
        type="button"
        className="save-split"
        data-testid="save-split"
        onClick={onSave}
        disabled={!canSave}
      >
        Save split
      </button>

      {unavailable ? (
        <p role="alert" className="error">
          History is not available in this browser
        </p>
      ) : null}

      <a className="history-link" href="/history">
        History
      </a>
    </>
  );
}
