/**
 * useDisponibilidad — slots de un vet en un día (R06).
 *
 * Qué hace: pide `getDisponibilidad(vetId, date)` al mock.
 * Cuándo usarlo: Agenda, form de nueva cita, cualquier vista de slots.
 * Por qué existe: misma lógica de loading/error/refetch reutilizable.
 *
 * @param vetId Id del veterinario (null/undefined → no fetch).
 * @param dateInput Fecha `YYYY-MM-DD`.
 * @returns API tipada `{ data, loading, error, refetch }`.
 */

import { useCallback, useEffect, useState } from "react";
import { invalidateMockCache, vetApi } from "../data/mockApi";
import type { Slot } from "../domain/models";
import { dateInputToISO } from "../utils/date";

export interface UseDisponibilidadResult {
  data: Slot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook de datos: disponibilidad de un veterinario en una fecha.
 */
export function useDisponibilidad(
  vetId: string | null | undefined,
  dateInput: string,
): UseDisponibilidadResult {
  const [data, setData] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(Boolean(vetId));
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    if (!vetId) return;
    const dayKey = dateInput.slice(0, 10);
    invalidateMockCache(`disp:${vetId}:${dayKey}`);
    setReloadToken((n) => n + 1);
  }, [vetId, dateInput]);

  useEffect(() => {
    if (!vetId) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    vetApi
      .getDisponibilidad(vetId, dateInputToISO(dateInput))
      .then((slots) => {
        if (cancelled) return;
        setData(slots);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo cargar la disponibilidad.";
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
  }, [vetId, dateInput, reloadToken]);

  return { data, loading, error, refetch };
}
