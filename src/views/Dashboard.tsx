/**
 * Dashboard — citas del día (R02 + R06 + R08).
 *
 * Responsabilidades:
 * - Cargar citas con `useCitas`.
 * - Filtrar / ordenar la lista.
 * - Usar keys estables por `id` (R08) y demo reproducible del bug `key={index}`.
 *
 * Dependencias: useCitas, CitaRow, CSS Module.
 * Relación: ruta `/`.
 *
 * Capacidad R08: keys y reconciliación.
 */

import { useMemo, useState, type ChangeEvent } from "react";
import { CitaRow } from "../components/dashboard/CitaRow";
import type { AppointmentView, EstadoCita } from "../domain/models";
import { useCitas } from "../hooks/useCitas";
import { todayLocalISODate } from "../utils/date";
import styles from "./Dashboard.module.css";

type EstadoFiltro = "todas" | EstadoCita;
type Orden = "hora-asc" | "hora-desc" | "vet";

/**
 * Formatea la hora de una cita en locale es-UY.
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
 * Filtra y ordena citas para la lista del dashboard.
 */
function applyListTransforms(
  citas: AppointmentView[],
  estado: EstadoFiltro,
  orden: Orden,
): AppointmentView[] {
  let list =
    estado === "todas" ? [...citas] : citas.filter((c) => c.estado === estado);

  list.sort((a, b) => {
    if (orden === "vet") {
      return a.vet.nombre.localeCompare(b.vet.nombre, "es");
    }
    const diff =
      new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime();
    return orden === "hora-desc" ? -diff : diff;
  });

  return list;
}

/**
 * Vista principal del día operativo + demo de keys (R08).
 */
export function Dashboard() {
  const [date, setDate] = useState(todayLocalISODate);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todas");
  const [orden, setOrden] = useState<Orden>("hora-asc");
  /**
   * SOLO para la demo pedagógica. En producción siempre keys por id.
   * true → key={index} (bug); false → key={cita.id} (correcto).
   */
  const [useIndexKeys, setUseIndexKeys] = useState(false);

  const { data: citas, loading, error, refetch } = useCitas(date);

  const visibleCitas = useMemo(
    () => applyListTransforms(citas, estadoFiltro, orden),
    [citas, estadoFiltro, orden],
  );

  function handleDateChange(event: ChangeEvent<HTMLInputElement>) {
    setDate(event.target.value);
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>R08 · keys · R06 · useCitas</span>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.lead}>
          Lista filtrable/ordenable. Cada fila tiene una nota local: con{" "}
          <code>key=&#123;id&#125;</code> la nota viaja con la cita; con{" "}
          <code>key=&#123;index&#125;</code> “salta” al reordenar.
        </p>
      </header>

      <p
        className={
          useIndexKeys
            ? `${styles.callout} ${styles.calloutDanger}`
            : styles.callout
        }
        role="note"
      >
        <strong>Cómo reproducir el bug:</strong> 1) activá “Keys por índice”.
        2) Escribí una nota en la primera fila. 3) Cambiá el orden (hora desc /
        vet) o el filtro. 4) La nota queda en la posición, no en la cita. 5)
        Desactivá el modo índice: la nota permanece con el <code>id</code>{" "}
        correcto.
      </p>

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

      <div className={styles.filters}>
        <div className={styles.dateField}>
          <label className={styles.label} htmlFor="filtro-estado">
            Estado
          </label>
          <select
            id="filtro-estado"
            className={styles.select}
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value as EstadoFiltro)}
          >
            <option value="todas">Todas</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div className={styles.dateField}>
          <label className={styles.label} htmlFor="orden-citas">
            Orden
          </label>
          <select
            id="orden-citas"
            className={styles.select}
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
          >
            <option value="hora-asc">Hora ↑</option>
            <option value="hora-desc">Hora ↓</option>
            <option value="vet">Veterinario</option>
          </select>
        </div>
        <button
          type="button"
          className={
            useIndexKeys
              ? `${styles.toggleBug} ${styles.toggleBugActive}`
              : styles.toggleBug
          }
          aria-pressed={useIndexKeys}
          onClick={() => setUseIndexKeys((v) => !v)}
        >
          {useIndexKeys ? "Keys por índice (BUG ON)" : "Keys por índice (off)"}
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

      {!loading && !error && visibleCitas.length === 0 && (
        <p className={styles.empty}>No hay citas para este filtro/día.</p>
      )}

      {!loading && !error && visibleCitas.length > 0 && (
        <ul className={styles.list}>
          {visibleCitas.map((cita, index) => (
            <CitaRow
              // Producción: cita.id. Demo: index (anti-patrón a propósito).
              key={useIndexKeys ? index : cita.id}
              cita={cita}
              formatTime={formatTime}
              estadoClass={estadoClass}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
