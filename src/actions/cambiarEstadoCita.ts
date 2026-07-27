/**
 * Action de cambiar estado de cita (R15) — para UI optimista.
 *
 * Responsabilidades:
 * - Validar id + estado destino.
 * - Persistir vía `vetApi.cambiarEstadoCita` (puede fallar aleatoriamente).
 * - Devolver estado serializable ok/error (mismo estilo que R14).
 *
 * Dependencias: mockApi.
 * Relación: consumida por Dashboard con useOptimistic.
 */

import { invalidateMockCache, vetApi } from "../data/mockApi";
import type { EstadoCita } from "../domain/models";

const ESTADOS_VALIDOS: readonly EstadoCita[] = [
  "pendiente",
  "confirmada",
  "completada",
  "cancelada",
];

export interface CambiarEstadoCitaState {
  ok: boolean;
  message: string | null;
  appointmentId: string | null;
  estado: EstadoCita | null;
}

export const initialCambiarEstadoCitaState: CambiarEstadoCitaState = {
  ok: false,
  message: null,
  appointmentId: null,
  estado: null,
};

function isEstadoCita(value: string): value is EstadoCita {
  return (ESTADOS_VALIDOS as readonly string[]).includes(value);
}

/**
 * Action tipada: lee `id` y `estado` del FormData.
 */
export async function cambiarEstadoCitaAction(
  _prev: CambiarEstadoCitaState,
  formData: FormData,
): Promise<CambiarEstadoCitaState> {
  const id = String(formData.get("id") ?? "").trim();
  const estadoRaw = String(formData.get("estado") ?? "").trim();

  if (!id) {
    return {
      ok: false,
      message: "Falta el id de la cita.",
      appointmentId: null,
      estado: null,
    };
  }

  if (!isEstadoCita(estadoRaw)) {
    return {
      ok: false,
      message: "Estado de cita inválido.",
      appointmentId: id,
      estado: null,
    };
  }

  try {
    const appointment = await vetApi.cambiarEstadoCita(id, estadoRaw);
    invalidateMockCache("citas:");
    invalidateMockCache("disp:");
    invalidateMockCache(`historial:${appointment.ownerId}`);

    return {
      ok: true,
      message: `Cita marcada como ${estadoRaw}.`,
      appointmentId: appointment.id,
      estado: appointment.estado,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cambiar el estado de la cita.";
    return {
      ok: false,
      message,
      appointmentId: id,
      estado: null,
    };
  }
}
