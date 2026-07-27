/**
 * Fila de cita con estado local (R08) + apertura de detalle (R09).
 *
 * Responsabilidades:
 * - Mostrar datos de la cita.
 * - Nota local para demo de keys (R08).
 * - Botón para abrir modal de detalle (R09).
 */

import { useState, type ChangeEvent } from "react";
import type { AppointmentView, EstadoCita } from "../../domain/models";
import styles from "../../views/Dashboard.module.css";

export interface CitaRowProps {
  cita: AppointmentView;
  formatTime: (iso: string) => string;
  estadoClass: (estado: EstadoCita) => string;
  onOpenDetail: (cita: AppointmentView) => void;
}

/**
 * Item de lista con input propio y acción de detalle.
 */
export function CitaRow({
  cita,
  formatTime,
  estadoClass,
  onOpenDetail,
}: CitaRowProps) {
  const [notaLocal, setNotaLocal] = useState("");

  function handleNotaChange(event: ChangeEvent<HTMLInputElement>) {
    setNotaLocal(event.target.value);
  }

  return (
    <li className={styles.item}>
      <time className={styles.time} dateTime={cita.fechaHora}>
        {formatTime(cita.fechaHora)}
      </time>
      <div className={styles.body}>
        <p className={styles.petName}>
          {cita.pet.nombre}{" "}
          <span className={styles.meta}>({cita.pet.especie})</span>
        </p>
        <p className={styles.meta}>
          {cita.owner.nombre} {cita.owner.apellido} · {cita.service.nombre} ·{" "}
          {cita.vet.nombre}
        </p>
        {cita.motivo && <p className={styles.meta}>{cita.motivo}</p>}
        <label className={styles.notaLabel} htmlFor={`nota-${cita.id}`}>
          Nota local (estado de la fila)
        </label>
        <input
          id={`nota-${cita.id}`}
          className={styles.notaInput}
          type="text"
          value={notaLocal}
          onChange={handleNotaChange}
          placeholder="Escribí acá y después reordená/filtrá…"
          autoComplete="off"
        />
        <button
          type="button"
          className={styles.detailBtn}
          onClick={() => onOpenDetail(cita)}
        >
          Ver detalle
        </button>
      </div>
      <span className={estadoClass(cita.estado)}>{cita.estado}</span>
    </li>
  );
}
