/**
 * Composición de providers globales (R05 + R09).
 *
 * Responsabilidades:
 * - Montar Session, Theme y Toasts alrededor de la app.
 *
 * Relación: usado por `App.tsx`.
 */

import type { ReactNode } from "react";
import { ToastProvider } from "../components/Toasts";
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
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
