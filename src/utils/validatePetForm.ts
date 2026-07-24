/**
 * Validación pura del paso "mascota" del wizard (R04).
 *
 * Responsabilidades:
 * - Derivar errores de los datos de la primera mascota.
 * - Reutilizable y testeable fuera de React.
 *
 * Dependencias: `domain/models` (Especie).
 * Relación: consumido por el wizard reducer / vista NuevoDueno.
 */

import type { Especie } from "../domain/models";

export const ESPECIES: Especie[] = [
  "perro",
  "gato",
  "ave",
  "roedor",
  "reptil",
  "otro",
];

/** Valores del paso mascota (peso como string para el input controlado). */
export interface PetFormValues {
  nombre: string;
  /** Vacío hasta que el staff elige; se valida como requerido. */
  especie: Especie | "";
  raza: string;
  pesoKg: string;
  notas: string;
}

export type PetFormErrors = Partial<Record<keyof PetFormValues, string>>;

/**
 * Errores derivados del paso mascota.
 *
 * @param values Valores actuales del paso 2.
 */
export function getPetFormErrors(values: PetFormValues): PetFormErrors {
  const errors: PetFormErrors = {};

  if (!values.nombre.trim()) {
    errors.nombre = "El nombre de la mascota es obligatorio.";
  }

  if (!values.especie) {
    errors.especie = "Seleccioná la especie.";
  }

  const peso = values.pesoKg.trim();
  if (peso) {
    const n = Number(peso);
    if (Number.isNaN(n) || n <= 0) {
      errors.pesoKg = "Ingresá un peso válido en kg.";
    }
  }

  return errors;
}

/**
 * @param values Valores del paso mascota.
 * @returns true si el paso puede confirmarse.
 */
export function isPetFormValid(values: PetFormValues): boolean {
  return Object.keys(getPetFormErrors(values)).length === 0;
}
