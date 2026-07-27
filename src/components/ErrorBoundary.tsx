/**
 * Error Boundary — aísla fallos de render de un subárbol (R10).
 *
 * Responsabilidades:
 * - Capturar errores de render en hijos (`getDerivedStateFromError`).
 * - Mostrar fallback con opción de retry (reset del estado interno).
 * - Loguear en `componentDidCatch` (telemetría / entrevista).
 *
 * Dependencias: React class component (los hooks no soportan error boundaries).
 * Relación: envuelve el historial en `DuenoPerfil` para que mascotas sigan vivas.
 *
 * Cuándo usarlo: secciones independientes cuyo crash no debe tumbar toda la página.
 * Limitación: no atrapa errores de event handlers ni de Promises (salvo que se
 * re-lancen en render).
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

export interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** UI de recuperación; si se omite, se usa el fallback por defecto. */
  fallback?: (props: ErrorFallbackProps) => ReactNode;
  /** Callback opcional (logging). */
  onError?: (error: Error, info: ErrorInfo) => void;
  /**
   * Si cambia, se resetea el boundary (útil al cambiar de dueño/ruta).
   * Patrón: `resetKeys={[ownerId]}`.
   */
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  error: Error | null;
}

function defaultFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className={styles.fallback} role="alert">
      <h3 className={styles.title}>No se pudo mostrar esta sección</h3>
      <p className={styles.message}>{error.message}</p>
      <button type="button" className={styles.retry} onClick={reset}>
        Reintentar
      </button>
    </div>
  );
}

function resetKeysChanged(
  prev: unknown[] | undefined,
  next: unknown[] | undefined,
): boolean {
  if (!prev || !next) return Boolean(prev || next);
  if (prev.length !== next.length) return true;
  return prev.some((value, index) => !Object.is(value, next[index]));
}

/**
 * Boundary de errores de render con fallback + retry.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    // En producción iría a un logger; acá deja rastro en consola para la demo.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error &&
      resetKeysChanged(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
    }
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error) {
      const renderFallback = this.props.fallback ?? defaultFallback;
      return renderFallback({ error, reset: this.reset });
    }
    return this.props.children;
  }
}
