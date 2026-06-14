/** Monitoring stub — set VITE_SENTRY_DSN and add @sentry/react to enable full error tracking */
export function initMonitoring() {
  if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.DEV) {
    console.info("[Safar] Monitoring ready — add @sentry/react + wire initMonitoring for production alerts");
  }
}

export function captureError(error: unknown, context?: Record<string, string>) {
  if (import.meta.env.DEV) {
    console.error("[Safar]", error, context);
  }
}
