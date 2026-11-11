import { useEffect, useMemo, useRef } from 'react';
import { reducedMotion } from '../lib/fx';

const pt = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
const circle = (cx: number, cy: number, r: number) =>
  `M${(cx + r).toFixed(2)},${cy.toFixed(2)}A${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(cx - r).toFixed(2)},${cy.toFixed(2)}A${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(cx + r).toFixed(2)},${cy.toFixed(2)}Z`;

/** Engranaje de dientes exteriores. */
export function gearPath(teeth: number, toothH = 20, hole = 0.3, module = 14) {
  const R = (teeth * module) / 2;
  const ro = R + toothH / 2;
  const rr = R - toothH / 2;
  const p = (Math.PI * 2) / teeth;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * p;
    d += `${i ? 'L' : 'M'}${pt(rr, a - 0.27 * p)}L${pt(ro, a - 0.14 * p)}L${pt(ro, a + 0.14 * p)}L${pt(rr, a + 0.27 * p)}`;
  }
  d += 'Z' + circle(0, 0, R * hole);
  const n = teeth >= 16 ? 6 : 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / n;
    d += circle(R * 0.62 * Math.cos(a), R * 0.62 * Math.sin(a), R * 0.14);
  }
  return { d, R, ro };
}

/** Corona: anillo con los dientes hacia adentro. */
function ringPath(teeth: number, toothH: number, rim: number, module: number) {
  const R = (teeth * module) / 2;
  const tip = R - toothH / 2;
  const root = R + toothH / 2;
  const ro = root + rim;
  const p = (Math.PI * 2) / teeth;
  let d = circle(0, 0, ro);
  for (let i = 0; i < teeth; i++) {
    const a = i * p;
    d += `${i ? 'L' : 'M'}${pt(root, a - 0.27 * p)}L${pt(tip, a - 0.14 * p)}L${pt(tip, a + 0.14 * p)}L${pt(root, a + 0.27 * p)}`;
  }
  return { d: d + 'Z', R, ro };
}

// Juego planetario: sol (16) + 4 satélites (12) + corona (40 = 16 + 2·12).
// Los satélites no se trasladan; el sol mueve a los satélites y estos a la corona.
const M = 12, TOOTH = 15, SUN = 16, PLANET = 12, RING = 40;
const LAYERS = 6, STEP = 5;

type Spec = { kind: 'sun' | 'planet' | 'ring'; tone: string; x: number; y: number; phi: number; k: number; d: string; size: number; R: number };

function buildSet(): Spec[] {
  const sun = gearPath(SUN, TOOTH, 0.26, M);
  const planet = gearPath(PLANET, TOOTH, 0.3, M);
  const ring = ringPath(RING, TOOTH, 30, M);
  const dist = ((SUN + PLANET) * M) / 2;
  const tones = ['coral', 'mint', 'sky', 'gold'];
  const planets: Spec[] = [0, 90, 180, 270].map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    return {
      kind: 'planet', tone: tones[i], x: dist * Math.cos(a), y: dist * Math.sin(a),
      phi: deg + 180 - 180 / PLANET, k: -SUN / PLANET, d: planet.d, size: planet.ro * 2 + 4, R: planet.R,
    };
  });
  return [
    { kind: 'ring', tone: 'ink', x: 0, y: 0, phi: 0, k: -SUN / RING, d: ring.d, size: ring.ro * 2 + 4, R: ring.R },
    { kind: 'sun', tone: 'core', x: 0, y: 0, phi: 0, k: 1, d: sun.d, size: sun.ro * 2 + 4, R: sun.R },
    ...planets,
  ];
}

const GRADS: Record<string, [string, string]> = {
  ink: ['#2a2a6b', '#0f0f33'],
  core: ['#ff4fa3', '#ff8a3d'],
  coral: ['#ff7a59', '#ff3d81'],
  mint: ['#35e0a1', '#12b5c9'],
  sky: ['#4cc3ff', '#5b5bff'],
  gold: ['#ffd24a', '#ff9f1a'],
};

