/**
 * Raíz de composición de VetLab.
 *
 * Responsabilidades:
 * - Envolver la app con providers de sesión y tema (R05).
 * - Montar el router.
 *
 * No contiene lógica de negocio.
 */

import { AppProviders } from "./context/AppProviders";
import { AppRouter } from "./routes/AppRouter";

function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}

export default App;
