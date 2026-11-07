"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";
import "./globals.css";

/** Covers errors thrown in the root layout, where app/error.tsx cannot render. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void reportError(error, { scope: "app/global-error" });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="page">
          <h1>Something went wrong</h1>
          <p className="lead">The page hit an unexpected problem. Nothing you entered was sent anywhere.</p>
          <button type="button" className="primary-button" onClick={() => reset()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
