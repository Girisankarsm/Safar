/** Register service worker in production; dev uses vite-plugin-pwa devOptions when enabled */
export async function initPwa() {
  if (!import.meta.env.PROD) return;
  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[Safar] PWA registration skipped:", e);
  }
}
