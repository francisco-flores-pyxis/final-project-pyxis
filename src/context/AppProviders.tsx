/**
 * Composición de providers globales (R05).
 *
 * Responsabilidades:
 * - Montar Session + Theme en el orden correcto alrededor de la app.
 *
 * Relación: usado por `App.tsx`. Mantener providers acá evita ensuciar el entry.
 */

import type { ReactNode } from "react";
import { SessionProvider } from "./SessionContext";
import { ThemeProvider } from "./ThemeContext";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Árbol de providers de la consola.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
