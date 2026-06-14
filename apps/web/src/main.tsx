import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initMonitoring, SentryErrorBoundary } from "./lib/monitoring";
import { initPwa } from "./lib/pwa-register";
import "./index.css";

initMonitoring();
void initPwa();

function FallbackUI() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0A0A] p-8 text-center">
      <div className="text-4xl">🛡️</div>
      <h1 className="text-xl font-bold text-white">Something went wrong</h1>
      <p className="max-w-sm text-sm text-[#A1A1AA]">
        Safar encountered an unexpected error. The issue has been reported automatically.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-xl bg-[#3B82F6] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
      >
        Reload app
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SentryErrorBoundary fallback={<FallbackUI />}>
      <App />
    </SentryErrorBoundary>
  </StrictMode>
);
