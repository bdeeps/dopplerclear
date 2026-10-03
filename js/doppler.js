// Shared parts for DopplerClear: the Doppler maths (straight-line formula, the general case solved from
// where the sound was really emitted, light's relativistic version), wavefront rings that are born where
// the source was and grow at the wave speed, a tone that follows the computed pitch, chart boards, small
// models and the layout helpers every chapter uses. +x right, +y up. Each chapter says what one unit is.
import { THREE, M, box, sphere, beam, canvasTexture, clamp } from './kit.js';
import { audio } from './ui.js';

// ---------------------------------------------------------------- constants
export const TAU = Math.PI * 2;
export const V_AIR = 343;              // m/s, speed of sound in dry air at 20 °C (331.3 × √(1 + T/273.15))
export const C = 299792458;            // m/s, speed of light in a vacuum (exact, SI definition)
export const C_TISSUE = 1540;          // m/s, the average speed of sound in soft tissue that scanners assume
export const KMH = 3.6;                // km/h in 1 m/s

// ---------------------------------------------------------------- the Doppler effect
// Along one line, in a medium where the wave travels at v:
//   f′ = f × (v + vo) ÷ (v − vs)
// vo = the listener's speed towards the source, vs = the source's speed towards the listener (both
// negative when moving apart). Valid for vs < v.
export const ratioLine = (v, vs, vo = 0) => (v + vo) / (v - vs);

// The general case, straight from the geometry. A source moves at constant velocity Sv; at time t it is
// at S. A listener is at L, moving at Lv. The sound heard at t left the source earlier, at t − τ, from
// S − Sv τ, and travelled |L − (S − Sv τ)| = v τ. Solving that quadratic for τ (subsonic source):
//   τ = [D·Sv + √((D·Sv)² + (v² − |Sv|²) |D|²)] ÷ (v² − |Sv|²),  D = L − S.
// With n the unit vector from the emission point to the listener:
//   f′ ÷ f = (1 − n·Lv ÷ v) ÷ (1 − n·Sv ÷ v).
// All arguments are [x, z] pairs in metres and m/s. Returns { tau, ratio, n, ex, ez, dist }.
export function heard(S, Sv, L, Lv, v = V_AIR) {
  const Dx = L[0] - S[0], Dz = L[1] - S[1];
  const s2 = Sv[0] * Sv[0] + Sv[1] * Sv[1], dv = Dx * Sv[0] + Dz * Sv[1], d2 = Dx * Dx + Dz * Dz;
  const a = v * v - s2;
  if (a <= 0) return null;                                  // supersonic: see chapter 5
  const tau = (dv + Math.sqrt(dv * dv + a * d2)) / a;
  const ex = S[0] - Sv[0] * tau, ez = S[1] - Sv[1] * tau;   // where the sound heard now was emitted
  const dist = v * tau || 1e-9;
  const nx = (L[0] - ex) / dist, nz = (L[1] - ez) / dist;
  const ratio = (1 - (nx * Lv[0] + nz * Lv[1]) / v) / (1 - (nx * Sv[0] + nz * Sv[1]) / v);
  return { tau, ratio, n: [nx, nz], ex, ez, dist };
}
export const semitones = (r) => 12 * Math.log2(r);
// Light has no medium, so only the relative speed counts (special relativity, Einstein 1905):
//   f′ ÷ f = √((1 − β) ÷ (1 + β)), β = v ÷ c, positive when moving apart. λ′ ÷ λ is the inverse.
export const relRatio = (beta) => Math.sqrt((1 - beta) / (1 + beta));
export const gammaOf = (beta) => 1 / Math.sqrt(1 - beta * beta);
// An echo off a moving target is shifted twice (once on the way in, once on the way out):
//   Δf = 2 f₀ v cosθ ÷ c for v much smaller than the wave speed c.
export const echoShift = (f0, v, c, cos = 1) => (2 * f0 * v * cos) / c;

