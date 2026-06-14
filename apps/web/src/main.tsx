import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initMonitoring } from "./lib/monitoring";
import { initPwa } from "./lib/pwa-register";
import "./index.css";

initMonitoring();
void initPwa();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
