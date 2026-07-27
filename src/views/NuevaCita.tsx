/**
 * Formulario de nueva cita con useActionState (R14) + SubmitButton (R16).
 *
 * Responsabilidades:
 * - Cargar catálogos (dueños, vets, servicios) y mascotas/slots en cascada.
 * - Enviar el alta vía action (pending/errores/éxito sin useState de submit).
 * - El botón de envío lee `pending` con useFormStatus (hijo del form).
 *
 * Dependencias: useActionState, agendarCitaAction, SubmitButton, useDisponibilidad.
 * Relación: ruta `/citas/nueva`.
 *
 * Hooks: useActionState (R14), useFormStatus vía SubmitButton (R16).
 * Patrón: form action (React 19) + validación de disponibilidad en la action.
 */

import {
  useActionState,
  useEffect,
  useState,
  type ChangeEvent,
} from "react";
import {
  agendarCitaAction,
  initialAgendarCitaState,
} from "../actions/agendarCita";
import { SubmitButton } from "../components/SubmitButton";
import { useToasts } from "../components/Toasts";
import { vetApi } from "../data/mockApi";
import type { Owner, Pet, Service, Vet } from "../domain/models";
import { useDisponibilidad } from "../hooks/useDisponibilidad";
import { dateInputToISO, todayLocalISODate } from "../utils/date";
import styles from "./NuevaCita.module.css";

/**
 * Formatea hora de slot para el select.
 */
function formatSlotLabel(iso: string): string {
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  }).format(new Date(iso));
}

/**
 * Vista de agendar cita.
 */
