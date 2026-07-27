/**
 * Botón submit que lee `pending` del form padre (R16).
 *
 * Responsabilidades:
 * - Obtener el estado de envío con `useFormStatus` (sin prop drilling).
 * - Deshabilitarse y mostrar spinner mientras la action corre.
 *
 * Dependencias: react-dom useFormStatus.
 * Relación: hijo de un `<form action={...}>` (p. ej. NuevaCita).
 *
 * Gotcha: debe vivir *dentro* del form; en el mismo componente que
 * renderiza el `<form>` el hook no ve el pending.
 */

import { useFormStatus } from "react-dom";
import styles from "./SubmitButton.module.css";

export interface SubmitButtonProps {
  /** Texto cuando no hay envío en curso. */
  children: string;
  /** Texto opcional mientras pending (default: "Enviando…"). */
  pendingLabel?: string;
  className?: string;
}

/**
 * Submit reutilizable para forms con action (React 19).
 */
export function SubmitButton({
  children,
  pendingLabel = "Enviando…",
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className ? `${styles.button} ${className}` : styles.button}
      disabled={pending}
      aria-busy={pending}
    >
      {pending && <span className={styles.spinner} aria-hidden="true" />}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
