"use client";

import { useEffect, useRef, useState } from "react";

/** Tamaño cuadrado (px) del lado menor del contenedor, para gráficas circulares. */
export function useSquareChartSize(padding = 2) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(56);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      const height = rect.height > 0 ? rect.height : rect.width;
      let side = Math.min(rect.width, height);

      if (side <= padding + 4) {
        const card = node.closest(".chart-pastel-donut");
        if (card) {
          const cardRect = card.getBoundingClientRect();
          const labels = 28;
          side = Math.min(cardRect.width - padding * 2, cardRect.height - labels - padding);
        }
      }

      setSize(Math.max(40, Math.floor(side - padding)));
    };

    update();
    const raf1 = requestAnimationFrame(update);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(update));

    const observer = new ResizeObserver(update);
    observer.observe(node);

    const card = node.closest(".chart-pastel-donut");
    if (card) observer.observe(card);

    const gridCell = node.closest(
      ".home-charts-grid > a, .home-charts-grid > *, .distribucion-charts-grid > a, .distribucion-charts-grid > *"
    );
    if (gridCell) observer.observe(gridCell);

    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [padding]);

  return { ref, size };
}
