/**
 * Definición de rutas de la consola VetLab.
 *
 * Responsabilidades:
 * - Mapear URLs a vistas.
 * - Code-splitting de Reportes con `lazy` + `Suspense` (R12).
 *
 * Dependencias: react-router-dom, layouts, views.
 * Relación: consumido por `App.tsx`.
 */

import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { Agenda } from "../views/Agenda";
import { Dashboard } from "../views/Dashboard";
import { DuenoPerfil } from "../views/DuenoPerfil";
import { Duenos } from "../views/Duenos";
import { NuevaCita } from "../views/NuevaCita";
import { NuevoDueno } from "../views/NuevoDueno";
import fallbackStyles from "./ReportesFallback.module.css";

/**
 * Chunk separado: solo se descarga al navegar a /reportes.
 * Requiere default export en `views/Reportes`.
 */
const Reportes = lazy(() => import("../views/Reportes"));

function ReportesFallback() {
  return (
    <p className={fallbackStyles.fallback} role="status">
      Cargando módulo de Reportes…
    </p>
  );
}

/**
 * Router de la aplicación (BrowserRouter + Routes).
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="duenos" element={<Duenos />} />
          <Route path="duenos/nuevo" element={<NuevoDueno />} />
          <Route path="duenos/:ownerId" element={<DuenoPerfil />} />
          <Route path="citas/nueva" element={<NuevaCita />} />
          <Route
            path="reportes"
            element={
              <Suspense fallback={<ReportesFallback />}>
                <Reportes />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
