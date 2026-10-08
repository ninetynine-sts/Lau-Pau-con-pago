/**
 * Muelle con los parámetros de Apple: amortiguamiento (1 = sin rebote) y respuesta
 * (segundos aproximados hasta llegar). Interrumpible: cada animación nueva parte del
 * valor y la velocidad actuales, así nunca hay saltos al invertir un gesto.
 */

export type SpringOptions = {
  damping?: number; // 1 = crítico, <1 rebota
  response?: number; // segundos
  velocity?: number; // unidades/segundo al empezar
  onUpdate: (value: number, velocity: number) => void;
  onRest?: () => void;
};

export type SpringHandle = { stop: () => void };

export function animateSpring(from: number, to: number, o: SpringOptions): SpringHandle {
  const damping = o.damping ?? 1;
  const response = Math.max(0.05, o.response ?? 0.35);
  const stiffness = Math.pow((2 * Math.PI) / response, 2);
  const friction = (4 * Math.PI * damping) / response;

  let x = from;
  let v = o.velocity ?? 0;
  let last = 0;
  let raf = 0;
  let stopped = false;

  const step = (now: number) => {
    if (stopped) return;
    if (!last) last = now;
    // Pasos fijos pequeños: estable a 60 y a 120 Hz.
    let dt = Math.min(0.064, (now - last) / 1000);
    last = now;
    while (dt > 0) {
      const h = Math.min(dt, 1 / 240);
      const a = -stiffness * (x - to) - friction * v;
      v += a * h;
      x += v * h;
      dt -= h;
    }
    const settled = Math.abs(v) < 0.5 && Math.abs(x - to) < 0.5;
    if (settled) {
      o.onUpdate(to, 0);
      o.onRest?.();
      return;
    }
    o.onUpdate(x, v);
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return {
    stop: () => {
      stopped = true;
      cancelAnimationFrame(raf);
    }
  };
}

/** Dónde acabaría un gesto si siguiera con su inercia (función de Apple). */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Resistencia progresiva al pasar de un límite. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Velocidad (px/s) a partir de las últimas muestras del puntero. */
export class VelocityTracker {
  private samples: { t: number; v: number }[] = [];
  add(value: number, t = performance.now()) {
    this.samples.push({ t, v: value });
    while (this.samples.length && t - this.samples[0].t > 100) this.samples.shift();
  }
  get(): number {
    if (this.samples.length < 2) return 0;
    const a = this.samples[0];
    const b = this.samples[this.samples.length - 1];
    const dt = (b.t - a.t) / 1000;
    return dt > 0 ? (b.v - a.v) / dt : 0;
  }
  reset() {
    this.samples = [];
  }
}