// ---------------------------------------------------------------- number formats
export const fmt0 = (v) => Math.round(v).toLocaleString('en-IN');
export function fmtHz(f) {
  const a = Math.abs(f);
  if (a >= 1e12) return (f / 1e12).toPrecision(4) + ' THz';
  if (a >= 1e9) return (f / 1e9).toPrecision(5) + ' GHz';
  if (a >= 1e6) return (f / 1e6).toPrecision(3) + ' MHz';
  if (a >= 1e4) return (f / 1e3).toFixed(1) + ' kHz';
  if (a >= 100) return fmt0(f) + ' Hz';
  if (a >= 10) return f.toFixed(1) + ' Hz';
  return f.toFixed(2) + ' Hz';
}
export function fmtL(m) {
  const a = Math.abs(m);
  if (a < 1e-9) return (m * 1e12).toPrecision(3) + ' pm';
  if (a < 1e-6) return (m * 1e9).toPrecision(4) + ' nm';
  if (a < 1e-3) return (m * 1e6).toPrecision(3) + ' µm';
  if (a < 0.01) return (m * 1000).toFixed(1) + ' mm';
  if (a < 1) return (m * 100).toFixed(1) + ' cm';
  if (a < 1000) return m.toFixed(a < 10 ? 2 : 1) + ' m';
  return (m / 1000).toFixed(1) + ' km';
}
// 3,721,562 → "3.7 million"
export function fmtBig(n) { return n >= 1e9 ? (n / 1e9).toPrecision(2) + ' billion' : n >= 1e6 ? (n / 1e6).toPrecision(2) + ' million' : n >= 1e5 ? Math.round(n / 1e3) + ' thousand' : fmt0(n); }
export const kmh = (v) => fmt0(v * KMH) + ' km/h';
export const signed = (v, d = 0) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d);

// Equal temperament from A4 = 440 Hz, for naming the pitch you hear.
const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export function noteOf(f) {
  if (!(f > 0)) return '';
  const n = Math.round(12 * Math.log2(f / 440)) + 57;
  return NAMES[((n % 12) + 12) % 12] + Math.floor(n / 12);
}

// ---------------------------------------------------------------- colours
export const COL = {
  wave: '#6fb6ff',     // wavefronts
  hi: '#7fd0ff',       // squeezed, higher pitch, bluer
  lo: '#ff7a59',       // stretched, lower pitch, redder
  f: '#c49bff',        // the source's own frequency
  lam: '#5ce1a9',      // wavelength, measured values
  hot: '#ffb547',
  text: '#e8eef8',
  soft: 'rgba(255,255,255,.62)',
};
export const hex = (c) => new THREE.Color(c).getHex();

