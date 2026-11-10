"use client";

import { useEffect, useRef, useState } from "react";

/** How long the button keeps saying "Copied" after a successful copy. */
const COPIED_RESET_MS = 2000;

export interface CopySummaryState {
  copied: boolean;
  clipboardError: boolean;
  handleCopy: () => Promise<void>;
}

/** Clipboard write plus the "Copied" timer and the fallback flag. */
export function useCopySummary(canCopy: boolean, summary: string): CopySummaryState {
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
      timeoutRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      setClipboardError(true);
    }
  }

  return { copied, clipboardError, handleCopy };
}
