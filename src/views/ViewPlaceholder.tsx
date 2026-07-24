/**
 * Helpers de vistas placeholder del andamiaje.
 *
 * Responsabilidades:
 * - Mostrar título + lead + badge del requerimiento asociado.
 * - Evitar duplicar markup mientras las features reales no existen.
 *
 * Relación: usado por las views stub; se reemplaza al implementar cada Rx.
 */

import type { ReactNode } from "react";
import styles from "./ViewPlaceholder.module.css";

interface PlaceholderProps {
  title: string;
  lead: string;
  requirement: string;
  children?: ReactNode;
}

/**
 * Bloque informativo para una ruta aún no implementada.
 */
export function ViewPlaceholder({
  title,
  lead,
  requirement,
  children,
}: PlaceholderProps) {
  return (
    <section className={styles.page}>
      <span className={styles.badge}>{requirement}</span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lead}>{lead}</p>
      {children}
    </section>
  );
}
