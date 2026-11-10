"use client";

import { useEffect, useState } from "react";
import { isCrashRequested } from "@/lib/crash-trigger";

/** Crashes once per page load when `?crash=1` is allowed, so e2e can test the error boundary. */
let crashedOnce = false;

export function CrashTrigger() {
  const [crash, setCrash] = useState(false);

  useEffect(() => {
    if (crashedOnce) return;
    const allowInProduction = process.env.NEXT_PUBLIC_ALLOW_CRASH_TRIGGER === "1";
    if (isCrashRequested(window.location.search, process.env.NODE_ENV, allowInProduction)) {
      crashedOnce = true;
      setCrash(true);
    }
  }, []);

  if (crash) throw new Error("Test crash triggered by ?crash=1");
  return null;
}
