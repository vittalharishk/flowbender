"use client";

import { useEffect } from "react";

/**
 * Catches webpack ChunkLoadError events (stale JS chunks after a new deployment)
 * and forces a hard reload so the browser fetches fresh HTML with the correct
 * chunk hashes. Without this, users who navigate after a deploy see a blank
 * "Application error" screen.
 */
export function ChunkErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const isChunkError =
        event.message?.includes("ChunkLoadError") ||
        event.message?.includes("Loading chunk") ||
        event.message?.includes("Failed to fetch dynamically imported module") ||
        (event.error instanceof Error && event.error.name === "ChunkLoadError");

      if (isChunkError) {
        event.preventDefault();
        // Hard reload bypasses browser cache and fetches fresh HTML
        window.location.reload();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason?.message ?? String(reason ?? "");
      const isChunkError =
        reason?.name === "ChunkLoadError" ||
        message.includes("ChunkLoadError") ||
        message.includes("Loading chunk") ||
        message.includes("Failed to fetch dynamically imported module");

      if (isChunkError) {
        event.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
