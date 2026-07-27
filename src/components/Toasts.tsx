/**
 * Sistema de toasts vía createPortal en #toast-root (R09).
 *
 * Responsabilidades:
 * - Apilar notificaciones flotantes sobre toda la UI (`--z-toast`).
 * - Exponer `useToasts().push(...)` desde cualquier hijo del provider.
 * - Auto-dismiss con cleanup de timers.
 *
 * Dependencias: React Context, createPortal, CSS Module.
 * Relación: montado en AppProviders; consumido p.ej. desde Dashboard.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Toasts.module.css";

export type ToastTone = "info" | "success" | "danger";

export interface ToastInput {
  message: string;
  tone?: ToastTone;
  /** ms; default 3200 */
  durationMs?: number;
}

interface ToastItem extends Required<Pick<ToastInput, "message" | "tone">> {
  id: string;
  durationMs: number;
}

interface ToastContextValue {
  push: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Provider + host de toasts (portal a `#toast-root`).
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = crypto.randomUUID();
      const item: ToastItem = {
        id,
        message: toast.message,
        tone: toast.tone ?? "info",
        durationMs: toast.durationMs ?? 3200,
      };
      setToasts((prev) => [...prev, item]);
      window.setTimeout(() => dismiss(id), item.durationMs);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push }), [push]);

  const portalRoot =
    typeof document !== "undefined"
      ? document.getElementById("toast-root")
      : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {portalRoot &&
        createPortal(
          <div className={styles.stack} aria-live="polite" aria-relevant="additions">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`${styles.toast} ${styles[toast.tone]}`}
                role="status"
              >
                <span>{toast.message}</span>
                <button
                  type="button"
                  className={styles.dismiss}
                  onClick={() => dismiss(toast.id)}
                  aria-label="Cerrar notificación"
                >
                  ×
                </button>
              </div>
            ))}
          </div>,
          portalRoot,
        )}
    </ToastContext.Provider>
  );
}

/**
 * Acceso al API de toasts.
 *
 * @throws Si falta `ToastProvider`.
 */
export function useToasts(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToasts debe usarse dentro de <ToastProvider>.");
  }
  return ctx;
}
