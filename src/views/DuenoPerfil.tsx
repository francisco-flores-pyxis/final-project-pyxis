/**
 * Perfil del dueño — mascotas + historial (R10).
 *
 * Responsabilidades:
 * - Cargar dueño, mascotas e historial (fetch clásico; R13 pasará a `use`+Suspense).
 * - Aislar el historial con `ErrorBoundary` (fallback + retry).
 * - Demostrar que un crash en historial NO tumba la sección de mascotas.
 *
 * Dependencias: ErrorBoundary, vetApi, react-router params.
 * Relación: ruta `/duenos/:ownerId`.
 *
 * Capacidad R10: Error Boundary.
 * Supuesto: sin card detallada en §5 → checklist “historial aislado + retry”.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { vetApi } from "../data/mockApi";
import type { AppointmentView, Owner, Pet } from "../domain/models";
import styles from "./DuenoPerfil.module.css";

/**
 * Panel de historial. Puede lanzar en render para demostrar el boundary.
 */
function HistorialPanel({
  ownerId,
  forceCrash,
}: {
  ownerId: string;
  forceCrash: boolean;
}) {
  const [items, setItems] = useState<AppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    vetApi
      .getHistorialCitas(ownerId)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "No se pudo cargar el historial.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  // Los Error Boundaries atrapan errores de *render*, no de Promises.
  if (forceCrash) {
    throw new Error(
      "Error simulado en HistorialPanel (render). Las mascotas deben seguir visibles.",
    );
  }

  if (loading) {
    return <p className={styles.status}>Cargando historial…</p>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (items.length === 0) {
    return <p className={styles.status}>Sin citas en el historial.</p>;
  }

  return (
    <ul className={styles.list}>
      {items.map((cita) => (
        <li key={cita.id} className={styles.listItem}>
          <strong>
            {new Intl.DateTimeFormat("es-UY", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "America/Montevideo",
            }).format(new Date(cita.fechaHora))}
          </strong>
          <br />
          {cita.pet.nombre} · {cita.service.nombre} · {cita.estado}
        </li>
      ))}
    </ul>
  );
}

/**
 * Vista de perfil: dos columnas; solo historial está detrás del boundary.
 */
export function DuenoPerfil() {
  const { ownerId = "" } = useParams<{ ownerId: string }>();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceHistorialCrash, setForceHistorialCrash] = useState(false);

  useEffect(() => {
    if (!ownerId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setForceHistorialCrash(false);

    Promise.all([vetApi.getDueno(ownerId), vetApi.getMascotasDeDueno(ownerId)])
      .then(([dueno, mascotas]) => {
        if (cancelled) return;
        setOwner(dueno);
        setPets(mascotas);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "No se pudo cargar el perfil.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  if (!ownerId) {
    return <p className={styles.error}>Falta el id del dueño en la URL.</p>;
  }

  if (loading) {
    return (
      <section className={styles.page}>
        <p className={styles.status}>Cargando perfil…</p>
      </section>
    );
  }

  if (error || !owner) {
    return (
      <section className={styles.page}>
        <p className={styles.error}>{error ?? "Dueño no encontrado."}</p>
        <Link className={styles.backLink} to="/duenos">
          ← Volver a dueños
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>R10 · Error Boundary</span>
        <h1 className={styles.title}>
          {owner.nombre} {owner.apellido}
        </h1>
        <p className={styles.lead}>
          El historial está envuelto en un Error Boundary: si crashea el render,
          las mascotas siguen visibles y podés reintentar.
        </p>
        <p className={styles.meta}>
          {owner.email} · {owner.telefono}
          {owner.direccion ? ` · ${owner.direccion}` : ""}
        </p>
        <Link className={styles.backLink} to="/duenos">
          ← Dueños
        </Link>
      </header>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="mascotas-title">
          <h2 id="mascotas-title" className={styles.panelTitle}>
            Mascotas
          </h2>
          {pets.length === 0 ? (
            <p className={styles.status}>Sin mascotas registradas.</p>
          ) : (
            <ul className={styles.list}>
              {pets.map((pet) => (
                <li key={pet.id} className={styles.listItem}>
                  <strong>{pet.nombre}</strong> · {pet.especie}
                  {pet.raza ? ` · ${pet.raza}` : ""}
                  {pet.pesoKg != null ? ` · ${pet.pesoKg} kg` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="historial-title">
          <h2 id="historial-title" className={styles.panelTitle}>
            Historial de citas
          </h2>
          <button
            type="button"
            className={styles.demoBtn}
            onClick={() => setForceHistorialCrash(true)}
          >
            Simular crash del historial
          </button>

          <ErrorBoundary
            resetKeys={[ownerId]}
            fallback={({ error, reset }) => (
              <div role="alert">
                <p className={styles.error}>{error.message}</p>
                <button
                  type="button"
                  className={styles.demoBtn}
                  onClick={() => {
                    setForceHistorialCrash(false);
                    reset();
                  }}
                >
                  Reintentar historial
                </button>
              </div>
            )}
          >
            <HistorialPanel
              ownerId={ownerId}
              forceCrash={forceHistorialCrash}
            />
          </ErrorBoundary>
        </section>
      </div>
    </section>
  );
}
