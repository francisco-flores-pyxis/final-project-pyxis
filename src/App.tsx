/**
 * Raíz de composición de VetLab.
 *
 * Responsabilidades:
 * - Montar el router.
 * - (Futuro R05) Envolver providers de sesión y tema.
 *
 * No contiene lógica de negocio.
 */

import { AppRouter } from "./routes/AppRouter";

function App() {
  return <AppRouter />;
}

export default App;
