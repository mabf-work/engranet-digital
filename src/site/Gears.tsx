import { useEffect, useMemo, useRef } from 'react';
import { reducedMotion } from '../lib/fx';

const MODULE = 14; // px por diente: todos los engranajes comparten módulo para que encajen

export function gearPath(teeth: number, toothH = 20, hole = 0.3) {
  const R = (teeth * MODULE) / 2;
  const ro = R + toothH / 2;
  const rr = R - toothH / 2;
  const p = (Math.PI * 2) / teeth;
  const pt = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * p;
    d += `${i ? 'L' : 'M'}${pt(rr, a - 0.27 * p)}L${pt(ro, a - 0.14 * p)}L${pt(ro, a + 0.14 * p)}L${pt(rr, a + 0.27 * p)}`;
  }
  d += 'Z';
  const h = R * hole;
  d += `M${h},0A${h},${h} 0 1,0 ${-h},0A${h},${h} 0 1,0 ${h},0Z`;
  // aligeramientos: círculos entre el eje y los dientes
  const n = teeth >= 16 ? 6 : 5;
  const cr = R * 0.14;
  const cd = R * 0.62;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / n;
    const cx = cd * Math.cos(a), cy = cd * Math.sin(a);
    d += `M${(cx + cr).toFixed(2)},${cy.toFixed(2)}A${cr.toFixed(2)},${cr.toFixed(2)} 0 1,0 ${(cx - cr).toFixed(2)},${cy.toFixed(2)}A${cr.toFixed(2)},${cr.toFixed(2)} 0 1,0 ${(cx + cr).toFixed(2)},${cy.toFixed(2)}Z`;
  }
  return { d, R, ro };
}

type GearSpec = { teeth: number; x: number; y: number; phi: number; dur: number; reverse: boolean; tone: string; layers: number; lift: number };

function buildTrain(): GearSpec[] {
  const A = 20, B = 12, C = 10, D = 14;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const pitch = (n: number) => (n * MODULE) / 2;
  const base = 44; // segundos por vuelta del engranaje principal
  // B y C engranan con A; D engrana con B. Los ángulos caen sobre un diente de la rueda motriz.
  const thB = -36, thC = 144, thD = 9;
  const bx = (pitch(A) + pitch(B)) * Math.cos(rad(thB)), by = (pitch(A) + pitch(B)) * Math.sin(rad(thB));
  const cx = (pitch(A) + pitch(C)) * Math.cos(rad(thC)), cy = (pitch(A) + pitch(C)) * Math.sin(rad(thC));
  const dx = bx + (pitch(B) + pitch(D)) * Math.cos(rad(thD)), dy = by + (pitch(B) + pitch(D)) * Math.sin(rad(thD));
  return [
    { teeth: A, x: 0, y: 0, phi: 0, dur: base, reverse: false, tone: 'pearl', layers: 9, lift: 0 },
    { teeth: B, x: bx, y: by, phi: thB + 180 - 180 / B, dur: (base * B) / A, reverse: true, tone: 'violet', layers: 9, lift: 0 },
    { teeth: C, x: cx, y: cy, phi: thC + 180 - 180 / C, dur: (base * C) / A, reverse: true, tone: 'cyan', layers: 9, lift: 0 },
    { teeth: D, x: dx, y: dy, phi: thD + 180 - 180 / D, dur: (base * D) / A, reverse: false, tone: 'amber', layers: 9, lift: 0 },
  ];
}

function Gear({ spec }: { spec: GearSpec }) {
  const { d, R, ro } = useMemo(() => gearPath(spec.teeth), [spec.teeth]);
  const size = ro * 2 + 4;
  const vb = `${-size / 2} ${-size / 2} ${size} ${size}`;
  return (
    <div
      className={`gear gear--${spec.tone}`}
      style={{
        left: `calc(50% + ${spec.x}px)`,
        top: `calc(50% + ${spec.y}px)`,
        width: size,
        height: size,
        ['--phi' as any]: `${spec.phi}deg`,
        animationDuration: `${spec.dur}s`,
        animationDirection: spec.reverse ? 'reverse' : 'normal',
      }}
    >
      <svg className="gear__shadow" viewBox={vb} style={{ transform: 'translateZ(-26px) scale(1.06)' }}>
        <path d={d} fillRule="evenodd" />
      </svg>
      {Array.from({ length: spec.layers }, (_, i) => {
        const top = i === spec.layers - 1;
        return (
          <svg key={i} className={top ? 'gear__face' : 'gear__side'} viewBox={vb} style={{ transform: `translateZ(${spec.lift + i * 4.5}px)` }}>
            <path d={d} fillRule="evenodd" />
            {top && (
              <>
                <circle r={R * 0.84} className="gear__ring" />
                <circle r={R * 0.4} className="gear__ring" />
              </>
            )}
          </svg>
        );
      })}
    </div>
  );
}

/** Tren de engranajes en 3D que gira encajado y se inclina con el cursor. */
export default function Gears() {
  const ref = useRef<HTMLDivElement>(null);
  const train = useMemo(buildTrain, []);

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
    if (!el || reducedMotion()) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };
    const loop = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.setProperty('--mx', x.toFixed(4));
      el.style.setProperty('--my', y.toFixed(4));
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="gears" ref={ref} aria-hidden="true">
      <div className="gears__stage">
        <div className="gears__plane">
          <div className="gears__floor" />
          <div className="gears__orbit" />
          {train.map((g, i) => (
            <Gear key={i} spec={g} />
          ))}
        </div>
      </div>
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
