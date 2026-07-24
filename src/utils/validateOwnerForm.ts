/**
 * Validación pura del formulario de alta de dueño (R01).
 *
 * Responsabilidades:
 * - Derivar errores por campo a partir de los valores actuales.
 * - Exponer `isOwnerFormValid` sin mutar ni acoplarse a React.
 *
 * Dependencias: ninguna.
 * Relación: consumido por `views/NuevoDueno`. En R04 el wizard puede reutilizar estas reglas.
 *
 * Por qué existe: mantener la validación fuera del componente facilita testing
 * y evita el anti-patrón de guardar `errors` / `isValid` en estado.
 */

/** Campos editables del alta de dueño (sin id ni createdAt). */
export interface OwnerFormValues {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
}

export type OwnerFormErrors = Partial<Record<keyof OwnerFormValues, string>>;

/** Email con forma básica user@dominio.tld — suficiente para feedback en vivo. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Calcula mensajes de error por campo a partir de los valores actuales.
 * No decide *cuándo* mostrarlos (eso es UI: touched / submitAttempted).
 *
 * @param values Valores actuales del form controlado.
 * @returns Mapa campo → mensaje. Vacío si el form es válido.
 */
export function getOwnerFormErrors(values: OwnerFormValues): OwnerFormErrors {
  const errors: OwnerFormErrors = {};

  if (!values.nombre.trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }

  if (!values.apellido.trim()) {
    errors.apellido = "El apellido es obligatorio.";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "El email es obligatorio.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Ingresá un email válido.";
  }

  if (!values.telefono.trim()) {
    errors.telefono = "El teléfono es obligatorio.";
  }

  // direccion es opcional en el dominio (§1.3) — sin error si está vacía.

  return errors;
}

/**
 * Indica si el formulario puede enviarse.
 *
 * @param values Valores actuales.
 */
export function isOwnerFormValid(values: OwnerFormValues): boolean {
  return Object.keys(getOwnerFormErrors(values)).length === 0;
}
