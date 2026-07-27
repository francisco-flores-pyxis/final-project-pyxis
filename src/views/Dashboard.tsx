/**
 * Dashboard — citas del día (R02 + R06 + R08 + R09).
 *
 * Responsabilidades:
 * - Cargar / filtrar / ordenar citas.
 * - Keys estables + demo del bug de índice (R08).
 * - Modal de detalle + toasts vía portals (R09).
 *
 * Dependencias: useCitas, CitaRow, Modal, useToasts, CSS Module.
 */

import { useCallback, useMemo, useState, type ChangeEvent } from "react";
import { CitaRow } from "../components/dashboard/CitaRow";
import { Modal } from "../components/Modal";
import { useToasts } from "../components/Toasts";
import type { AppointmentView, EstadoCita } from "../domain/models";
import { useCitas } from "../hooks/useCitas";
import { todayLocalISODate } from "../utils/date";
import styles from "./Dashboard.module.css";

type EstadoFiltro = "todas" | EstadoCita;
type Orden = "hora-asc" | "hora-desc" | "vet";

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  }).format(new Date(iso));
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-UY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Montevideo",
  }).format(new Date(iso));
}

function estadoClass(estado: EstadoCita): string {
  const map: Record<EstadoCita, string> = {
    pendiente: styles.estadoPendiente,
    confirmada: styles.estadoConfirmada,
    completada: styles.estadoCompletada,
    cancelada: styles.estadoCancelada,
  };
  return `${styles.estado} ${map[estado]}`;
}

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
 * Vista principal del día operativo.
 */
export function Dashboard() {
  const { push } = useToasts();
  const [date, setDate] = useState(todayLocalISODate);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todas");
  const [orden, setOrden] = useState<Orden>("hora-asc");
  const [useIndexKeys, setUseIndexKeys] = useState(false);
  const [selectedCita, setSelectedCita] = useState<AppointmentView | null>(null);

  const { data: citas, loading, error, refetch } = useCitas(date);

  const visibleCitas = useMemo(
    () => applyListTransforms(citas, estadoFiltro, orden),
    [citas, estadoFiltro, orden],
  );

  const handleCloseModal = useCallback(() => {
    setSelectedCita(null);
  }, []);

  const handleOpenDetail = useCallback(
    (cita: AppointmentView) => {
      setSelectedCita(cita);
      push({
        message: `Detalle de ${cita.pet.nombre} (portal #modal-root)`,
        tone: "info",
      });
    },
    [push],
  );

  function handleDateChange(event: ChangeEvent<HTMLInputElement>) {
    setDate(event.target.value);
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>R09 · portal · R08 · keys</span>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.lead}>
          “Ver detalle” abre un modal en <code>#modal-root</code> (Escape /
          trap de foco). Los avisos van a <code>#toast-root</code> con{" "}
          <code>--z-toast</code>.
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
        <strong>R08 — bug de keys:</strong> activá “Keys por índice”, escribí
        una nota, reordená/filtrá y mirá cómo salta. Con{" "}
        <code>key=&#123;id&#125;</code> la nota viaja con la cita.
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
        <button
          type="button"
          className={styles.todayBtn}
          onClick={() =>
            push({ message: "Toast de prueba (portal)", tone: "success" })
          }
        >
          Toast demo
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
              key={useIndexKeys ? index : cita.id}
              cita={cita}
              formatTime={formatTime}
              estadoClass={estadoClass}
              onOpenDetail={handleOpenDetail}
            />
          ))}
        </ul>
      )}

      <Modal
        open={selectedCita !== null}
        title={
          selectedCita
            ? `Cita · ${selectedCita.pet.nombre}`
            : "Detalle de cita"
        }
        onClose={handleCloseModal}
      >
        {selectedCita && (
          <>
            <p>
              <strong>Cuándo:</strong> {formatDateTime(selectedCita.fechaHora)}
            </p>
            <p>
              <strong>Dueño:</strong> {selectedCita.owner.nombre}{" "}
              {selectedCita.owner.apellido}
            </p>
            <p>
              <strong>Servicio:</strong> {selectedCita.service.nombre} (
              {selectedCita.service.duracionMin} min)
            </p>
            <p>
              <strong>Vet:</strong> {selectedCita.vet.nombre} —{" "}
              {selectedCita.vet.especialidad}
            </p>
            <p>
              <strong>Estado:</strong> {selectedCita.estado}
            </p>
            {selectedCita.motivo && (
              <p>
                <strong>Motivo:</strong> {selectedCita.motivo}
              </p>
            )}
            <button
              type="button"
              className={styles.todayBtn}
              onClick={() => {
                push({
                  message: "Modal cerrado desde el detalle",
                  tone: "success",
                });
                handleCloseModal();
              }}
            >
              Cerrar y notificar
            </button>
          </>
        )}
      </Modal>
    </section>
  );
}
