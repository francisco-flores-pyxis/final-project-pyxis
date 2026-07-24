/**
 * Layout shell de la consola VetLab.
 *
 * Responsabilidades:
 * - Componer topbar + sidebar + área de contenido (`<Outlet />`).
 * - Saludar al staff y togglear tema vía Context (R05).
 *
 * Dependencias: react-router-dom, SessionContext, ThemeContext, CSS Module.
 * Relación: envuelve todas las rutas en `AppRouter`.
 *
 * No contiene lógica de negocio ni fetch.
 */

import { NavLink, Outlet } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useTheme } from "../context/ThemeContext";
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
 * Shell de aplicación con navegación lateral y topbar contextual.
 */
export function AppLayout() {
  const { staff } = useSession();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <NavLink to="/" className={styles.brand}>
          Vet<span className={styles.brandMark}>Lab</span>
        </NavLink>

        <div className={styles.topbarActions}>
          <span className={styles.staffGreeting}>
            Hola, <strong>{staff.nombre}</strong>
            <span className={styles.staffRol}> · {staff.rol}</span>
          </span>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
            aria-label={
              theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
            }
          >
            {theme === "dark" ? "Tema claro" : "Tema oscuro"}
          </button>
        </div>
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
