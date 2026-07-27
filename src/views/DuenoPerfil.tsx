/**
 * Perfil del dueño — mascotas + historial con `use()` + Suspense (R13).
 *
 * Responsabilidades:
 * - Leer Promises del mock con `use(promise)` (sin loading manual / useEffect).
 * - Dos `<Suspense>` independientes: mascotas (rápido) e historial (lento).
 * - Mantener Error Boundary de R10 solo alrededor del historial.
 *
 * Dependencias: React `use` + Suspense, ErrorBoundary, vetApi (cache de Promises).
 * Relación: ruta `/duenos/:ownerId`.
 *
 * Capacidad: `use` + Suspense (React 19).
 * Gotcha: la Promise DEBE ser estable (mock memoriza por clave). Crear una
 * nueva en cada render → loop infinito de suspensión.
 */

import { Suspense, use, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { vetApi } from "../data/mockApi";
import styles from "./DuenoPerfil.module.css";

/**
 * Skeleton genérico para fallbacks de Suspense.
 */
function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label={`Cargando ${label}`}>
      <div className={styles.skeletonLine} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
      <div className={styles.skeletonLine} />
    </div>
  );
}

/**
 * Cabecera del dueño — también vía `use()` (Promise cacheada `dueno:id`).
 */
function OwnerHeader({ ownerId }: { ownerId: string }) {
  const owner = use(vetApi.getDueno(ownerId));

  return (
    <header className={styles.header}>
      <span className={styles.badge}>R13 · use + Suspense · R10 · Error Boundary</span>
      <h1 className={styles.title}>
        {owner.nombre} {owner.apellido}
      </h1>
      <p className={styles.lead}>
        Mascotas e historial suspenden por separado: el mock demora ~300 ms vs
        ~900 ms. Sin <code>useEffect</code> ni flags de loading — el loading lo
        maneja Suspense.
      </p>
      <p className={styles.meta}>
        {owner.email} · {owner.telefono}
        {owner.direccion ? ` · ${owner.direccion}` : ""}
      </p>
      <Link className={styles.backLink} to="/duenos">
        ← Dueños
      </Link>
    </header>
  );
}

/**
 * Panel de mascotas — Promise estable `mascotas:ownerId`.
 */
function MascotasPanel({ ownerId }: { ownerId: string }) {
  const pets = use(vetApi.getMascotasDeDueno(ownerId));

  if (pets.length === 0) {
    return <p className={styles.status}>Sin mascotas registradas.</p>;
  }

  return (
    <ul className={styles.list}>
      {pets.map((pet) => (
        <li key={pet.id} className={styles.listItem}>
          <strong>{pet.nombre}</strong> · {pet.especie}
          {pet.raza ? ` · ${pet.raza}` : ""}
          {pet.pesoKg != null ? ` · ${pet.pesoKg} kg` : ""}
        </li>
      ))}
    </ul>
  );
}

/**
 * Panel de historial — Promise estable `historial:ownerId` (más lenta).
 * `forceCrash` demuestra el Error Boundary sin tumbar mascotas.
 */
function HistorialPanel({
  ownerId,
  forceCrash,
}: {
  ownerId: string;
  forceCrash: boolean;
}) {
  const items = use(vetApi.getHistorialCitas(ownerId));

  if (forceCrash) {
    throw new Error(
      "Error simulado en HistorialPanel (render). Las mascotas deben seguir visibles.",
    );
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
 * Contenido del perfil una vez conocido el ownerId.
 */
function DuenoPerfilContent({ ownerId }: { ownerId: string }) {
  const [forceHistorialCrash, setForceHistorialCrash] = useState(false);

  return (
    <section className={styles.page}>
      <Suspense fallback={<SectionSkeleton label="dueño" />}>
        <OwnerHeader ownerId={ownerId} />
      </Suspense>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="mascotas-title">
          <h2 id="mascotas-title" className={styles.panelTitle}>
            Mascotas
          </h2>
          <Suspense fallback={<SectionSkeleton label="mascotas" />}>
            <MascotasPanel ownerId={ownerId} />
          </Suspense>
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
            <Suspense fallback={<SectionSkeleton label="historial" />}>
              <HistorialPanel
                ownerId={ownerId}
                forceCrash={forceHistorialCrash}
              />
            </Suspense>
          </ErrorBoundary>
        </section>
      </div>
    </section>
  );
}

/**
 * Vista de perfil: lee `ownerId` de la ruta y delega en Suspense.
 */
export function DuenoPerfil() {
  const { ownerId = "" } = useParams<{ ownerId: string }>();

  if (!ownerId) {
    return <p className={styles.error}>Falta el id del dueño en la URL.</p>;
  }

  return <DuenoPerfilContent ownerId={ownerId} />;
}
