/**
 * Reportes / estadísticas — vista “pesada” (R12).
 *
 * Responsabilidades:
 * - Agregar citas/servicios/estados para un tablero interno.
 * - Vivir en un chunk aparte cargado solo al entrar a /reportes (`React.lazy`).
 *
 * Dependencias: vetApi, CSS Module.
 * Relación: importada dinámicamente desde `AppRouter` (default export obligatorio).
 *
 * Por qué default export: `lazy(() => import(...))` espera `{ default: Component }`.
 */

import { useEffect, useMemo, useState } from "react";
import { vetApi } from "../data/mockApi";
import type { AppointmentView, EstadoCita, Service } from "../domain/models";
import styles from "./Reportes.module.css";

interface ReportData {
  citas: AppointmentView[];
  servicios: Service[];
}

const ESTADOS: EstadoCita[] = [
  "pendiente",
  "confirmada",
  "completada",
  "cancelada",
];

/**
 * Agrega conteos por estado de cita.
 */
function countByEstado(citas: AppointmentView[]): Record<EstadoCita, number> {
  const counts: Record<EstadoCita, number> = {
    pendiente: 0,
    confirmada: 0,
    completada: 0,
    cancelada: 0,
  };
  for (const cita of citas) {
    counts[cita.estado] += 1;
  }
  return counts;
}

/**
 * Agrega conteos por servicio.
 */
function countByServicio(
  citas: AppointmentView[],
  servicios: Service[],
): Array<{ nombre: string; total: number }> {
  const map = new Map<string, number>();
  for (const cita of citas) {
    map.set(cita.service.id, (map.get(cita.service.id) ?? 0) + 1);
  }
  return servicios
    .map((svc) => ({
      nombre: svc.nombre,
      total: map.get(svc.id) ?? 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Vista de reportes (default export para lazy).
 */
export default function Reportes() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Pedimos un rango amplio: citas del día de hoy + historiales vía getCitasDelDia
    // no alcanza; usamos varias fechas relativas del seed pidiendo "hoy" y
    // además servicios. Para stats globales del mock, reutilizamos getCitasDelDia
    // de varios offsets vía Promise.all sería incompleto. Alternativa pragmática:
    // getDuenos + getHistorial de cada uno es pesado (intencional para el chunk).
    Promise.all([vetApi.getServicios(), vetApi.getDuenos()])
      .then(async ([servicios, duenos]) => {
        const historiales = await Promise.all(
          duenos.map((d) => vetApi.getHistorialCitas(d.id)),
        );
        if (cancelled) return;
        const citas = historiales.flat();
        // Deduplicar por id (un mismo apt no debería repetirse).
        const byId = new Map(citas.map((c) => [c.id, c]));
        setData({ citas: [...byId.values()], servicios });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar reportes.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const porEstado = useMemo(
    () => (data ? countByEstado(data.citas) : null),
    [data],
  );

  const porServicio = useMemo(
    () => (data ? countByServicio(data.citas, data.servicios) : []),
    [data],
  );

  const maxServicio = Math.max(1, ...porServicio.map((s) => s.total));

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>R12 · lazy + Suspense</span>
        <h1 className={styles.title}>Reportes</h1>
        <p className={styles.lead}>
          Vista cargada bajo demanda: este módulo es un chunk aparte. Abrí la
          pestaña Network al entrar a Reportes para ver el JS diferido.
        </p>
      </header>

      {loading && <p className={styles.status}>Calculando agregaciones…</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {data && porEstado && (
        <>
          <div className={styles.grid}>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Citas totales</p>
              <p className={styles.statValue}>{data.citas.length}</p>
            </div>
            {ESTADOS.map((estado) => (
              <div key={estado} className={styles.stat}>
                <p className={styles.statLabel}>{estado}</p>
                <p className={styles.statValue}>{porEstado[estado]}</p>
              </div>
            ))}
          </div>

          <section className={styles.panel} aria-labelledby="servicios-chart">
            <h2 id="servicios-chart" className={styles.panelTitle}>
              Citas por servicio
            </h2>
            {porServicio.map((row) => (
              <div key={row.nombre} className={styles.barRow}>
                <span>{row.nombre}</span>
                <div className={styles.barTrack} aria-hidden>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(row.total / maxServicio) * 100}%` }}
                  />
                </div>
                <strong>{row.total}</strong>
              </div>
            ))}
          </section>
        </>
      )}
    </section>
  );
}
