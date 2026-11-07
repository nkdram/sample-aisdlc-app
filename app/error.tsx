"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void reportError(error, { scope: "app/error" });
  }, [error]);

  return (
    <main className="page">
      <h1>Something went wrong</h1>
      <p className="lead">The page hit an unexpected problem. Nothing you entered was sent anywhere.</p>
      <button type="button" className="primary-button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
