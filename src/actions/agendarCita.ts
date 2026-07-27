/**
 * Action de agendar cita (R14) — para `useActionState`.
 *
 * Responsabilidades:
 * - Validar FormData (campos requeridos).
 * - Verificar que el slot esté libre (disponibilidad) antes de persistir.
 * - Llamar `vetApi.crearCita` (también valida solapamiento).
 * - Devolver un estado serializable con errores/éxito (sin setState en la vista).
 *
 * Dependencias: mockApi.
 * Relación: consumida por `views/NuevaCita` vía useActionState.
 *
 * Gotcha: la action es async; el pending lo expone useActionState / useFormStatus.
 */

import { invalidateMockCache, vetApi } from "../data/mockApi";

export interface AgendarCitaState {
  ok: boolean;
  message: string | null;
  fieldErrors: Partial<
    Record<
      "ownerId" | "petId" | "vetId" | "serviceId" | "fechaHora" | "motivo",
      string
    >
  >;
  appointmentId: string | null;
}

export const initialAgendarCitaState: AgendarCitaState = {
  ok: false,
  message: null,
  fieldErrors: {},
  appointmentId: null,
};

/**
 * Action tipada compatible con useActionState.
 *
 * @param _prev Estado anterior (React lo pasa; no lo usamos para acumular).
 * @param formData Datos del <form>.
 */
export async function agendarCitaAction(
  _prev: AgendarCitaState,
  formData: FormData,
): Promise<AgendarCitaState> {
  const ownerId = String(formData.get("ownerId") ?? "").trim();
  const petId = String(formData.get("petId") ?? "").trim();
  const vetId = String(formData.get("vetId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const fechaHora = String(formData.get("fechaHora") ?? "").trim();
  const motivoRaw = String(formData.get("motivo") ?? "").trim();

  const fieldErrors: AgendarCitaState["fieldErrors"] = {};

  if (!ownerId) fieldErrors.ownerId = "Seleccioná un dueño.";
  if (!petId) fieldErrors.petId = "Seleccioná una mascota.";
  if (!vetId) fieldErrors.vetId = "Seleccioná un veterinario.";
  if (!serviceId) fieldErrors.serviceId = "Seleccioná un servicio.";
  if (!fechaHora) fieldErrors.fechaHora = "Seleccioná un horario.";

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Revisá los campos marcados.",
      fieldErrors,
      appointmentId: null,
    };
  }

  try {
    // Disponibilidad fresca (evita slots stale del cache de lecturas).
    const dayKey = fechaHora.slice(0, 10);
    invalidateMockCache(`disp:${vetId}:${dayKey}`);

    const slots = await vetApi.getDisponibilidad(vetId, fechaHora);
    const slot = slots.find((s) => s.inicio === fechaHora);

    if (!slot) {
      return {
        ok: false,
        message: "El horario no pertenece a la agenda del veterinario.",
        fieldErrors: { fechaHora: "Slot inválido para este vet/día." },
        appointmentId: null,
      };
    }

    if (!slot.disponible) {
      return {
        ok: false,
        message: "Ese horario ya no está disponible.",
        fieldErrors: { fechaHora: "Slot ocupado (solapamiento)." },
        appointmentId: null,
      };
    }

    const appointment = await vetApi.crearCita({
      ownerId,
      petId,
      vetId,
      serviceId,
      fechaHora,
      ...(motivoRaw ? { motivo: motivoRaw } : {}),
    });

    // Invalidar lecturas derivadas para dashboard/agenda.
    invalidateMockCache("citas:");
    invalidateMockCache("historial:");

    return {
      ok: true,
      message: "Cita agendada correctamente.",
      fieldErrors: {},
      appointmentId: appointment.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo agendar la cita.";
    return {
      ok: false,
      message,
      fieldErrors: {},
      appointmentId: null,
    };
  }
}
