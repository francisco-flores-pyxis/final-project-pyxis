/**
 * Definición de rutas de la consola VetLab.
 *
 * Responsabilidades:
 * - Mapear URLs a vistas.
 * - Montar el layout shell alrededor de las páginas.
 *
 * Dependencias: react-router-dom, layouts, views.
 * Relación: consumido por `App.tsx`. En R12, Reportes pasará a lazy.
 */

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { Agenda } from "../views/Agenda";
import { Dashboard } from "../views/Dashboard";
import { DuenoPerfil } from "../views/DuenoPerfil";
import { Duenos } from "../views/Duenos";
import { NuevaCita } from "../views/NuevaCita";
import { NuevoDueno } from "../views/NuevoDueno";
import Reportes from "../views/Reportes";

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
          <Route path="reportes" element={<Reportes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
