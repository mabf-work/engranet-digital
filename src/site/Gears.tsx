import { useEffect, useMemo, useRef } from 'react';
import { reducedMotion } from '../lib/fx';

const pt = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
const circle = (cx: number, cy: number, r: number) =>
  `M${(cx + r).toFixed(2)},${cy.toFixed(2)}A${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(cx - r).toFixed(2)},${cy.toFixed(2)}A${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(cx + r).toFixed(2)},${cy.toFixed(2)}Z`;

/** Contorno de un engranaje. `holes` es la cantidad de aligeramientos circulares. */
export function gearPath(teeth: number, toothH = 20, hole = 0.3, module = 14, holes = teeth >= 16 ? 6 : 5) {
  const R = (teeth * module) / 2;
  const ro = R + toothH / 2;
  const rr = R - toothH / 2;
  const p = (Math.PI * 2) / teeth;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * p;
    d += `${i ? 'L' : 'M'}${pt(rr, a - 0.27 * p)}L${pt(ro, a - 0.15 * p)}L${pt(ro, a + 0.15 * p)}L${pt(rr, a + 0.27 * p)}`;
  }
  d += 'Z';
  if (hole > 0) d += circle(0, 0, R * hole);
  for (let i = 0; i < holes; i++) {
    const a = (i / holes) * Math.PI * 2 + Math.PI / holes;
    d += circle(R * 0.62 * Math.cos(a), R * 0.62 * Math.sin(a), R * 0.14);
  }
  return { d, R, ro, rr };
}

// Tres engranajes de metal vistos de frente. Todos comparten módulo para que
// los dientes encajen; B y C engranan con A sobre uno de sus dientes.
const MOD = 13, TOOTH = 21, VIEW = 720, DEPTH = 9;
const A = 24, B = 14, C = 10;

type Metal = { face: string[]; side: [string, string]; hub: [string, string] };
const STEEL: Metal = {
  face: ['#f6f8fa', '#98a2ad', '#e8ecf0', '#7c8793', '#fafbfc', '#a2abb6', '#dde3e8', '#84909c', '#f6f8fa'],
  side: ['#6d7781', '#3c444d'], hub: ['#ffffff', '#aab3bd'],
};
const BLUE: Metal = {
  face: ['#e3f3ff', '#6faedf', '#cde8ff', '#4f93cb', '#eef8ff', '#7bb8e6', '#c3e2fb', '#5a9bd0', '#e3f3ff'],
  side: ['#3f7fb5', '#1f4f7c'], hub: ['#f4faff', '#86bfe9'],
};
const RED: Metal = {
  face: ['#ffe1e1', '#e87c82', '#ffcfcf', '#d5626a', '#ffecec', '#ec8a90', '#ffc6c8', '#da6b72', '#ffe1e1'],
  side: ['#b84a52', '#7c2a31'], hub: ['#fff5f5', '#f09aa0'],
};

type Spec = { teeth: number; x: number; y: number; phi: number; k: number; metal: Metal; holes: number };
const rad = (deg: number) => (deg * Math.PI) / 180;
const pitch = (n: number) => (n * MOD) / 2;

function buildTrain(): Spec[] {
  const ax = -20, ay = 0, thB = -45, thC = 135;
  const dB = pitch(A) + pitch(B), dC = pitch(A) + pitch(C);
  return [
    { teeth: A, x: ax, y: ay, phi: 0, k: 1, metal: STEEL, holes: 6 },
    { teeth: B, x: ax + dB * Math.cos(rad(thB)), y: ay + dB * Math.sin(rad(thB)), phi: thB + 180 - 180 / B, k: -A / B, metal: BLUE, holes: 5 },
    { teeth: C, x: ax + dC * Math.cos(rad(thC)), y: ay + dC * Math.sin(rad(thC)), phi: thC + 180 - 180 / C, k: -A / C, metal: RED, holes: 0 },
  ];
}

/**
 * Engranajes metálicos dibujados en un lienzo. La luz queda fija mientras giran,
 * como en una pieza real. Se arrastran para girarlos, con inercia al soltar.
 */
