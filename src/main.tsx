/**
 * Entry point de la SPA VetLab.
 *
 * Responsabilidades:
 * - Montar React en `#root` bajo StrictMode (R17).
 * - Cargar design tokens globales.
 *
 * Relación: referenciado desde `index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('No se encontró el elemento #root en el DOM.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
