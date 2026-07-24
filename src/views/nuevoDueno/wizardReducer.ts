/**
 * Reducer del wizard "Alta dueño + primera mascota" (R04).
 *
 * Responsabilidades:
 * - Centralizar estado del wizard (paso, campos, touched, status de submit).
 * - Exponer transiciones explícitas vía acciones tipadas (discriminated union).
 * - Ser una función pura: sin async, sin I/O (el submit async vive en la vista).
 *
 * Dependencias: validación pura de owner/pet.
 * Relación: consumido solo por `views/NuevoDueno`.
 *
 * Cuándo usarlo: flujos con varias piezas de estado acopladas (pasos + forms).
 * Por qué existe: evita un enredo de useState sueltos y hace las transiciones testeables.
 */

import {
  getOwnerFormErrors,
  isOwnerFormValid,
  type OwnerFormValues,
} from "../../utils/validateOwnerForm";
import {
  getPetFormErrors,
  isPetFormValid,
  type PetFormValues,
} from "../../utils/validatePetForm";

export type WizardStep = 1 | 2;

export type OwnerTouched = Partial<Record<keyof OwnerFormValues, boolean>>;
export type PetTouched = Partial<Record<keyof PetFormValues, boolean>>;

export interface WizardState {
  step: WizardStep;
  owner: OwnerFormValues;
  pet: PetFormValues;
  ownerTouched: OwnerTouched;
  petTouched: PetTouched;
  status: "idle" | "submitting" | "success" | "error";
  serverError: string | null;
  createdOwnerId: string | null;
}

/**
 * Union discriminada de acciones del wizard.
 * Cada `type` define el payload esperado — TypeScript estrecha en el switch.
 */
export type WizardAction =
  | { type: "SET_OWNER_FIELD"; field: keyof OwnerFormValues; value: string }
  | { type: "SET_PET_FIELD"; field: keyof PetFormValues; value: string }
  | { type: "TOUCH_OWNER_FIELD"; field: keyof OwnerFormValues }
  | { type: "TOUCH_PET_FIELD"; field: keyof PetFormValues }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; ownerId: string }
  | { type: "SUBMIT_ERROR"; message: string }
  | { type: "RESET" };

export const INITIAL_OWNER: OwnerFormValues = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  direccion: "",
};

export const INITIAL_PET: PetFormValues = {
  nombre: "",
  especie: "",
  raza: "",
  pesoKg: "",
  notas: "",
};

export const initialWizardState: WizardState = {
  step: 1,
  owner: INITIAL_OWNER,
  pet: INITIAL_PET,
  ownerTouched: {},
  petTouched: {},
  status: "idle",
  serverError: null,
  createdOwnerId: null,
};

const ALL_OWNER_TOUCHED: OwnerTouched = {
  nombre: true,
  apellido: true,
  email: true,
  telefono: true,
  direccion: true,
};

const ALL_PET_TOUCHED: PetTouched = {
  nombre: true,
  especie: true,
  raza: true,
  pesoKg: true,
  notas: true,
};

/**
 * Reducer puro del wizard.
 *
 * @param state Estado actual.
 * @param action Acción tipada.
 * @returns Nuevo estado (inmutable).
 */
export function wizardReducer(
  state: WizardState,
  action: WizardAction,
): WizardState {
  switch (action.type) {
    case "SET_OWNER_FIELD":
      return {
        ...state,
        owner: { ...state.owner, [action.field]: action.value },
        status: state.status === "success" ? "idle" : state.status,
        createdOwnerId: null,
        serverError: null,
      };

    case "SET_PET_FIELD":
      return {
        ...state,
        pet: { ...state.pet, [action.field]: action.value },
        status: state.status === "success" ? "idle" : state.status,
        createdOwnerId: null,
        serverError: null,
      };

    case "TOUCH_OWNER_FIELD":
      return {
        ...state,
        ownerTouched: { ...state.ownerTouched, [action.field]: true },
      };

    case "TOUCH_PET_FIELD":
      return {
        ...state,
        petTouched: { ...state.petTouched, [action.field]: true },
      };

    case "NEXT": {
      // La transición de paso vive acá (no un setStep suelto).
      if (state.step !== 1) return state;
      if (!isOwnerFormValid(state.owner)) {
        return { ...state, ownerTouched: ALL_OWNER_TOUCHED };
      }
      return {
        ...state,
        step: 2,
        ownerTouched: ALL_OWNER_TOUCHED,
        serverError: null,
      };
    }

    case "BACK":
      if (state.step !== 2) return state;
      return { ...state, step: 1, serverError: null };

    case "SUBMIT_START":
      if (!isPetFormValid(state.pet)) {
        return { ...state, petTouched: ALL_PET_TOUCHED };
      }
      return {
        ...state,
        petTouched: ALL_PET_TOUCHED,
        status: "submitting",
        serverError: null,
      };

    case "SUBMIT_SUCCESS":
      return {
        ...initialWizardState,
        status: "success",
        createdOwnerId: action.ownerId,
      };

    case "SUBMIT_ERROR":
      return {
        ...state,
        status: "error",
        serverError: action.message,
      };

    case "RESET":
      return initialWizardState;

    default: {
      // Exhaustiveness check: si agregás una action y olvidás el case, TS falla.
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/** Helpers de lectura (errores siguen siendo derivados, no viven en el state). */
export function selectOwnerErrors(state: WizardState) {
  return getOwnerFormErrors(state.owner);
}

export function selectPetErrors(state: WizardState) {
  return getPetFormErrors(state.pet);
}
