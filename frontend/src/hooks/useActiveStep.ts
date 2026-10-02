import { useEffect, useRef, useState } from "react";

/**
 * Tracks which of N blocks sits in the reading band of the viewport.
 * Step activation (not scroll scrubbing): zero per-frame JS, interruptible,
 * and degrades to a static stack when the stage is hidden.
 */
export function useActiveStep<T extends HTMLElement = HTMLElement>(count: number) {
  const refs = useRef<(T | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const nodes = refs.current.slice(0, count).filter((n): n is T => !!n);
    if (nodes.length === 0 || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number((entry.target as HTMLElement).dataset.step);
          if (!Number.isNaN(idx)) setActive(idx);
        }
      },
      // A thin band 40% down the viewport: one step is active at a time.
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [count]);

  const register = (i: number) => (el: T | null) => {
    refs.current[i] = el;
  };

  return { active, register, setActive };
}
