/**
 * Vista "Nuevo dueño" — formulario controlado (R01).
 *
 * Responsabilidades:
 * - Mantener valores del form en estado local (`useState`).
 * - Derivar errores / validez en cada render (sin estado duplicado).
 * - Persistir vía `vetApi.crearDueno` cuando el form es válido.
 *
 * Dependencias: React (`useState`), `vetApi`, `validateOwnerForm`, CSS Module.
 * Relación: ruta `/duenos/nuevo`. R04 reemplazará/extenderá este flujo a wizard.
 *
 * Hook demostrado: `useState` (componentes controlados).
 * Patrón: Controlled Inputs + Derived State.
 * SOLID: SRP — la vista orquesta UI; la validación vive en `utils/`.
 */

import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { vetApi } from "../data/mockApi";
import {
  getOwnerFormErrors,
  isOwnerFormValid,
  type OwnerFormValues,
} from "../utils/validateOwnerForm";
import styles from "./NuevoDueno.module.css";

const INITIAL_FORM: OwnerFormValues = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  direccion: "",
};

type FieldName = keyof OwnerFormValues;

type TouchedMap = Partial<Record<FieldName, boolean>>;

const FIELD_META: Array<{
  name: FieldName;
  label: string;
  type: "text" | "email" | "tel";
  autoComplete: string;
  optional?: boolean;
}> = [
  { name: "nombre", label: "Nombre", type: "text", autoComplete: "given-name" },
  { name: "apellido", label: "Apellido", type: "text", autoComplete: "family-name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "telefono", label: "Teléfono", type: "tel", autoComplete: "tel" },
  {
    name: "direccion",
    label: "Dirección",
    type: "text",
    autoComplete: "street-address",
    optional: true,
  },
];

/**
 * Formulario de alta de dueño con inputs controlados y validación en vivo.
 */
export function NuevoDueno() {
  /** Único estado de valores: un objeto, no un useState por campo. */
  const [form, setForm] = useState<OwnerFormValues>(INITIAL_FORM);
  /** UI: qué campos el usuario ya tocó (para no gritar errores en vacío inicial). */
  const [touched, setTouched] = useState<TouchedMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdOwnerId, setCreatedOwnerId] = useState<string | null>(null);

  // --- Estado derivado (NO va en useState) ---
  const errors = getOwnerFormErrors(form);
  const isValid = isOwnerFormValid(form);

  /**
   * Actualiza un campo del form controlado.
   * Pattern: spread + override — inmutabilidad superficial.
   */
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setServerError(null);
    setCreatedOwnerId(null);
  }

  /** Marca el campo como tocado al salir (blur) para mostrar feedback. */
  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const name = event.target.name as FieldName;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  /**
   * Submit: solo llega acá si el botón no está disabled (form válido).
   * Defensa en profundidad: re-chequeamos isValid antes de llamar al mock.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({
      nombre: true,
      apellido: true,
      email: true,
      telefono: true,
      direccion: true,
    });

    if (!isValid || submitting) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const owner = await vetApi.crearDueno({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        ...(form.direccion.trim()
          ? { direccion: form.direccion.trim() }
          : {}),
      });
      setCreatedOwnerId(owner.id);
      setForm(INITIAL_FORM);
      setTouched({});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el dueño.";
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>R01 · useState</span>
        <h1 className={styles.title}>Nuevo dueño</h1>
        <p className={styles.lead}>
          Cada tecla actualiza el estado. Los errores se derivan en el render; el
          submit solo se habilita cuando el form es válido.
        </p>
      </header>

      {createdOwnerId && (
        <p className={styles.success} role="status">
          Dueño creado correctamente.{" "}
          <Link to={`/duenos/${createdOwnerId}`}>Ver perfil</Link>
        </p>
      )}

      {serverError && (
        <p className={styles.serverError} role="alert">
          {serverError}
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {FIELD_META.map((field) => {
          const fieldError = errors[field.name];
          const showError = Boolean(touched[field.name] && fieldError);
          const inputId = `owner-${field.name}`;

          return (
            <div key={field.name} className={styles.field}>
              <label className={styles.label} htmlFor={inputId}>
                {field.label}
                {field.optional && (
                  <span className={styles.optional}> (opcional)</span>
                )}
              </label>
              <input
                id={inputId}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                value={form[field.name]}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={showError}
                aria-describedby={showError ? `${inputId}-error` : undefined}
                className={
                  showError
                    ? `${styles.input} ${styles.inputError}`
                    : styles.input
                }
              />
              {showError && (
                <p id={`${inputId}-error`} className={styles.error} role="alert">
                  {fieldError}
                </p>
              )}
            </div>
          );
        })}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submit}
            disabled={!isValid || submitting}
          >
            {submitting ? "Guardando…" : "Guardar dueño"}
          </button>
          {!isValid && (
            <span className={styles.hint}>Completá los campos requeridos</span>
          )}
        </div>
      </form>
    </section>
  );
}
