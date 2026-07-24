/**
 * Vista "Nuevo dueño" — form controlado (R01) + useRef (R03).
 *
 * Responsabilidades:
 * - Mantener valores del form en estado local (`useState`) — R01.
 * - Derivar errores / validez en cada render (sin estado duplicado).
 * - Autofocus y foco imperativo a campos vía `useRef` — R03.
 * - Contar teclas en un ref mutable (sin re-render) — R03.
 * - Persistir vía `vetApi.crearDueno` cuando el form es válido.
 *
 * Dependencias: React (`useState`, `useEffect`, `useRef`), `vetApi`, validación, CSS Module.
 * Relación: ruta `/duenos/nuevo`. R04 extenderá a wizard con `useReducer`.
 *
 * Hooks: `useState` (R01) + `useRef` (R03).
 * Patrón: Controlled Inputs + Imperative Handle via ref (foco DOM).
 */

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
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
 * Formulario de alta de dueño: controlado (R01) + refs de foco/mutable (R03).
 */
export function NuevoDueno() {
  const [form, setForm] = useState<OwnerFormValues>(INITIAL_FORM);
  const [touched, setTouched] = useState<TouchedMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdOwnerId, setCreatedOwnerId] = useState<string | null>(null);
  /** Solo para mostrar el valor del ref cuando el usuario lo pide (no en cada tecla). */
  const [keystrokeDisplay, setKeystrokeDisplay] = useState<number | null>(null);

  /**
   * Refs de DOM (R03 — foco).
   * Mapa de inputs para enfocar el primer campo con error sin re-render.
   */
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({});

  /**
   * Valor mutable sin re-render (R03).
   * Cada tecla incrementa el contador; la UI NO se actualiza hasta "Leer contador".
   */
  const keystrokesRef = useRef(0);

  /**
   * Espejo del form en un ref: útil si un callback async/timeout necesita
   * el valor más reciente sin closures stale (patrón "ref as latest").
   */
  const formRef = useRef(form);
  formRef.current = form;

  const errors = getOwnerFormErrors(form);
  const isValid = isOwnerFormValid(form);

  /** Autofocus del primer campo al montar la vista (recepción → tipeo inmediato). */
  useEffect(() => {
    fieldRefs.current.nombre?.focus();
  }, []);

  /**
   * Enfoca el primer campo con error de validación.
   * Es imperativo (DOM) → useRef, no estado.
   */
  function focusFirstInvalidField() {
    const firstInvalid = FIELD_META.find((field) => errors[field.name]);
    if (!firstInvalid) return;
    setTouched((prev) => ({ ...prev, [firstInvalid.name]: true }));
    fieldRefs.current[firstInvalid.name]?.focus();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    // Mutable: no setState del contador → no re-render extra por la métrica.
    keystrokesRef.current += 1;
    setForm((prev) => ({ ...prev, [name]: value }));
    setServerError(null);
    setCreatedOwnerId(null);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const name = event.target.name as FieldName;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({
      nombre: true,
      apellido: true,
      email: true,
      telefono: true,
      direccion: true,
    });

    if (!isValid) {
      focusFirstInvalidField();
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setServerError(null);

    try {
      // Lee el snapshot más reciente vía ref (defensa ante closures stale).
      const latest = formRef.current;
      const owner = await vetApi.crearDueno({
        nombre: latest.nombre.trim(),
        apellido: latest.apellido.trim(),
        email: latest.email.trim(),
        telefono: latest.telefono.trim(),
        ...(latest.direccion.trim()
          ? { direccion: latest.direccion.trim() }
          : {}),
      });
      setCreatedOwnerId(owner.id);
      setForm(INITIAL_FORM);
      setTouched({});
      keystrokesRef.current = 0;
      setKeystrokeDisplay(null);
      // Listo para el próximo alta: foco de vuelta al nombre.
      queueMicrotask(() => fieldRefs.current.nombre?.focus());
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
        <span className={styles.badge}>R01 · useState · R03 · useRef</span>
        <h1 className={styles.title}>Nuevo dueño</h1>
        <p className={styles.lead}>
          R01: form controlado con validación derivada. R03: autofocus y foco al
          primer error vía ref de DOM; contador de teclas en un ref mutable (sin
          re-render por tecla).
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
                ref={(node) => {
                  fieldRefs.current[field.name] = node;
                }}
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
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={focusFirstInvalidField}
            >
              Ir al primer error
            </button>
          )}
        </div>

        <div className={styles.refDemo}>
          <p className={styles.hint}>
            Contador de teclas vive en <code>keystrokesRef</code> (mutable, sin
            re-render).
            {keystrokeDisplay !== null && (
              <>
                {" "}
                Última lectura: <strong>{keystrokeDisplay}</strong>
              </>
            )}
          </p>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setKeystrokeDisplay(keystrokesRef.current)}
          >
            Leer contador (ref → state)
          </button>
        </div>
      </form>
    </section>
  );
}
