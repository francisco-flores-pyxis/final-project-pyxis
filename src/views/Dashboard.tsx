/**
 * Dashboard — citas del día (R02 + R06).
 *
 * Responsabilidades:
 * - Permitir elegir una fecha (hoy por defecto).
 * - Mostrar loading / error / lista vía `useCitas` (R06).
 *
 * Dependencias: `useCitas`, CSS Module.
 * Relación: ruta `/`. R08 documentará keys; R15 acciones de estado.
 *
 * Hooks: `useCitas` (custom) encapsula el useEffect + cleanup de R02.
 */

import { useState, type ChangeEvent } from "react";
import type { EstadoCita } from "../domain/models";
import { useCitas } from "../hooks/useCitas";
import { todayLocalISODate } from "../utils/date";
import styles from "./Dashboard.module.css";

/**
 * Formatea la hora de una cita en locale es-UY.
 *
 * @param iso Fecha/hora ISO de la cita.
 */
function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  }).format(new Date(iso));
}

/**
 * Clase CSS según estado de la cita.
 */
function estadoClass(estado: EstadoCita): string {
  const map: Record<EstadoCita, string> = {
    pendiente: styles.estadoPendiente,
    confirmada: styles.estadoConfirmada,
    completada: styles.estadoCompletada,
    cancelada: styles.estadoCancelada,
  };
  return `${styles.estado} ${map[estado]}`;
}

/**
 * Vista principal del día operativo.
 */
export function Dashboard() {
  const [date, setDate] = useState(todayLocalISODate);
  const { data: citas, loading, error, refetch } = useCitas(date);

  function handleDateChange(event: ChangeEvent<HTMLInputElement>) {
    setDate(event.target.value);
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>R02 · useEffect · R06 · useCitas</span>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.lead}>
          La carga de citas vive en <code>useCitas</code> (cleanup anti-race
          incluido). El Dashboard solo orquesta UI.
        </p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.dateField}>
          <label className={styles.label} htmlFor="dashboard-date">
            Fecha
          </label>
          <input
            id="dashboard-date"
            type="date"
            className={styles.dateInput}
            value={date}
            onChange={handleDateChange}
          />
        </div>
        <button
          type="button"
          className={styles.todayBtn}
          onClick={() => setDate(todayLocalISODate())}
        >
          Hoy
        </button>
        <button
          type="button"
          className={styles.todayBtn}
          onClick={refetch}
          disabled={loading}
        >
          Refetch
        </button>
      </div>

      {loading && (
        <p className={styles.status} role="status" aria-live="polite">
          Cargando citas…
        </p>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {!loading && !error && citas.length === 0 && (
        <p className={styles.empty}>No hay citas para este día.</p>
      )}

      {!loading && !error && citas.length > 0 && (
        <ul className={styles.list}>
          {citas.map((cita) => (
            <li key={cita.id} className={styles.item}>
              <time className={styles.time} dateTime={cita.fechaHora}>
                {formatTime(cita.fechaHora)}
              </time>
              <div className={styles.body}>
                <p className={styles.petName}>
                  {cita.pet.nombre}{" "}
                  <span className={styles.meta}>({cita.pet.especie})</span>
                </p>
                <p className={styles.meta}>
                  {cita.owner.nombre} {cita.owner.apellido} · {cita.service.nombre}{" "}
                  · {cita.vet.nombre}
                </p>
                {cita.motivo && <p className={styles.meta}>{cita.motivo}</p>}
              </div>
              <span className={estadoClass(cita.estado)}>{cita.estado}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