// Approximate colour of light of wavelength nm (380–750), after Dan Bruton's widely used piecewise fit.
export function nmRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm >= 440 && nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm >= 490 && nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm >= 510 && nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm >= 580 && nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else if (nm >= 645 && nm <= 750) { r = 1; }
  let k = 1;
  if (nm < 420) k = 0.3 + (0.7 * (nm - 380)) / 40; else if (nm > 700) k = 0.3 + (0.7 * (750 - nm)) / 50;
  if (nm < 380 || nm > 750) k = 0;
  const c = (x) => Math.pow(clamp(x * k, 0, 1), 0.8);
  return [c(r), c(g), c(b)];
}
export const nmColor = (nm) => { const [r, g, b] = nmRGB(nm); return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`; };
export const bandOf = (nm) => (nm < 10 ? 'X-rays' : nm < 380 ? 'ultraviolet (invisible)' : nm < 450 ? 'violet' : nm < 495 ? 'blue' : nm < 570 ? 'green' : nm < 590 ? 'yellow' : nm < 620 ? 'orange' : nm <= 750 ? 'red' : nm < 1e6 ? 'infrared (invisible)' : 'microwaves');

// ---------------------------------------------------------------- wavefront rings
// A pool of flat rings. Each remembers where and when it was emitted; update() gives every ring the
// radius speed × (now − its birth), so nothing about the bunching is drawn by hand: it falls out of the
// source having moved between one ring and the next. plane 'xz' lies flat on the ground at height y;
// plane 'xy' stands upright at depth z (a side view). An arc can be limited to angles a0…a1.
export function makeRings(n, { color = 0x6fb6ff, width = 0.06, seg = 80, plane = 'xz', y = 0.3, z = 0, opacity = 0.9 } = {}) {
  const g = new THREE.Group(), rings = [];
  const idx = [];
  for (let i = 0; i < seg; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); }
  for (let i = 0; i < n; i++) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array((seg + 1) * 6);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    mesh.frustumCulled = false; mesh.visible = false; g.add(mesh);
    rings.push({ mesh, pos, live: false, x: 0, z: 0, t: 0, R: 0, a0: 0, a1: TAU, hit: false, gap: 0, tag: 0 });
  }
  let next = 0;
  g.rings = rings;
  g.emit = (x, zz, t, o = {}) => {
    const r = rings[next]; next = (next + 1) % n;
    Object.assign(r, { x, z: zz, t, live: true, R: 0, a0: o.a0 ?? 0, a1: o.a1 ?? TAU, hit: false, gap: Infinity, tag: o.tag ?? 0, speed: o.speed ?? 0, k: o.k ?? 1 });
    r.mesh.material.color.set(o.color ?? color);
    return r;
  };
  g.clear = () => rings.forEach((r) => { r.live = false; r.mesh.visible = false; });
  // speed in scene units per second of the clock `now`; rings die beyond maxR.
  g.update = (now, speed, maxR, w = width) => {
    for (const r of rings) {
      if (!r.live) continue;
      r.R = (now - r.t) * (r.speed || speed);
      if (r.R > maxR || r.R < 0) { r.live = false; r.mesh.visible = false; continue; }
      r.mesh.visible = r.R > 0.02;
      const p = r.pos, ri = Math.max(0, r.R - w / 2), ro = r.R + w / 2;
      for (let i = 0; i <= seg; i++) {
        const a = r.a0 + ((r.a1 - r.a0) * i) / seg, c = Math.cos(a), s = Math.sin(a), k = i * 6;
        if (plane === 'xz') { p[k] = r.x + c * ri; p[k + 1] = y; p[k + 2] = r.z + s * ri; p[k + 3] = r.x + c * ro; p[k + 4] = y; p[k + 5] = r.z + s * ro; }
        else { p[k] = r.x + c * ri; p[k + 1] = r.z + s * ri; p[k + 2] = z; p[k + 3] = r.x + c * ro; p[k + 4] = r.z + s * ro; p[k + 5] = z; }
      }
      r.mesh.geometry.attributes.position.needsUpdate = true;
      r.mesh.material.opacity = opacity * r.k * Math.pow(clamp(1 - r.R / maxR, 0, 1), 0.6);
    }
  };
  return g;
}

// ---------------------------------------------------------------- sound
// One steady tone whose pitch follows the frequency the model computes. It starts only when the viewer
// switches it on, honours the box's sound switch, and never plays while a video is being recorded.
let ac = null;
export function unlockAudio() {
  if (audio.muted) return null;
  try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
export function makeTone() {
  let osc = null, gain = null;
  const t = {
    get on() { return !!osc; },
    start() {
      if (osc || inReel() || !unlockAudio()) return !!osc;
      osc = ac.createOscillator(); gain = ac.createGain();
      osc.type = 'triangle'; gain.gain.value = 0;
      osc.connect(gain).connect(ac.destination); osc.start();
      return true;
    },
    set(f, vol = 0.08) {
      if (!osc) return;
      const now = ac.currentTime;
      osc.frequency.setTargetAtTime(clamp(f, 30, 9000), now, 0.015);
      gain.gain.setTargetAtTime(audio.muted ? 0 : clamp(vol, 0, 0.2), now, 0.04);
    },
    stop() {
      if (!osc) return;
      try { gain.gain.setTargetAtTime(0, ac.currentTime, 0.03); osc.stop(ac.currentTime + 0.25); } catch { /* already stopped */ }
      osc = null; gain = null;
    },
    // Call every frame: play flag, frequency, loudness 0…1.
    follow(play, f, loud = 1) { if (play && !inReel()) { if (!osc) t.start(); t.set(f, 0.02 + 0.09 * clamp(loud, 0, 1)); } else t.stop(); },
  };
  return t;
}

// ---------------------------------------------------------------- boards (live charts in 3D)
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); }
export function board(root, w, h, pxW, pxH, draw, pos, tilt = 0) {
  const tex = canvasTexture(pxW, pxH, draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); m.rotation.x = tilt; m.renderOrder = 5; root.add(m);
  return Object.assign(tex, { mesh: m, tilt });
}
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '', xLog = false, yLog = false }) {
  const X = xLog ? (x) => x0 + (Math.log(x / xMin) / Math.log(xMax / xMin)) * (x1 - x0) : (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = yLog ? (y) => y0 - (Math.log(y / yMin) / Math.log(yMax / yMin)) * (y0 - y1) : (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 50);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function title(g, text, sub = '') {
  g.fillStyle = COL.text; g.font = 'bold 24px sans-serif'; g.fillText(text, 20, 36);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 36); }
}
export function line(g, pts, X, Y, col, wdt = 4, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.lineJoin = 'round'; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}
export function curve(g, fn, a, b, X, Y, col, wdt = 4, dash = null, n = 240) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; pts.push([x, fn(x)]); }
  line(g, pts, X, Y, col, wdt, dash);
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function text(g, s, x, y, col = COL.text, font = '18px sans-serif') { g.fillStyle = col; g.font = font; g.fillText(s, x, y); }
export function clipTo(g, ax, fn) { g.save(); g.beginPath(); g.rect(ax.x0, ax.y1, ax.x1 - ax.x0, ax.y0 - ax.y1); g.clip(); fn(); g.restore(); }

// ---------------------------------------------------------------- small models (all face +x)
export function makeAmbulance(s = 1) {
  const g = new THREE.Group();
  const body = box(1.5, 0.62, 0.7, M.plastic(0xf2f4f7)); body.position.set(-0.15, 0.5, 0); g.add(body);
  const cab = box(0.5, 0.42, 0.68, M.plastic(0xf2f4f7)); cab.position.set(0.85, 0.4, 0); g.add(cab);
  const glass = box(0.3, 0.2, 0.7, M.plastic(0x23314a, { roughness: 0.2 })); glass.position.set(0.9, 0.5, 0); g.add(glass);
  const stripe = box(1.52, 0.1, 0.72, M.plastic(0xe0453a)); stripe.position.set(-0.15, 0.45, 0); g.add(stripe);
  const lamp = box(0.3, 0.1, 0.4, M.glow(0x5aa0ff)); lamp.position.set(0.3, 0.87, 0); g.add(lamp);
  for (const x of [-0.6, 0.75]) for (const z of [-0.36, 0.36]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 18), M.matte(0x15171c)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.16, z); g.add(w); }
  g.lamp = lamp; g.scale.setScalar(s);
  return g;
}
export function makeCar(color = 0x3d7bd9, s = 1) {
  const g = new THREE.Group();
  const body = box(1.5, 0.3, 0.66, M.plastic(color, { roughness: 0.3 })); body.position.set(0, 0.32, 0); g.add(body);
  const top = box(0.8, 0.26, 0.6, M.plastic(0x23314a, { roughness: 0.2 })); top.position.set(-0.08, 0.6, 0); g.add(top);
  for (const x of [-0.48, 0.48]) for (const z of [-0.34, 0.34]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 18), M.matte(0x15171c)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.15, z); g.add(w); }
  g.scale.setScalar(s);
  return g;
}
export function makeTrain(s = 1) {
  const g = new THREE.Group();
  const loco = box(1.7, 0.7, 0.62, M.plastic(0xe07a2a, { roughness: 0.4 })); loco.position.set(0, 0.55, 0); g.add(loco);
  const nose = box(0.3, 0.45, 0.6, M.plastic(0xf1c232)); nose.position.set(0.95, 0.43, 0); g.add(nose);
  const win = box(0.05, 0.2, 0.5, M.plastic(0x23314a, { roughness: 0.2 })); win.position.set(0.86, 0.72, 0); g.add(win);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 14, 1, true), M.metal(0xd8dde6, { side: THREE.DoubleSide })); horn.rotation.z = Math.PI / 2; horn.position.set(0.7, 0.98, 0); g.add(horn);
  for (let i = 1; i <= 3; i++) { const c = box(1.75, 0.66, 0.6, M.plastic(0x2c5f9e, { roughness: 0.45 })); c.position.set(-i * 1.85, 0.53, 0); g.add(c); const st = box(1.76, 0.12, 0.61, M.plastic(0xe9eef5)); st.position.set(-i * 1.85, 0.62, 0); g.add(st); }
  g.scale.setScalar(s);
  return g;
}
export function makePerson({ shirt = 0xffb547, s = 1 } = {}) {
  const g = new THREE.Group();
  const legs = box(0.2, 0.42, 0.14, M.matte(0x2b3242)); legs.position.y = 0.21; g.add(legs);
  const body = box(0.26, 0.4, 0.16, M.plastic(shirt)); body.position.y = 0.62; g.add(body);
  const head = sphere(0.11, M.plastic(0xc68b64), 16); head.position.y = 0.95; g.add(head);
  g.scale.setScalar(s);
  return g;
}
export function makeJet(s = 1) {
  const g = new THREE.Group(), m = M.metal(0xd8dde6, { roughness: 0.35 });
  const f = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 1.1, 16), m); f.rotation.z = -Math.PI / 2; g.add(f);
  const n = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 16), m); n.rotation.z = -Math.PI / 2; n.position.x = 0.75; g.add(n);
  const wing = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.25, 0, 0), new THREE.Vector3(-0.45, 0, 0.6), new THREE.Vector3(-0.45, 0, -0.6)]), M.metal(0xb9bec8, { side: THREE.DoubleSide }));
  wing.geometry.setIndex([0, 1, 2]); wing.geometry.computeVertexNormals(); g.add(wing);
  const fin = box(0.3, 0.3, 0.03, m); fin.position.set(-0.42, 0.17, 0); g.add(fin);
  g.scale.setScalar(s);
  return g;
}
// A flat strip on the ground (a road or a track bed).
export function strip(w, d, color, y = 0.01) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.matte(color)); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m; }
// n small glowing or lit balls placed every frame.
export function dots(n, r, color = 0xffffff, lit = false, seg = 10) {
  const mat = lit ? M.plastic(color, { roughness: 0.4 }) : new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 3)), mat, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false;
  const o = new THREE.Object3D(), c = new THREE.Color();
  mesh.place = (i, x, y, z, s = 1) => { o.position.set(x, y, z); o.scale.setScalar(Math.max(0.0001, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.tint = (i, r2, g2, b2) => { c.setRGB(r2, g2, b2); mesh.setColorAt(i, c); };
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  return mesh;
}
// A double-headed measuring bracket along x, with set(x0, x1, y, z).
export function bracket(color) {
  const g = new THREE.Group(), m = M.glow(color);
  const bar = box(1, 0.04, 0.04, m), a = box(0.04, 0.04, 0.5, m), b = box(0.04, 0.04, 0.5, m);
  g.add(bar, a, b);
  g.set = (x0, x1, y, z) => { bar.scale.x = Math.max(0.001, x1 - x0); bar.position.set((x0 + x1) / 2, y, z); a.position.set(x0, y, z); b.position.set(x1, y, z); };
  return g;
}

// ---------------------------------------------------------------- layout
export const inReel = () => document.body.classList.contains('gb-reel');
// On a phone-width stage: hide minor labels and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = [], drop = -0.14) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? drop : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// Boards sit beside the model on a wide screen. In the tall reel video (and on a phone) they move.
export function placeBoard(b, wide, tall, stage) {
  const reel = inReel();
  b.mesh.visible = reel || stage.host.clientWidth >= 560;       // on a phone the readout would cover it
  const p = reel ? tall : wide;
  b.mesh.position.set(p[0], p[1], p[2]); b.mesh.scale.setScalar(p[3] ?? 1); b.mesh.rotation.x = p[4] ?? b.tilt; b.mesh.rotation.y = p[5] ?? 0;
}
// On a phone the stage is small and the readout covers its top, so each scene has a centred view.
export function phoneView(stage, key, v) {
  if (inReel() || stage.host.clientWidth >= 560 || stage.phoneKey === key) return;
  stage.phoneKey = key; stage.setView(v.pos, v.target, 0.5);
}
// On a phone, keep the headline and only the rows that matter most.
export function lean(html, keep = [0, 1, 2]) {
  if (window.innerWidth >= 560) return html;
  const rows = html.match(/<div class="row">[\s\S]*?<\/div>/g) || [], big = (html.match(/<div class="big">[\s\S]*?<\/div>/) || [''])[0];
  return big + keep.map((i) => rows[i] || '').join('');
}
export function focusView(stage, views, focus) {
  if (inReel()) return;
  const v = views[focus]; if (v) stage.setView(v.pos, v.target, 1.0);
}
export { clamp, beam };