export default function Gears() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current, canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!el || !canvas || !ctx) return;
    const still = reducedMotion();
    const train = buildTrain().map((g) => {
      const shape = gearPath(g.teeth, TOOTH, 0, MOD, g.holes);
      return { ...g, ...shape, base: new Path2D(shape.d) };
    });

    const IDLE = 14; // grados por segundo en reposo
    let w = 0, h = 0, scale = 1, dpr = 1;
    let angle = 0, vel = IDLE, dir = 1, light = -0.9, lightTo = -0.9;
    let dragging = false, lastA = 0, lastT = 0, lastScroll = window.scrollY;
    let raf = 0, prev = performance.now(), visible = true;

    const resize = () => {
      const r = el.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      scale = w / VIEW;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      draw();
    };

    const conic = (stops: string[], start: number) => {
      const g = ctx.createConicGradient(start, 0, 0);
      stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
      return g;
    };

    const drawGear = (g: (typeof train)[number]) => {
      const rot = rad(g.phi + angle * g.k);
      const path = new Path2D();
      path.addPath(g.base, new DOMMatrix().rotate((rot * 180) / Math.PI));
      ctx.save();
      ctx.translate(g.x, g.y);

      // sombra sobre la superficie
      ctx.save();
      ctx.translate(0, DEPTH);
      ctx.shadowColor = 'rgba(20, 50, 90, 0.34)';
      ctx.shadowBlur = 34 * scale * dpr;
      ctx.shadowOffsetY = 20 * scale * dpr;
      ctx.fillStyle = g.metal.side[1];
      ctx.fill(path, 'evenodd');
      ctx.restore();

      // canto: el grosor de la pieza
      const side = ctx.createLinearGradient(-g.ro, 0, g.ro, 0);
      side.addColorStop(0, g.metal.side[1]);
      side.addColorStop(0.45, g.metal.side[0]);
      side.addColorStop(1, g.metal.side[1]);
      ctx.fillStyle = side;
      for (let i = DEPTH; i >= 1; i--) {
        ctx.save();
        ctx.translate(0, i);
        ctx.fill(path, 'evenodd');
        ctx.restore();
      }

      // cara: metal cepillado con reflejos que no giran con la pieza
      ctx.fillStyle = conic(g.metal.face, light);
      ctx.fill(path, 'evenodd');

      ctx.save();
      ctx.clip(path, 'evenodd');
      const vig = ctx.createRadialGradient(0, 0, g.rr * 0.5, 0, 0, g.ro);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(10,25,45,0.2)');
      ctx.fillStyle = vig;
      ctx.fillRect(-g.ro, -g.ro, g.ro * 2, g.ro * 2);
      // marcas de torneado
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 0.7;
      for (let r = g.R * 0.36; r < g.rr; r += 5) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // rebaje entre el cubo y los dientes
      const dish = ctx.createLinearGradient(0, -g.R, 0, g.R);
      dish.addColorStop(0, 'rgba(10,25,45,0.2)');
      dish.addColorStop(1, 'rgba(255,255,255,0.28)');
      ctx.fillStyle = dish;
      ctx.beginPath();
      ctx.arc(0, 0, g.rr - 7, 0, Math.PI * 2);
      ctx.arc(0, 0, g.R * 0.36, 0, Math.PI * 2, true);
      ctx.fill();
      // filo iluminado del borde
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.stroke(path);
      ctx.restore();

      // cubo central, eje y chaveta
      const hubR = g.R * 0.34;
      ctx.save();
      ctx.shadowColor = 'rgba(10, 25, 45, 0.35)';
      ctx.shadowBlur = 10 * scale * dpr;
      ctx.shadowOffsetY = 4 * scale * dpr;
      const hub = ctx.createLinearGradient(0, -hubR, 0, hubR);
      hub.addColorStop(0, g.metal.hub[0]);
      hub.addColorStop(1, g.metal.hub[1]);
      ctx.fillStyle = hub;
      ctx.beginPath();
      ctx.arc(0, 0, hubR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, hubR - 1, 0, Math.PI * 2);
      ctx.stroke();

      const bore = hubR * 0.46;
      ctx.save();
      ctx.rotate(rot);
      const hole = ctx.createLinearGradient(0, -bore, 0, bore);
      hole.addColorStop(0, '#0d1722');
      hole.addColorStop(1, '#3a4654');
      ctx.fillStyle = hole;
      ctx.beginPath();
      ctx.arc(0, 0, bore, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-bore * 0.3, -bore * 1.32, bore * 0.6, bore * 0.7);
      ctx.restore();

      ctx.restore();
    };

    function draw() {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);
      ctx!.translate(w / 2, h / 2);
      ctx!.scale(scale, scale);
      train.forEach(drawGear);
    }

    const pointerAngle = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2 + train[0].x * scale, cy = r.top + r.height / 2 + train[0].y * scale;
      return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
    };
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
      if (still) draw();
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-grabbing');
      vel = Math.max(-720, Math.min(720, vel));
      if (Math.abs(vel) > 30) dir = Math.sign(vel);
    };
    const onMove = (e: PointerEvent) => {
      lightTo = -0.9 + (e.clientX / window.innerWidth - 0.5) * 1.2; // el reflejo acompaña al cursor
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (!dragging) vel = Math.max(-720, Math.min(720, vel + (y - lastScroll) * 0.4 * dir));
      lastScroll = y;
    };
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (visible) {
        if (!dragging) {
          vel += (IDLE * dir - vel) * Math.min(1, dt * 1.1);
          angle += vel * dt;
        }
        light += (lightTo - light) * 0.06;
        draw();
      }
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(el);
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onDrag);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    if (!still) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      raf = requestAnimationFrame(loop);
    }
    return () => {
      io.disconnect();
      ro.disconnect();
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
    <div className="gears" ref={wrap} role="img" aria-label="Tres engranajes de metal que giran encajados; se pueden arrastrar para girarlos">
      <canvas ref={canvasRef} />
      <span className="gears__hint" aria-hidden="true">Arrástralos para girarlos</span>
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
          <stop offset="0" stopColor="#2F8FE8" />
          <stop offset="1" stopColor="#F26D74" />
        </linearGradient>
      </defs>
      <path d={d} fill="url(#gm)" fillRule="evenodd" />
    </svg>
  );
}
