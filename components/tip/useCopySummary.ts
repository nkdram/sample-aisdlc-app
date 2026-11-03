import { useEffect, useRef, useState } from "react";

const COPIED_FEEDBACK_MS = 2000;

export interface CopySummaryState {
  readonly copied: boolean;
  readonly clipboardError: boolean;
  readonly handleCopy: () => Promise<void>;
}

export function useCopySummary(summary: string, canCopy: boolean): CopySummaryState {
  const [copied, setCopied] = useState(false);
  const [clipboardError, setClipboardError] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    if (!canCopy || summary === "") return;
    setClipboardError(false);
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      setClipboardError(true);
    }
  }

  return { copied, clipboardError, handleCopy };
}
