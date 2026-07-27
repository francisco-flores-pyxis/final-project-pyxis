/**
 * Modal — renderizado vía createPortal en #modal-root (R09).
 *
 * Responsabilidades:
 * - Desacoplar el DOM del modal del contenedor de la vista (overflow/z-index).
 * - Overlay a pantalla completa con `--z-modal`.
 * - Cerrar con Escape, click en backdrop y botón.
 * - Trap de foco básico + restauración al cerrar.
 *
 * Dependencias: react-dom createPortal, CSS Module.
 * Relación: usado por Dashboard (detalle de cita) y futuros flujos.
 *
 * Capacidad: createPortal. El árbol de React (context) se conserva.
 */

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Dialog modal montado en `#modal-root`.
 */
export function Modal({ open, title, onClose, children }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusables?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const nodes = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const portalRoot = document.getElementById("modal-root");
  if (!portalRoot) {
    throw new Error('No se encontró #modal-root en el DOM (requerido por R09).');
  }

  function handleDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    // Escape también se escucha a nivel document; esto cubre foco dentro del dialog.
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    portalRoot,
  );
}
