/**
 * Utilidades de fecha local para inputs `type="date"` y el mock API.
 *
 * Responsabilidades:
 * - Convertir entre `YYYY-MM-DD` (UI) e ISO anclado al mediodía local (API).
 *
 * Relación: usado por Dashboard, Agenda y hooks de datos.
 */

/**
 * Fecha local de hoy como `YYYY-MM-DD`.
 */
export function todayLocalISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Convierte `YYYY-MM-DD` a ISO completo anclado al mediodía local.
 *
 * @param dateInput Valor del input date.
 */
export function dateInputToISO(dateInput: string): string {
  const [y, m, d] = dateInput.split("-").map(Number);
  const local = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
  return local.toISOString();
}
