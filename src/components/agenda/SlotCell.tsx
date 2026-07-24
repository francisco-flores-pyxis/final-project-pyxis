/**
 * Celda de slot de la agenda (R07).
 *
 * Responsabilidades:
 * - Renderizar un slot clickeable (libre/ocupado/seleccionado).
 * - Evitar re-renders cuando las props no cambian (`memo`).
 *
 * Dependencias: React `memo`, CSS Module.
 * Relación: grilla de `views/Agenda`. El padre debe pasar callbacks estables
 * (`useCallback`) para que `memo` tenga efecto.
 *
 * Cuándo usarlo: listas densas de celdas casi idénticas.
 */

import { memo, useRef } from "react";
import styles from "./SlotCell.module.css";

export interface SlotCellProps {
  inicio: string;
  label: string;
  disponible: boolean;
  selected: boolean;
  /** Handler estable desde el padre (useCallback). */
  onSelect: (inicio: string) => void;
}

/**
 * Celda memorizada. Si `onSelect` / props primitivas no cambian, React salta el render.
 */
function SlotCellComponent({
  inicio,
  label,
  disponible,
  selected,
  onSelect,
}: SlotCellProps) {
  /** Contador local solo para demo de Profiler / inspección. */
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  const className = [
    styles.slot,
    disponible ? styles.slotLibre : styles.slotOcupado,
    selected ? styles.slotSelected : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      disabled={!disponible}
      aria-pressed={selected}
      title={`Renders de esta celda: ${renderCountRef.current}`}
      onClick={() => onSelect(inicio)}
    >
      <span className={styles.time}>{label}</span>
      <span className={styles.hint}>
        {disponible ? (selected ? "sel." : "libre") : "ocup."}
      </span>
    </button>
  );
}

export const SlotCell = memo(SlotCellComponent);
SlotCell.displayName = "SlotCell";
