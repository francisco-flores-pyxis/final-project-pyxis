/**
 * Fila de cita con estado local (R08).
 *
 * Responsabilidades:
 * - Mostrar datos de la cita.
 * - Mantener una nota local en `useState` para evidenciar la reconciliación:
 *   si la key es el índice, al reordenar la nota "salta" de cita.
 *
 * Dependencias: CSS Module del Dashboard (estilos de fila).
 * Relación: renderizada por `Dashboard` con `key={cita.id}` (producción).
 */

import { useState, type ChangeEvent } from "react";
import type { AppointmentView, EstadoCita } from "../../domain/models";
import styles from "../../views/Dashboard.module.css";

export interface CitaRowProps {
  cita: AppointmentView;
  formatTime: (iso: string) => string;
  estadoClass: (estado: EstadoCita) => string;
}

/**
 * Item de lista con input propio — el estado vive en la instancia del componente.
 */
export function CitaRow({ cita, formatTime, estadoClass }: CitaRowProps) {
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
      </div>
      <span className={estadoClass(cita.estado)}>{cita.estado}</span>
    </li>
  );
}
