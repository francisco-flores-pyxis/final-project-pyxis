/**
 * Definición de slides de la presentación interactiva de VetLab.
 *
 * Responsabilidades:
 * - Centralizar contenido narrativo (títulos, bullets y snippets).
 * - Mantener separado el contenido de la lógica de navegación.
 *
 * Dependencias: ninguna.
 * Relación: consumido por `Presentation.tsx`.
 */

export interface PresentationSlide {
  title: string;
  subtitle?: string;
  bullets: string[];
  code?: string;
}

const DOMAIN_DIAGRAM = `Owner (1) ──── (*) Pet
   │                 │
   │                 └──── (*) Appointment (*) ──── (1) Vet
   └────────────────────────(*) Appointment (*) ──── (1) Service`;

export const presentationSlides: PresentationSlide[] = [
  {
    title: "Proyecto VetLab",
    subtitle: "Consola de Agenda Veterinaria",
    bullets: [
      "Presentación interactiva del laboratorio React 19 + TypeScript strict.",
      "Objetivo: mostrar arquitectura, decisiones y capacidades de React aplicadas.",
      "Pensada para recepción y veterinarios en operación diaria.",
    ],
  },
  {
    title: "Visión General",
    bullets: [
      "VetLab organiza citas, dueños, mascotas, disponibilidad y estado clínico.",
      "Actor Recepción: agenda, confirma, cancela y registra nuevos dueños.",
      "Actor Veterinarios: consulta agenda diaria, historial y contexto de atención.",
    ],
  },
  {
    title: "Stack & Arquitectura",
    bullets: [
      "Stack: React 19, TypeScript strict, Vite, react-router-dom 7.",
      "UI: CSS Modules + design tokens (`src/styles/tokens.css`).",
      "Capas: domain models, mock API, context global, hooks, componentes y rutas/layouts.",
    ],
    code: `// App.tsx
<AppProviders>
  <AppRouter />
</AppProviders>`,
  },
  {
    title: "R01 · useState (formularios controlados)",
    bullets: [
      "Estado local para inputs y validación incremental.",
      "Se usa en alta de dueño/mascota y filtros de vistas.",
      "Permite UX inmediata y mensajes claros por campo.",
    ],
    code: `const [date, setDate] = useState(todayLocalISODate);
<input type="date" value={date} onChange={(e) => setDate(e.target.value)} />`,
  },
  {
    title: "R02 · useEffect (citas del día + cleanup)",
    bullets: [
      "Sincroniza datos asíncronos de agenda por fecha.",
      "Incluye cleanup para evitar fugas y estados obsoletos.",
      "Demuestra ciclo de vida declarativo en React.",
    ],
    code: `useEffect(() => {
  mockConfig.mutationFailRate = failDemo ? 0.45 : 0;
  return () => {
    mockConfig.mutationFailRate = 0;
  };
}, [failDemo]);`,
  },
  {
    title: "R03 · useRef",
    bullets: [
      "Referencia mutable sin re-render para interacción imperativa.",
      "Útil para foco, scroll o medición de nodos en UI dinámica.",
      "Complementa state cuando el valor no afecta render visual.",
    ],
  },
  {
    title: "R04 · useReducer (wizard)",
    bullets: [
      "Maneja estado complejo paso a paso en alta de dueño + mascota.",
      "Acciones tipadas y transiciones previsibles.",
      "Reduce acoplamiento frente a múltiples useState sueltos.",
    ],
  },
  {
    title: "R05 · useContext (sesión + tema)",
    bullets: [
      "SessionContext comparte identidad/rol del staff.",
      "ThemeContext centraliza tema claro/oscuro de toda la app.",
      "Evita prop drilling y mantiene consistencia global.",
    ],
    code: `const { staff } = useSession();
const { theme, toggleTheme } = useTheme();`,
  },
  {
    title: "R06 · Custom Hooks",
    bullets: [
      "Hooks como `useCitas` y `useDisponibilidad` encapsulan lectura de datos.",
      "Separan lógica de negocio/UI y facilitan reuso.",
      "Cada vista consume una API declarativa y simple.",
    ],
  },
  {
    title: "R07 · useMemo/useCallback/memo",
    bullets: [
      "Memoización de filtros, ordenamientos y handlers costosos.",
      "Reduce renders innecesarios en listas y filas de citas.",
      "Mejora performance sin sacrificar legibilidad.",
    ],
    code: `const visibleCitas = useMemo(
  () => applyListTransforms(optimisticCitas, estadoFiltro, orden),
  [optimisticCitas, estadoFiltro, orden],
);`,
  },
  {
    title: "R08 · Keys y reconciliación",
    bullets: [
      "Se evidencia el bug de `key` por índice para fines didácticos.",
      "Uso correcto: `key={id}` para preservar identidad de filas.",
      "Demuestra cómo React reconcilia listas dinámicas.",
    ],
    code: `<CitaRow key={useIndexKeys ? index : cita.id} ... />`,
  },
  {
    title: "R09 · createPortal (modals/toasts)",
    bullets: [
      "Modales y toasts se renderizan fuera del árbol visual principal.",
      "Mejora stacking context y accesibilidad de overlays.",
      "Evita conflictos de layout y z-index.",
    ],
  },
  {
    title: "R10 · Error Boundaries",
    bullets: [
      "Aíslan fallos de render en segmentos concretos de la interfaz.",
      "Previenen caída completa de la SPA por errores locales.",
      "Permiten fallback funcional y recuperación guiada.",
    ],
  },
  {
    title: "R11 · useTransition",
    bullets: [
      "Marca actualizaciones no urgentes para UX más fluida.",
      "Mantiene interacciones responsivas durante mutaciones.",
      "Se combina con feedback visual de estado pendiente.",
    ],
    code: `const [isPending, startTransition] = useTransition();
startTransition(async () => {
  addOptimistic({ id, estado });
  await cambiarEstadoCitaAction(...);
});`,
  },
  {
    title: "R12 · lazy + Suspense",
    bullets: [
      "Carga diferida de módulo Reportes para optimizar tiempo inicial.",
      "Fallback de carga explícito para experiencia consistente.",
      "Code splitting nativo con React Router.",
    ],
    code: `const Reportes = lazy(() => import("../views/Reportes"));`,
  },
  {
    title: "R13 · use() + Suspense",
    bullets: [
      "Lecturas cacheadas en Mock API preparadas para `use()`.",
      "Promesas memoizadas evitan loops de Suspense por render.",
      "Boundaries independientes para secciones con latencias distintas.",
    ],
    code: `const promiseCache = new Map<string, Promise<unknown>>();
function cached<T>(key: string, factory: () => Promise<T>): Promise<T> { ... }`,
  },
  {
    title: "R14 · useActionState",
    bullets: [
      "Gestiona estado de acciones de formulario con patrón declarativo.",
      "Canal único para éxito/error/mensajes de submit.",
      "Mejora trazabilidad y consistencia de validaciones.",
    ],
  },
  {
    title: "R15 · useOptimistic",
    bullets: [
      "Actualiza estado visual de cita al instante en dashboard.",
      "Si falla el mock, React hace rollback al estado confirmado.",
      "UX veloz con integridad de datos preservada.",
    ],
  },
  {
    title: "R16 · useFormStatus",
    bullets: [
      "Controla estado pending de formularios anidados.",
      "Feedback inmediato en botones de envío.",
      "Evita doble submit y mejora accesibilidad percibida.",
    ],
  },
  {
    title: "Entidades del Dominio",
    bullets: [
      "Entidades núcleo: Owner, Pet, Vet, Service, Appointment.",
      "Types strict + relaciones explícitas por id.",
      "`AppointmentView` enriquece joins para consumo de UI.",
    ],
    code: DOMAIN_DIAGRAM,
  },
  {
    title: "Reglas de Negocio",
    bullets: [
      "No solapamiento de citas activas para el mismo veterinario.",
      "Disponibilidad calculada por franjas horarias + bloqueos ocupados.",
      "Ciclo de vida de cita: pendiente → confirmada/completada/cancelada.",
    ],
    code: `function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}`,
  },
  {
    title: "Características Principales",
    bullets: [
      "Dashboard de citas del día con acciones rápidas.",
      "Agendamiento, gestión de dueños, historial de mascotas y búsqueda.",
      "Reportes y vistas de soporte para operación clínica diaria.",
    ],
  },
  {
    title: "Resumen / Conclusión",
    bullets: [
      "VetLab demuestra dominio práctico de React 19 en un caso real.",
      "Arquitectura modular, tipada y preparada para escalar a backend real.",
      "Base sólida para entrevistas técnicas y evolución del producto.",
    ],
  },
];
