/**
 * Dashboard — citas del día (R02).
 *
 * Responsabilidades:
 * - Permitir elegir una fecha (hoy por defecto).
 * - Pedir las citas al mock al montar y al cambiar `date`.
 * - Mostrar loading / error / lista.
 * - Cancelar (ignorar) la respuesta anterior vía cleanup del effect.
 *
 * Dependencias: React (`useState`, `useEffect`), `vetApi`, CSS Module.
 * Relación: ruta `/`. En R06 la lógica de fetch se extraerá a `useCitas`.
 *           En R08 se documentará el bug de keys por índice.
 *
 * Hook demostrado: `useEffect` (sincronización con API + cleanup anti-race).
 * Patrón: Data fetching on mount/deps change.
 * SOLID: SRP — la vista orquesta UI; el mock encapsula I/O.
 */

import { useEffect, useState, type ChangeEvent } from "react";
import { vetApi } from "../data/mockApi";
import type { AppointmentView, EstadoCita } from "../domain/models";
import styles from "./Dashboard.module.css";

/**
 * Fecha local de hoy como `YYYY-MM-DD` (valor de `<input type="date">`).
 * Se usa hora local para no cruzar el día por UTC.
 */
function todayLocalISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Convierte `YYYY-MM-DD` a ISO completo anclado al mediodía local.
 * Evita que el parseo UTC desplace el día civil.
 *
 * @param dateInput Valor del input date.
 */
function dateInputToISO(dateInput: string): string {
  const [y, m, d] = dateInput.split("-").map(Number);
  const local = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
  return local.toISOString();
}

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
 * Vista principal del día operativo: lista de citas con fetch + cleanup.
 */
export function Dashboard() {
  const [date, setDate] = useState(todayLocalISODate);
  const [citas, setCitas] = useState<AppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Effect de carga:
   * - Depende de `date` (no array vacío: si no, datos viejos al cambiar día).
   * - Cleanup marca `cancelled = true` para ignorar respuestas tardías
   *   (race entre fechas / setState after unmount).
   */
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    vetApi
      .getCitasDelDia(dateInputToISO(date))
      .then((data) => {
        // Si el effect ya se limpió (cambio de fecha o unmount), no pintamos.
        if (cancelled) return;
        setCitas(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "No se pudieron cargar las citas.";
        setError(message);
        setCitas([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  function handleDateChange(event: ChangeEvent<HTMLInputElement>) {
    setDate(event.target.value);
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>R02 · useEffect</span>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.lead}>
          Citas del día pedidas al montar y al cambiar la fecha. El cleanup del
          effect evita pintar datos de una request anterior (race).
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
          {/* Keys por id (identidad). El bug del índice se demuesta en R08. */}
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
                  {cita.owner.nombre} {cita.owner.apellido} · {cita.service.nombre} ·{" "}
                  {cita.vet.nombre}
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
