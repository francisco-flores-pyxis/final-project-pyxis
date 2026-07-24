/**
 * Agenda — grilla performante (R06 datos + R07 memoización).
 *
 * Responsabilidades:
 * - Elegir fecha + vet; cargar slots/citas.
 * - Derivar el modelo de grilla con `useMemo` (filtro + labels + stats).
 * - Pasar `onSelect` estable con `useCallback` a celdas `memo`.
 * - Exponer un re-render del padre sin cambiar props de celdas (demo Profiler).
 *
 * Dependencias: useCitas, useDisponibilidad, SlotCell, CSS Module.
 * Relación: ruta `/agenda`.
 *
 * Hooks: useMemo + useCallback + memo (R07).
 * Patrón: derived model + memoized list items.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { SlotCell } from "../components/agenda/SlotCell";
import { vetApi } from "../data/mockApi";
import type { Slot, Vet } from "../domain/models";
import { useCitas } from "../hooks/useCitas";
import { useDisponibilidad } from "../hooks/useDisponibilidad";
import { todayLocalISODate } from "../utils/date";
import styles from "./Agenda.module.css";

interface GridCell {
  inicio: string;
  label: string;
  disponible: boolean;
}

interface GridModel {
  cells: GridCell[];
  libres: number;
  ocupados: number;
}

/**
 * Formatea solo la hora de un slot (America/Montevideo).
 */
function formatSlotTime(iso: string): string {
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  }).format(new Date(iso));
}

/**
 * Cálculo derivado de la grilla a partir de slots crudos + filtro.
 * Separado para poder medirlo/justificarlo en entrevista.
 *
 * @param slots Slots del mock.
 * @param onlyFree Si true, oculta ocupados.
 */
function buildGridModel(slots: Slot[], onlyFree: boolean): GridModel {
  const filtered = onlyFree ? slots.filter((s) => s.disponible) : slots;

  // Trabajo O(n): map + conteos. En grillas grandes (multi-vet) esto crece.
  const cells: GridCell[] = filtered.map((slot) => ({
    inicio: slot.inicio,
    label: formatSlotTime(slot.inicio),
    disponible: slot.disponible,
  }));

  let libres = 0;
  let ocupados = 0;
  for (const cell of cells) {
    if (cell.disponible) libres += 1;
    else ocupados += 1;
  }

  return { cells, libres, ocupados };
}

/**
 * Vista de agenda con grilla memorizada.
 */
export function Agenda() {
  const [date, setDate] = useState(todayLocalISODate);
  const [vets, setVets] = useState<Vet[]>([]);
  const [vetsError, setVetsError] = useState<string | null>(null);
  const [vetId, setVetId] = useState<string>("");
  const [onlyFree, setOnlyFree] = useState(false);
  const [selectedInicio, setSelectedInicio] = useState<string | null>(null);
  /** Estado UI no relacionado a las celdas: fuerza re-render del padre. */
  const [parentRenderTick, setParentRenderTick] = useState(0);

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

  /**
   * useMemo: no recalcular labels/conteos si `slots` y `onlyFree` no cambiaron.
   * Aunque el padre re-renderice por `parentRenderTick`, este modelo se reutiliza.
   */
  const gridModel = useMemo(
    () => buildGridModel(slots, onlyFree),
    [slots, onlyFree],
  );

  /**
   * useCallback: misma referencia de función entre renders del padre.
   * Sin esto, `memo(SlotCell)` vería un `onSelect` nuevo siempre → re-render total.
   */
  const handleSelectSlot = useCallback((inicio: string) => {
    setSelectedInicio((prev) => (prev === inicio ? null : inicio));
  }, []);

  const handleDateChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDate(event.target.value);
    setSelectedInicio(null);
  }, []);

  const handleVetChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setVetId(event.target.value);
    setSelectedInicio(null);
  }, []);

  const handleToggleOnlyFree = useCallback(() => {
    setOnlyFree((prev) => !prev);
  }, []);

  const handleForceParentRender = useCallback(() => {
    setParentRenderTick((n) => n + 1);
  }, []);

  const loading = slotsLoading || citasLoading;
  const error = slotsError || citasError || vetsError;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>
          R07 · useMemo / useCallback / memo
        </span>
        <h1 className={styles.title}>Agenda</h1>
        <p className={styles.lead}>
          Grilla con modelo memorizado, celdas en <code>memo</code> y handlers
          estables. Pulsá “Re-render padre”: las celdas no deberían repintarse
          (Profiler / title de cada celda).
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
        <button
          type="button"
          className={onlyFree ? styles.filterActive : styles.refetchBtn}
          onClick={handleToggleOnlyFree}
          aria-pressed={onlyFree}
        >
          Solo libres
        </button>
        <button
          type="button"
          className={styles.refetchBtn}
          onClick={handleForceParentRender}
        >
          Re-render padre ({parentRenderTick})
        </button>
      </div>

      {!citasLoading && !citasError && (
        <p className={styles.summary}>
          Citas del día: <strong>{citas.length}</strong>
          {" · "}
          Slots en grilla: <strong>{gridModel.cells.length}</strong>
          {" · "}
          Libres: <strong>{gridModel.libres}</strong>
          {" · "}
          Ocupados: <strong>{gridModel.ocupados}</strong>
          {selectedInicio && (
            <>
              {" · "}
              Selección: <strong>{formatSlotTime(selectedInicio)}</strong>
            </>
          )}
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

      {!slotsLoading && !slotsError && vetId && gridModel.cells.length === 0 && (
        <p className={styles.empty}>Sin franjas para este filtro/vet/día.</p>
      )}

      {!slotsLoading && !slotsError && gridModel.cells.length > 0 && (
        <div className={styles.slotList} role="list">
          {gridModel.cells.map((cell) => (
            <div key={cell.inicio} role="listitem">
              <SlotCell
                inicio={cell.inicio}
                label={cell.label}
                disponible={cell.disponible}
                selected={selectedInicio === cell.inicio}
                onSelect={handleSelectSlot}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