export function NuevaCita() {
  const { push } = useToasts();
  const [state, formAction, isPending] = useActionState(
    agendarCitaAction,
    initialAgendarCitaState,
  );

  const [owners, setOwners] = useState<Owner[]>([]);
  const [vets, setVets] = useState<Vet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [ownerId, setOwnerId] = useState("");
  const [vetId, setVetId] = useState("");
  const [date, setDate] = useState(todayLocalISODate);
  const [formKey, setFormKey] = useState(0);

  const {
    data: slots,
    loading: slotsLoading,
    error: slotsError,
  } = useDisponibilidad(vetId || null, date);

  const freeSlots = slots.filter((s) => s.disponible);

  useEffect(() => {
    let cancelled = false;
    Promise.all([vetApi.getDuenos(), vetApi.getVets(), vetApi.getServicios()])
      .then(([duenos, veterinarios, servicios]) => {
        if (cancelled) return;
        setOwners(duenos);
        setVets(veterinarios);
        setServices(servicios);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCatalogError(
          err instanceof Error ? err.message : "No se pudieron cargar catálogos.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ownerId) {
      setPets([]);
      return;
    }
    let cancelled = false;
    // Bypass: getMascotas está cacheada; ok para el form.
    vetApi.getMascotasDeDueno(ownerId).then((list) => {
      if (cancelled) return;
      setPets(list);
    });
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  useEffect(() => {
    if (state.ok && state.appointmentId) {
      push({ message: state.message ?? "Cita creada", tone: "success" });
      setOwnerId("");
      setVetId("");
      setDate(todayLocalISODate());
      setFormKey((k) => k + 1);
    }
  }, [state.ok, state.appointmentId, state.message, push]);

  function handleOwnerChange(event: ChangeEvent<HTMLSelectElement>) {
    setOwnerId(event.target.value);
  }

  function handleVetChange(event: ChangeEvent<HTMLSelectElement>) {
    setVetId(event.target.value);
  }

  function handleDateChange(event: ChangeEvent<HTMLInputElement>) {
    setDate(event.target.value);
  }

  const fieldClass = (name: keyof typeof state.fieldErrors) =>
    state.fieldErrors[name]
      ? `${styles.input} ${styles.inputError}`
      : styles.input;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>R16 · useFormStatus · R14</span>
        <h1 className={styles.title}>Nueva cita</h1>
        <p className={styles.lead}>
          El submit es una <strong>action</strong> (
          <code>useActionState</code>). El botón no recibe{" "}
          <code>pending</code> por props: <code>SubmitButton</code> lo lee con{" "}
          <code>useFormStatus</code> desde adentro del form.
        </p>
      </header>

      {catalogError && (
        <p className={styles.bannerError} role="alert">
          {catalogError}
        </p>
      )}

      {state.message && !state.ok && (
        <p className={styles.bannerError} role="alert">
          {state.message}
        </p>
      )}

      {state.ok && state.message && (
        <p className={styles.bannerOk} role="status">
          {state.message} {state.appointmentId && `(${state.appointmentId})`}
        </p>
      )}

      <form
        key={formKey}
        className={styles.form}
        action={formAction}
        noValidate
      >
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ownerId">
            Dueño
          </label>
          <select
            id="ownerId"
            name="ownerId"
            className={fieldClass("ownerId")}
            value={ownerId}
            onChange={handleOwnerChange}
            required
            disabled={isPending}
          >
            <option value="">Seleccioná…</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre} {o.apellido}
              </option>
            ))}
          </select>
          {state.fieldErrors.ownerId && (
            <p className={styles.error}>{state.fieldErrors.ownerId}</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="petId">
            Mascota
          </label>
          <select
            id="petId"
            name="petId"
            className={fieldClass("petId")}
            required
            disabled={isPending || !ownerId || pets.length === 0}
            defaultValue=""
          >
            <option value="">
              {!ownerId
                ? "Elegí un dueño primero"
                : pets.length === 0
                  ? "Sin mascotas"
                  : "Seleccioná…"}
            </option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.especie})
              </option>
            ))}
          </select>
          {state.fieldErrors.petId && (
            <p className={styles.error}>{state.fieldErrors.petId}</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="vetId">
            Veterinario
          </label>
          <select
            id="vetId"
            name="vetId"
            className={fieldClass("vetId")}
            value={vetId}
            onChange={handleVetChange}
            required
            disabled={isPending}
          >
            <option value="">Seleccioná…</option>
            {vets.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre} — {v.especialidad}
              </option>
            ))}
          </select>
          {state.fieldErrors.vetId && (
            <p className={styles.error}>{state.fieldErrors.vetId}</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="serviceId">
            Servicio
          </label>
          <select
            id="serviceId"
            name="serviceId"
            className={fieldClass("serviceId")}
            required
            disabled={isPending}
            defaultValue=""
          >
            <option value="">Seleccioná…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.duracionMin} min)
              </option>
            ))}
          </select>
          {state.fieldErrors.serviceId && (
            <p className={styles.error}>{state.fieldErrors.serviceId}</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="cita-date">
            Día
          </label>
          <input
            id="cita-date"
            type="date"
            className={styles.input}
            value={date}
            onChange={handleDateChange}
            disabled={isPending}
          />
          <p className={styles.hint}>
            Ancla local: {dateInputToISO(date).slice(0, 10)} (slots del vet)
          </p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="fechaHora">
            Horario disponible
          </label>
          <select
            id="fechaHora"
            name="fechaHora"
            className={fieldClass("fechaHora")}
            required
            disabled={isPending || !vetId || slotsLoading || freeSlots.length === 0}
            defaultValue=""
          >
            <option value="">
              {!vetId
                ? "Elegí un veterinario"
                : slotsLoading
                  ? "Cargando slots…"
                  : freeSlots.length === 0
                    ? "Sin slots libres"
                    : "Seleccioná…"}
            </option>
            {freeSlots.map((slot) => (
              <option key={slot.inicio} value={slot.inicio}>
                {formatSlotLabel(slot.inicio)}
              </option>
            ))}
          </select>
          {slotsError && <p className={styles.error}>{slotsError}</p>}
          {state.fieldErrors.fechaHora && (
            <p className={styles.error}>{state.fieldErrors.fechaHora}</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="motivo">
            Motivo <span className={styles.optional}>(opcional)</span>
          </label>
          <input
            id="motivo"
            name="motivo"
            type="text"
            className={styles.input}
            disabled={isPending}
            defaultValue=""
          />
        </div>

        <SubmitButton pendingLabel="Agendando…">Agendar cita</SubmitButton>
        {isPending && (
          <p className={styles.status} role="status">
            Validando disponibilidad y guardando…
          </p>
        )}
      </form>
    </section>
  );
}
