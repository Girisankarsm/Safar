import * as Sentry from "@sentry/react";

let initialised = false;

export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || initialised) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION ?? "0.0.0",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (import.meta.env.DEV) return null;
      return event;
    },
  });

  initialised = true;
}

export function captureError(error: unknown, context?: Record<string, string>) {
  if (import.meta.env.DEV) {
    console.error("[Safar]", error, context);
    return;
  }
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}

export function captureMessage(msg: string, level: Sentry.SeverityLevel = "info") {
  if (import.meta.env.DEV) {
    console.info(`[Safar] ${msg}`);
    return;
  }
  Sentry.captureMessage(msg, level);
}

export const SentryErrorBoundary = Sentry.ErrorBoundary;
