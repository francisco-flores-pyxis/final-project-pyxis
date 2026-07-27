/**
 * Buscador de dueños — input urgente + filtrado en transición (R11).
 *
 * Responsabilidades:
 * - Cargar dueños del mock.
 * - Actualizar el input de forma urgente (`useState`).
 * - Aplicar el filtro en una transición (`startTransition`) y mostrar `isPending`.
 *
 * Dependencias: useTransition, vetApi, Link a perfil (R10).
 * Relación: ruta `/duenos`.
 *
 * Hook: useTransition.
 * Gotcha: NUNCA envolver el setState del valor del input en la transición.
 */

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { Link } from "react-router-dom";
import { vetApi } from "../data/mockApi";
import type { Owner } from "../domain/models";
import styles from "./Duenos.module.css";

/** Cuántas veces se replica el seed para simular una lista grande. */
const LIST_MULTIPLIER = 80;

/**
 * Trabajo CPU artificial por ítem — hace visible `isPending` en demos locales.
 * En producción el costo vendría de filtrar miles de registros reales.
 */
function burnCpu(iterations: number): void {
  let acc = 0;
  for (let i = 0; i < iterations; i += 1) {
    acc += Math.sqrt(i);
  }
  if (acc < 0) {
    // Evita que el motor elimine el loop como dead code.
    console.log(acc);
  }
}

/**
 * Expande el catálogo sembrado a una lista grande con ids únicos.
 */
function expandOwners(seed: Owner[]): Owner[] {
  const expanded: Owner[] = [];
  for (let copy = 0; copy < LIST_MULTIPLIER; copy += 1) {
    for (const owner of seed) {
      expanded.push({
        ...owner,
        id: copy === 0 ? owner.id : `${owner.id}-x${copy}`,
        // Variamos un poco el apellido para que no sea una lista idéntica.
        apellido: copy === 0 ? owner.apellido : `${owner.apellido} ${copy}`,
      });
    }
  }
  return expanded;
}

/**
 * Filtrado costoso a propósito (demo de concurrencia).
 */
function filterOwnersExpensive(owners: Owner[], query: string): Owner[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    // Incluso sin query hacemos un pase liviano sobre la lista expandida.
    burnCpu(2_000);
    return owners;
  }

  const result: Owner[] = [];
  for (const owner of owners) {
    burnCpu(250);
    const haystack =
      `${owner.nombre} ${owner.apellido} ${owner.email} ${owner.telefono}`.toLowerCase();
    if (haystack.includes(q)) {
      result.push(owner);
    }
  }
  return result;
}

/**
 * Vista de búsqueda de dueños con UI no bloqueante.
 */
export function Duenos() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Valor del input — update URGENTE (nunca dentro de startTransition). */
  const [inputValue, setInputValue] = useState("");
  /** Query que alimenta el filtro — update en transición. */
  const [filterQuery, setFilterQuery] = useState("");

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    vetApi
      .getDuenos()
      .then((data) => {
        if (cancelled) return;
        setOwners(expandOwners(data));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar los dueños.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => filterOwnersExpensive(owners, filterQuery),
    [owners, filterQuery],
  );

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    // 1) Urgente: el input refleja la tecla al instante.
    setInputValue(value);
    // 2) Transición: el filtrado pesado puede esperar / interrumpirse.
    startTransition(() => {
      setFilterQuery(value);
    });
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>R11 · useTransition</span>
        <h1 className={styles.title}>Dueños</h1>
        <p className={styles.lead}>
          El input se actualiza urgente; el filtrado (lista ~{LIST_MULTIPLIER}×
          seed, CPU artificial) corre en una transición. Mientras tanto se
          muestra <code>isPending</code>.
        </p>
      </header>

      <div className={styles.searchRow}>
        <label className={styles.label} htmlFor="duenos-search">
          Buscar
        </label>
        <input
          id="duenos-search"
          className={styles.input}
          type="search"
          value={inputValue}
          onChange={handleSearchChange}
          placeholder="Nombre, email, teléfono…"
          autoComplete="off"
        />
        <p className={styles.pending} role="status" aria-live="polite">
          {isPending ? "Actualizando resultados…" : "\u00a0"}
        </p>
      </div>

      {loading && <p className={styles.status}>Cargando dueños…</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <p className={styles.summary}>
            Catálogo: <strong>{owners.length}</strong> · Coincidencias:{" "}
            <strong>{filtered.length}</strong>
            {inputValue !== filterQuery && " (lista atrasada respecto al input)"}
          </p>

          {filtered.length === 0 ? (
            <p className={styles.empty}>Sin resultados para “{filterQuery}”.</p>
          ) : (
            <ul
              className={
                isPending ? `${styles.list} ${styles.listPending}` : styles.list
              }
            >
              {filtered.map((owner) => {
                const profileId = owner.id.replace(/-x\d+$/, "");
                return (
                  <li key={owner.id}>
                    <Link className={styles.item} to={`/duenos/${profileId}`}>
                      <p className={styles.itemName}>
                        {owner.nombre} {owner.apellido}
                      </p>
                      <p className={styles.itemMeta}>
                        {owner.email} · {owner.telefono}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
