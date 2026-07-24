/**
 * Agenda — disponibilidad por veterinario (R06).
 *
 * Responsabilidades:
 * - Elegir fecha + vet.
 * - Mostrar slots vía `useDisponibilidad`.
 * - Reusar `useCitas` para el resumen del día (mismo hook que el Dashboard).
 *
 * Dependencias: useCitas, useDisponibilidad, vetApi (lista de vets).
 * Relación: ruta `/agenda`. R07 convertirá los slots en grilla memorizada.
 *
 * Hooks demostrados: custom hooks de datos (R06).
 */

import { useEffect, useState, type ChangeEvent } from "react";
import { vetApi } from "../data/mockApi";
import type { Vet } from "../domain/models";
import { useCitas } from "../hooks/useCitas";
import { useDisponibilidad } from "../hooks/useDisponibilidad";
import { todayLocalISODate } from "../utils/date";
import styles from "./Agenda.module.css";

/**
 * Formatea solo la hora de un slot.
 */
function formatSlotTime(iso: string): string {
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  }).format(new Date(iso));
}

/**
 * Vista de agenda: slots del vet + resumen de citas del día.
 */
export function Agenda() {
  const [date, setDate] = useState(todayLocalISODate);
  const [vets, setVets] = useState<Vet[]>([]);
  const [vetsError, setVetsError] = useState<string | null>(null);
  const [vetId, setVetId] = useState<string>("");

  const {
    data: citas,
    loading: citasLoading,
    error: citasError,
  } = useCitas(date);

  const {
    data: slots,
    loading: slotsLoading,
    error: slotsError,
    refetch: refetchSlots,
  } = useDisponibilidad(vetId || null, date);

  /** Carga el catálogo de vets una vez (no es el foco de R06). */
  useEffect(() => {
    let cancelled = false;
    vetApi
      .getVets()
      .then((list) => {
        if (cancelled) return;
        setVets(list);
        setVetId((current) => current || list[0]?.id || "");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setVetsError(
          err instanceof Error ? err.message : "No se pudieron cargar los vets.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleDateChange(event: ChangeEvent<HTMLInputElement>) {
    setDate(event.target.value);
  }

  function handleVetChange(event: ChangeEvent<HTMLSelectElement>) {
    setVetId(event.target.value);
  }

  const loading = slotsLoading || citasLoading;
  const error = slotsError || citasError || vetsError;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>R06 · useCitas / useDisponibilidad</span>
        <h1 className={styles.title}>Agenda</h1>
        <p className={styles.lead}>
          Misma fuente de citas que el Dashboard (<code>useCitas</code>) más
          slots del vet (<code>useDisponibilidad</code>). R07 memorizará la grilla.
        </p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="agenda-date">
            Fecha
          </label>
          <input
            id="agenda-date"
            type="date"
            className={styles.input}
            value={date}
            onChange={handleDateChange}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="agenda-vet">
            Veterinaria/o
          </label>
          <select
            id="agenda-vet"
            className={styles.input}
            value={vetId}
            onChange={handleVetChange}
            disabled={vets.length === 0}
          >
            {vets.length === 0 && <option value="">Cargando…</option>}
            {vets.map((vet) => (
              <option key={vet.id} value={vet.id}>
                {vet.nombre} — {vet.especialidad}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className={styles.refetchBtn}
          onClick={refetchSlots}
          disabled={!vetId || slotsLoading}
        >
          Refetch slots
        </button>
      </div>

      {!citasLoading && !citasError && (
        <p className={styles.summary}>
          Citas del día (vía <code>useCitas</code>): <strong>{citas.length}</strong>
        </p>
      )}

      {loading && (
        <p className={styles.status} role="status">
          Cargando agenda…
        </p>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {!slotsLoading && !slotsError && vetId && slots.length === 0 && (
        <p className={styles.empty}>Sin franjas para este vet/día.</p>
      )}

      {!slotsLoading && !slotsError && slots.length > 0 && (
        <ul className={styles.slotList}>
          {slots.map((slot) => (
            <li
              key={slot.inicio}
              className={`${styles.slot} ${
                slot.disponible ? styles.slotLibre : styles.slotOcupado
              }`}
            >
              {formatSlotTime(slot.inicio)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
