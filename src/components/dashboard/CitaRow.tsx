/**
 * Fila de cita con estado local (R08) + detalle (R09) + acciones optimistas (R15).
 *
 * Responsabilidades:
 * - Mostrar datos de la cita.
 * - Nota local para demo de keys (R08).
 * - Botón de detalle (R09).
 * - Forms de confirmar / completar / cancelar (R15).
 */

import { useState, type ChangeEvent } from "react";
import type { AppointmentView, EstadoCita } from "../../domain/models";
import styles from "../../views/Dashboard.module.css";

export interface CitaRowProps {
  cita: AppointmentView;
  formatTime: (iso: string) => string;
  estadoClass: (estado: EstadoCita) => string;
  onOpenDetail: (cita: AppointmentView) => void;
  /** Action de form (R15) — el padre aplica useOptimistic antes de await. */
  onCambiarEstado: (formData: FormData) => void | Promise<void>;
  pending?: boolean;
}

function nextActions(estado: EstadoCita): EstadoCita[] {
  switch (estado) {
    case "pendiente":
      return ["confirmada", "cancelada"];
    case "confirmada":
      return ["completada", "cancelada"];
    default:
      return [];
  }
}

function labelFor(estado: EstadoCita): string {
  const map: Record<EstadoCita, string> = {
    pendiente: "Pendiente",
    confirmada: "Confirmar",
    completada: "Completar",
    cancelada: "Cancelar",
  };
  return map[estado];
}

/**
 * Item de lista con input propio y acciones de estado.
 */
export function CitaRow({
  cita,
  formatTime,
  estadoClass,
  onOpenDetail,
  onCambiarEstado,
  pending = false,
}: CitaRowProps) {
  const [notaLocal, setNotaLocal] = useState("");
  const actions = nextActions(cita.estado);

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
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.detailBtn}
            onClick={() => onOpenDetail(cita)}
          >
            Ver detalle
          </button>
          {actions.map((estado) => (
            <form
              key={estado}
              action={onCambiarEstado}
              className={styles.estadoForm}
            >
              <input type="hidden" name="id" value={cita.id} />
              <input type="hidden" name="estado" value={estado} />
              <button
                type="submit"
                className={
                  estado === "cancelada"
                    ? styles.actionDanger
                    : styles.actionPrimary
                }
                disabled={pending}
              >
                {labelFor(estado)}
              </button>
            </form>
          ))}
        </div>
      </div>
      <span className={estadoClass(cita.estado)}>{cita.estado}</span>
    </li>
  );
}
