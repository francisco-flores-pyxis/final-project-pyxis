/**
 * Reportes / estadísticas (vista pesada).
 *
 * Placeholder. Se carga con React.lazy en R12.
 */

import { ViewPlaceholder } from "./ViewPlaceholder";

export default function Reportes() {
  return (
    <ViewPlaceholder
      title="Reportes"
      lead="Vista pesada: chunk aparte vía lazy + Suspense. Default export requerido por lazy."
      requirement="R12 · lazy + Suspense"
    />
  );
}
