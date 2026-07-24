/**
 * ThemeContext — tema claro/oscuro (R05 / R18).
 *
 * Responsabilidades:
 * - Guardar el tema elegido por el staff.
 * - Aplicar `data-theme` en `<html>` para que los tokens CSS reaccionen.
 * - Exponer `useTheme()` con API tipada y error si falta el Provider.
 *
 * Dependencias: React Context.
 * Relación: provisto en `App.tsx`; toggle en la topbar. Los CSS Modules
 * no se tocan: solo cambian las custom properties de `tokens.css`.
 *
 * Gotcha: memorizar `value` (objeto + callbacks) evita re-renders en cascada.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  /** Alterna entre claro y oscuro. */
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "vetlab-theme";

/**
 * Lee el tema inicial: localStorage → preferencia del SO → light.
 */
function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider de tema. Sincroniza `document.documentElement.dataset.theme`.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Lee el tema actual y sus acciones.
 *
 * @throws Si se usa fuera de `ThemeProvider`.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme debe usarse dentro de <ThemeProvider>.");
  }
  return ctx;
}
