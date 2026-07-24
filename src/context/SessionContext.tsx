/**
 * SessionContext — staff logueado stubbeado (R05).
 *
 * Responsabilidades:
 * - Proveer la identidad del staff a toda la consola sin prop drilling.
 * - Exponer `useSession()` que falla si falta el Provider.
 *
 * Dependencias: React Context.
 * Relación: provisto en `App.tsx`; consumido en la topbar (`AppLayout`).
 *
 * Gotcha: el `value` del Provider se memoriza para no invalidar consumidores
 * en cada render del padre.
 */

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

/** Staff operativo stub (no hay auth real en el lab). */
export interface Staff {
  id: string;
  nombre: string;
  rol: "recepcion" | "veterinario" | "admin";
}

export interface SessionContextValue {
  staff: Staff;
}

const STUB_STAFF: Staff = {
  id: "staff-1",
  nombre: "María González",
  rol: "recepcion",
};

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
  /** Permite override en tests; por defecto el stub de recepción. */
  staff?: Staff;
}

/**
 * Provider de sesión. El value es estable mientras no cambie `staff`.
 */
export function SessionProvider({
  children,
  staff = STUB_STAFF,
}: SessionProviderProps) {
  const value = useMemo<SessionContextValue>(() => ({ staff }), [staff]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/**
 * Lee la sesión actual.
 *
 * @throws Si se usa fuera de `SessionProvider`.
 */
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>.");
  }
  return ctx;
}
