import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SafarSplash } from "./components/layout/SafarSplash";
import { initMonitoring, SentryErrorBoundary } from "./lib/monitoring";
import { initPwa } from "./lib/pwa-register";
import "./index.css";

initMonitoring();
void initPwa();

function FallbackUI() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0A0A] p-8 text-center">
      <img src="/safar-logo.png" alt="Safar" className="h-16 w-16 object-contain" />
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

function Root() {
  const [booting, setBooting] = useState(true);

  return (
    <>
      <App />
      {booting && (
        <SafarSplash mode="fullscreen" duration={2600} onFinish={() => setBooting(false)} />
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SentryErrorBoundary fallback={<FallbackUI />}>
      <Root />
    </SentryErrorBoundary>
  </StrictMode>
);
