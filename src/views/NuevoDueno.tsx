/**
 * Vista "Nuevo dueño" — wizard dueño + primera mascota (R04).
 *
 * Responsabilidades:
 * - Orquestar un flujo de 2 pasos con `useReducer` (estado único tipado).
 * - Derivar errores en render (no guardarlos en el reducer).
 * - Autofocus al cambiar de paso (`useRef`, legado R03).
 * - Llamar `crearDuenoConMascota` y despachar SUCCESS/ERROR (async fuera del reducer).
 *
 * Dependencias: `wizardReducer`, validación owner/pet, `vetApi`, CSS Module.
 * Relación: ruta `/duenos/nuevo`. Consolida R01 (campos controlados) + R04 (reducer).
 *
 * Hook demostrado: `useReducer`.
 * Patrón: Finite State Machine liviana vía acciones discriminadas.
 * SOLID: SRP — reducer = transiciones; vista = I/O + UI.
 */

import {
  useEffect,
  useReducer,
  useRef,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { vetApi } from "../data/mockApi";
import type { Especie } from "../domain/models";
import { isOwnerFormValid, type OwnerFormValues } from "../utils/validateOwnerForm";
import {
  ESPECIES,
  isPetFormValid,
  type PetFormValues,
} from "../utils/validatePetForm";
import styles from "./NuevoDueno.module.css";
import {
  initialWizardState,
  selectOwnerErrors,
  selectPetErrors,
  wizardReducer,
} from "./nuevoDueno/wizardReducer";

const OWNER_FIELDS: Array<{
  name: keyof OwnerFormValues;
  label: string;
  type: "text" | "email" | "tel";
  optional?: boolean;
}> = [
  { name: "nombre", label: "Nombre", type: "text" },
  { name: "apellido", label: "Apellido", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "telefono", label: "Teléfono", type: "tel" },
  { name: "direccion", label: "Dirección", type: "text", optional: true },
];

/**
 * Wizard de alta: paso 1 dueño → paso 2 mascota → persistencia conjunta.
 */
export function NuevoDueno() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const ownerErrors = selectOwnerErrors(state);
  const petErrors = selectPetErrors(state);
  const ownerValid = isOwnerFormValid(state.owner);
  const petValid = isPetFormValid(state.pet);
  const submitting = state.status === "submitting";

  /** Autofocus al entrar a cada paso (R03). */
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [state.step]);

  function handleOwnerChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    dispatch({
      type: "SET_OWNER_FIELD",
      field: name as keyof OwnerFormValues,
      value,
    });
  }

  function handlePetChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    dispatch({
      type: "SET_PET_FIELD",
      field: name as keyof PetFormValues,
      value,
    });
  }

  function handleOwnerBlur(event: FocusEvent<HTMLInputElement>) {
    dispatch({
      type: "TOUCH_OWNER_FIELD",
      field: event.target.name as keyof OwnerFormValues,
    });
  }

  function handlePetBlur(
    event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    dispatch({
      type: "TOUCH_PET_FIELD",
      field: event.target.name as keyof PetFormValues,
    });
  }

  function handleNext(event: FormEvent) {
    event.preventDefault();
    dispatch({ type: "NEXT" });
  }

  /**
   * Confirmación final: async en la vista, resultado vía dispatch.
   * El reducer NUNCA hace fetch (gotcha del lab).
   */
  async function handleConfirm(event: FormEvent) {
    event.preventDefault();

    if (!petValid) {
      dispatch({ type: "SUBMIT_START" });
      return;
    }

    dispatch({ type: "SUBMIT_START" });

    try {
      const peso = state.pet.pesoKg.trim();
      const { owner } = await vetApi.crearDuenoConMascota(
        {
          nombre: state.owner.nombre.trim(),
          apellido: state.owner.apellido.trim(),
          email: state.owner.email.trim(),
          telefono: state.owner.telefono.trim(),
          ...(state.owner.direccion.trim()
            ? { direccion: state.owner.direccion.trim() }
            : {}),
        },
        {
          nombre: state.pet.nombre.trim(),
          especie: state.pet.especie as Especie,
          ...(state.pet.raza.trim() ? { raza: state.pet.raza.trim() } : {}),
          ...(peso ? { pesoKg: Number(peso) } : {}),
          ...(state.pet.notas.trim() ? { notas: state.pet.notas.trim() } : {}),
        },
      );
      dispatch({ type: "SUBMIT_SUCCESS", ownerId: owner.id });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo completar el alta.";
      dispatch({ type: "SUBMIT_ERROR", message });
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>R04 · useReducer</span>
        <h1 className={styles.title}>Alta dueño + mascota</h1>
        <p className={styles.lead}>
          Wizard de dos pasos. Todo el estado vive en un reducer con acciones
          tipadas; el async del submit despacha el resultado (no corre adentro
          del reducer).
        </p>
      </header>

      <ol className={styles.steps} aria-label="Progreso del wizard">
        <li
          className={
            state.step === 1 ? `${styles.step} ${styles.stepActive}` : styles.step
          }
        >
          1. Dueño
        </li>
        <li
          className={
            state.step === 2 ? `${styles.step} ${styles.stepActive}` : styles.step
          }
        >
          2. Mascota
        </li>
      </ol>

      {state.status === "success" && state.createdOwnerId && (
        <p className={styles.success} role="status">
          Dueño y mascota creados.{" "}
          <Link to={`/duenos/${state.createdOwnerId}`}>Ver perfil</Link>
          {" · "}
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => dispatch({ type: "RESET" })}
          >
            Nueva alta
          </button>
        </p>
      )}

      {state.serverError && (
        <p className={styles.serverError} role="alert">
          {state.serverError}
        </p>
      )}

      {state.step === 1 && (
        <form className={styles.form} onSubmit={handleNext} noValidate>
          <h2 className={styles.stepTitle}>Datos del dueño</h2>
          {OWNER_FIELDS.map((field, index) => {
            const fieldError = ownerErrors[field.name];
            const showError = Boolean(state.ownerTouched[field.name] && fieldError);
            const inputId = `wizard-owner-${field.name}`;

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
                  value={state.owner[field.name]}
                  onChange={handleOwnerChange}
                  onBlur={handleOwnerBlur}
                  ref={index === 0 ? firstFieldRef : undefined}
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
              disabled={!ownerValid}
            >
              Siguiente
            </button>
            {!ownerValid && (
              <span className={styles.hint}>Completá los datos del dueño</span>
            )}
          </div>
        </form>
      )}

      {state.step === 2 && (
        <form className={styles.form} onSubmit={handleConfirm} noValidate>
          <h2 className={styles.stepTitle}>Primera mascota</h2>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="wizard-pet-nombre">
              Nombre
            </label>
            <input
              id="wizard-pet-nombre"
              name="nombre"
              type="text"
              value={state.pet.nombre}
              onChange={handlePetChange}
              onBlur={handlePetBlur}
              ref={firstFieldRef}
              aria-invalid={Boolean(state.petTouched.nombre && petErrors.nombre)}
              className={
                state.petTouched.nombre && petErrors.nombre
                  ? `${styles.input} ${styles.inputError}`
                  : styles.input
              }
            />
            {state.petTouched.nombre && petErrors.nombre && (
              <p className={styles.error} role="alert">
                {petErrors.nombre}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="wizard-pet-especie">
              Especie
            </label>
            <select
              id="wizard-pet-especie"
              name="especie"
              value={state.pet.especie}
              onChange={handlePetChange}
              onBlur={handlePetBlur}
              aria-invalid={Boolean(state.petTouched.especie && petErrors.especie)}
              className={
                state.petTouched.especie && petErrors.especie
                  ? `${styles.input} ${styles.inputError}`
                  : styles.input
              }
            >
              <option value="">Seleccioná…</option>
              {ESPECIES.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </select>
            {state.petTouched.especie && petErrors.especie && (
              <p className={styles.error} role="alert">
                {petErrors.especie}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="wizard-pet-raza">
              Raza <span className={styles.optional}>(opcional)</span>
            </label>
            <input
              id="wizard-pet-raza"
              name="raza"
              type="text"
              value={state.pet.raza}
              onChange={handlePetChange}
              onBlur={handlePetBlur}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="wizard-pet-peso">
              Peso kg <span className={styles.optional}>(opcional)</span>
            </label>
            <input
              id="wizard-pet-peso"
              name="pesoKg"
              type="number"
              min="0"
              step="0.1"
              value={state.pet.pesoKg}
              onChange={handlePetChange}
              onBlur={handlePetBlur}
              aria-invalid={Boolean(state.petTouched.pesoKg && petErrors.pesoKg)}
              className={
                state.petTouched.pesoKg && petErrors.pesoKg
                  ? `${styles.input} ${styles.inputError}`
                  : styles.input
              }
            />
            {state.petTouched.pesoKg && petErrors.pesoKg && (
              <p className={styles.error} role="alert">
                {petErrors.pesoKg}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="wizard-pet-notas">
              Notas <span className={styles.optional}>(opcional)</span>
            </label>
            <textarea
              id="wizard-pet-notas"
              name="notas"
              rows={3}
              value={state.pet.notas}
              onChange={handlePetChange}
              onBlur={handlePetBlur}
              className={styles.input}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => dispatch({ type: "BACK" })}
              disabled={submitting}
            >
              Atrás
            </button>
            <button
              type="submit"
              className={styles.submit}
              disabled={!petValid || submitting}
            >
              {submitting ? "Guardando…" : "Confirmar alta"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
