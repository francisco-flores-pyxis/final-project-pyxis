/**
 * Layout shell de la consola VetLab.
 *
 * Responsabilidades:
 * - Componer topbar + sidebar + área de contenido (`<Outlet />`).
 * - Ofrecer navegación entre vistas placeholder del andamiaje.
 *
 * Dependencias: react-router-dom, tokens vía CSS Module.
 * Relación: envuelve todas las rutas en `AppRouter`. Session/Theme (R05) se inyectarán aquí.
 *
 * No contiene lógica de negocio ni fetch.
 */

import { NavLink, Outlet } from "react-router-dom";
import styles from "./AppLayout.module.css";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/agenda", label: "Agenda" },
  { to: "/duenos", label: "Dueños" },
  { to: "/duenos/nuevo", label: "Nuevo dueño" },
  { to: "/citas/nueva", label: "Nueva cita" },
  { to: "/reportes", label: "Reportes" },
] as const;

/**
 * Shell de aplicación con navegación lateral.
 */
export function AppLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <NavLink to="/" className={styles.brand}>
          Vet<span className={styles.brandMark}>Lab</span>
        </NavLink>
        {/* Stub hasta R05 (SessionContext) */}
        <span className={styles.staffStub}>Staff · (sesión en R05)</span>
      </header>

      <nav className={styles.sidebar} aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={"end" in item ? item.end : false}
            className={({ isActive }) =>
              isActive
                ? `${styles.navLink} ${styles.navLinkActive}`
                : styles.navLink
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
