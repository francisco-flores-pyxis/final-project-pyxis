/**
 * Configuración de Vite para VetLab.
 *
 * Responsabilidades:
 * - Registrar el plugin de React.
 * - Resolver el alias `@` → `src/`.
 *
 * Relación: punto de entrada del tooling; no contiene lógica de dominio.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
