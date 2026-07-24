/**
 * useCitas — citas de un día (R06).
 *
 * Qué hace: pide `getCitasDelDia` al mock y expone data/loading/error/refetch.
 * Cuándo usarlo: Dashboard, Agenda u otras vistas que listen citas por fecha.
 * Por qué existe: evita copypaste del effect + cleanup anti-race (R02).
 *
 * Internamente: useEffect + useState (el lab permite esto; R13 usará `use()`).
 *
 * @param dateInput Fecha `YYYY-MM-DD` (valor de `<input type="date">`).
 * @returns API tipada `{ data, loading, error, refetch }`.
 */

import { useCallback, useEffect, useState } from "react";
import { invalidateMockCache, vetApi } from "../data/mockApi";
import type { AppointmentView } from "../domain/models";
import { dateInputToISO } from "../utils/date";

export interface UseCitasResult {
  data: AppointmentView[];
  loading: boolean;
  error: string | null;
  /** Invalida cache del día y vuelve a pedir. */
  refetch: () => void;
}

/**
 * Hook de datos: citas del día seleccionado.
 */
export function useCitas(dateInput: string): UseCitasResult {
  const [data, setData] = useState<AppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    const dayKey = dateInput.slice(0, 10);
    invalidateMockCache(`citas:${dayKey}`);
    setReloadToken((n) => n + 1);
  }, [dateInput]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    vetApi
      .getCitasDelDia(dateInputToISO(dateInput))
      .then((citas) => {
        if (cancelled) return;
        setData(citas);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "No se pudieron cargar las citas.";
        setError(message);
        setData([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateInput, reloadToken]);

  return { data, loading, error, refetch };
}
