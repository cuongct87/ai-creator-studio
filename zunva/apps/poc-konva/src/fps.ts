import { useEffect, useRef, useState } from 'react';

export interface FpsStats {
  /** Frames per second over the last 0.5 s. */
  now: number;
  /** Lowest 0.5 s window while the user was interacting (drag, transform, pinch). */
  minWhileInteracting: number | null;
  /** Average FPS over all interaction windows. */
  avgWhileInteracting: number | null;
}

/** FPS meter based on requestAnimationFrame. Call setInteracting(true/false) around drags. */
export function useFps() {
  const [stats, setStats] = useState<FpsStats>({ now: 0, minWhileInteracting: null, avgWhileInteracting: null });
  const interacting = useRef(false);
  const minRef = useRef<number | null>(null);
  const sum = useRef({ fps: 0, windows: 0 });

  useEffect(() => {
    let frames = 0;
    let windowStart = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      frames++;
      const elapsed = t - windowStart;
      if (elapsed >= 500) {
        const fps = Math.round((frames * 1000) / elapsed);
        if (interacting.current) {
          minRef.current = minRef.current === null ? fps : Math.min(minRef.current, fps);
          sum.current.fps += fps;
          sum.current.windows++;
        }
        const avg = sum.current.windows ? Math.round(sum.current.fps / sum.current.windows) : null;
        setStats({ now: fps, minWhileInteracting: minRef.current, avgWhileInteracting: avg });
        frames = 0;
        windowStart = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setInteracting = (value: boolean) => {
    interacting.current = value;
  };
  const reset = () => {
    minRef.current = null;
    sum.current = { fps: 0, windows: 0 };
  };
  return { stats, setInteracting, reset };
}