function Gear({ spec, index }: { spec: Spec; index: number }) {
  const vb = `${-spec.size / 2} ${-spec.size / 2} ${spec.size} ${spec.size}`;
  const gid = `gear-grad-${index}`;
  const [c1, c2] = GRADS[spec.tone];
  return (
    <div
      className={`gear gear--${spec.kind} gear--${spec.tone}`}
      style={{
        left: `calc(50% + ${spec.x}px)`, top: `calc(50% + ${spec.y}px)`, width: spec.size, height: spec.size,
        ['--phi' as any]: `${spec.phi}deg`, ['--k' as any]: spec.k,
      }}
    >
      <svg className="gear__shadow" viewBox={vb} style={{ transform: 'translateZ(-22px) scale(1.05)' }}>
        <path d={spec.d} fillRule="evenodd" />
      </svg>
      {Array.from({ length: LAYERS }, (_, i) => {
        const top = i === LAYERS - 1;
        return (
          <svg key={i} className={top ? 'gear__face' : 'gear__side'} viewBox={vb} style={{ transform: `translateZ(${i * STEP}px)` }}>
            {top && (
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={c1} />
                  <stop offset="1" stopColor={c2} />
                </linearGradient>
              </defs>
            )}
            <path d={spec.d} fillRule="evenodd" fill={top ? `url(#${gid})` : undefined} />
            {top && spec.kind !== 'ring' && <circle r={spec.R * 0.42} className="gear__detail" />}
            {top && spec.kind === 'ring' && (
              <>
                <circle r={spec.size / 2 - 14} className="gear__detail gear__detail--dash" />
                <circle r={spec.size / 2 - 4} className="gear__detail" />
              </>
            )}
          </svg>
        );
      })}
    </div>
  );
}

/**
 * Engranaje planetario en 3D. Gira solo, se inclina con el cursor, acelera con
 * el scroll y se puede arrastrar para lanzarlo con inercia.
 */
export default function Gears() {
  const ref = useRef<HTMLDivElement>(null);
  const set = useMemo(buildSet, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('ResizeObserver' in window)) return;
    const ro = new ResizeObserver(([entry]) => {
      el.style.setProperty('--s', (entry.contentRect.width / 640).toFixed(3));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const still = reducedMotion();
    const IDLE = 16; // grados por segundo en reposo
    let angle = 0, vel = IDLE, dir = 1;
    let dragging = false, lastA = 0, lastT = 0, lastScroll = window.scrollY;
    let tx = 0, ty = 0, mx = 0, my = 0, raf = 0, prev = performance.now(), visible = true;

    const pointerAngle = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
    };
    const paint = () => el.style.setProperty('--a', `${angle.toFixed(2)}deg`);

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastA = pointerAngle(e);
      lastT = performance.now();
      vel = 0;
      el.classList.add('is-grabbing', 'is-touched');
      el.setPointerCapture?.(e.pointerId);
    };
    const onDrag = (e: PointerEvent) => {
      if (!dragging) return;
      const a = pointerAngle(e);
      let delta = a - lastA;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const now = performance.now();
      const dt = Math.max(8, now - lastT) / 1000;
      angle += delta;
      vel = vel * 0.6 + (delta / dt) * 0.4;
      lastA = a;
      lastT = now;
      if (still) paint();
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-grabbing');
      vel = Math.max(-900, Math.min(900, vel));
      if (Math.abs(vel) > 30) dir = Math.sign(vel);
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (!dragging) vel = Math.max(-900, Math.min(900, vel + (y - lastScroll) * 0.5 * dir));
      lastScroll = y;
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (visible) {
        if (!dragging) {
          vel += (IDLE * dir - vel) * Math.min(1, dt * 1.1); // la inercia vuelve suave al giro de reposo
          angle += vel * dt;
        }
        mx += (tx - mx) * 0.06;
        my += (ty - my) * 0.06;
        paint();
        el.style.setProperty('--mx', mx.toFixed(4));
        el.style.setProperty('--my', my.toFixed(4));
      }
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(el);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onDrag);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    paint();
    if (!still) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      raf = requestAnimationFrame(loop);
    }
    return () => {
      io.disconnect();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onDrag);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="gears" ref={ref} role="img" aria-label="Engranaje planetario interactivo: arrástralo para girarlo">
      <div className="gears__stage">
        <div className="gears__plane">
          <div className="gears__floor" />
          <div className="gears__halo" />
          {set.map((g, i) => (
            <Gear key={i} spec={g} index={i} />
          ))}
        </div>
      </div>
      <span className="gears__hint" aria-hidden="true">Arrástralo para girarlo</span>
    </div>
  );
}

/** Marca: engranaje pequeño para el logo. */
export function GearMark({ size = 34 }: { size?: number }) {
  const { d, ro } = useMemo(() => gearPath(9, 16, 0.36), []);
  const s = ro * 2 + 2;
  return (
    <svg className="gear-mark" width={size} height={size} viewBox={`${-s / 2} ${-s / 2} ${s} ${s}`} aria-hidden="true">
      <defs>
        <linearGradient id="gm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4A3AFF" />
          <stop offset="1" stopColor="#00C2D1" />
        </linearGradient>
      </defs>
      <path d={d} fill="url(#gm)" fillRule="evenodd" />
    </svg>
  );
}
