/**
 * Presentación interactiva del proyecto VetLab.
 *
 * Responsabilidades:
 * - Navegar slides (anterior/siguiente/directo).
 * - Mostrar progreso y contenido técnico del proyecto.
 * - Mantener una experiencia responsive con animaciones suaves.
 *
 * Dependencias: React hooks, CSS Module, contenido de `PresentationSlides`.
 * Relación: se expone como vista en el router.
 */

import { useEffect, useMemo, useState } from "react";
import { presentationSlides } from "./PresentationSlides";
import styles from "./Presentation.module.css";

const FIRST_SLIDE = 0;

function clampIndex(index: number, maxIndex: number): number {
  if (index < FIRST_SLIDE) return FIRST_SLIDE;
  if (index > maxIndex) return maxIndex;
  return index;
}

export function Presentation() {
  const [currentIndex, setCurrentIndex] = useState(FIRST_SLIDE);
  const maxIndex = presentationSlides.length - 1;
  const currentSlide = presentationSlides[currentIndex];

  const progress = useMemo(
    () => ((currentIndex + 1) / presentationSlides.length) * 100,
    [currentIndex],
  );

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setCurrentIndex((prev) => clampIndex(prev + 1, maxIndex));
      }
      if (event.key === "ArrowLeft") {
        setCurrentIndex((prev) => clampIndex(prev - 1, maxIndex));
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [maxIndex]);

  return (
    <section className={styles.page} aria-label="Presentación VetLab">
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Demo interactiva</p>
          <h1 className={styles.title}>Presentación del Proyecto VetLab</h1>
        </div>
        <p className={styles.counter}>
          Slide {currentIndex + 1} / {presentationSlides.length}
        </p>
      </header>

      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>

      <article key={currentIndex} className={styles.slide} aria-live="polite">
        <h2 className={styles.slideTitle}>{currentSlide.title}</h2>
        {currentSlide.subtitle ? (
          <p className={styles.slideSubtitle}>{currentSlide.subtitle}</p>
        ) : null}

        <ul className={styles.list}>
          {currentSlide.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        {currentSlide.code ? (
          <pre className={styles.codeBlock}>
            <code>{currentSlide.code}</code>
          </pre>
        ) : null}
      </article>

      <footer className={styles.footer}>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() =>
              setCurrentIndex((prev) => clampIndex(prev - 1, maxIndex))
            }
            disabled={currentIndex === FIRST_SLIDE}
          >
            Anterior
          </button>
          <button
            type="button"
            className={styles.navButtonPrimary}
            onClick={() =>
              setCurrentIndex((prev) => clampIndex(prev + 1, maxIndex))
            }
            disabled={currentIndex === maxIndex}
          >
            Siguiente
          </button>
        </div>

        <div className={styles.dots} aria-label="Índice de slides">
          {presentationSlides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Ir a slide ${index + 1}: ${slide.title}`}
              aria-current={index === currentIndex}
              className={
                index === currentIndex ? styles.dotActive : styles.dotButton
              }
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </footer>
    </section>
  );
}
