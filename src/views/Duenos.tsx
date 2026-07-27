/**
 * Listado / búsqueda de dueños.
 *
 * Placeholder de R11 (useTransition). Enlace temporal al perfil demo (R10).
 */

import { Link } from "react-router-dom";
import { ViewPlaceholder } from "./ViewPlaceholder";

export function Duenos() {
  return (
    <ViewPlaceholder
      title="Dueños"
      lead="Buscador fluido: el input es urgente; el filtrado va en una transición (R11)."
      requirement="R11 · useTransition"
    >
      <p>
        Probar R10:{" "}
        <Link to="/duenos/own-1">perfil de Ana Pérez (own-1)</Link>
      </p>
    </ViewPlaceholder>
  );
}
