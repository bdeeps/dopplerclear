// Chapter 5: where the simple formula breaks or surprises. Three scenes.
// "mach" (side view, 1 unit = 500 m): a jet at 3 km altitude. f′ = f v ÷ (v − vs) blows up as vs
//   reaches v: at Mach 1 every crest sits on the nose. Faster than that, the jet leaves each ring
//   behind, and the rings (still each centred where the jet was) line up along a cone with half-angle
//   μ = asin(1 ÷ M), M = vs ÷ v (the Mach number, named after Ernst Mach by Jakob Ackeret in 1929; Mach
//   and Peter Salcher photographed the wave on a supersonic bullet in 1887). The cone is not drawn from
//   that formula alone: the rings make it, and the straight lines are laid on top to compare. The
//   cone sweeps the ground h √(M² − 1) behind the jet; anyone it crosses hears a sonic boom. The boom
//   follows the aircraft all along its supersonic path (a "boom carpet"), not only at the moment it
//   passes Mach 1. Concorde's boom at Mach 2 was about 93 Pa (Wikipedia, "Sonic boom"). First piloted
//   supersonic flight: Chuck Yeager, Bell X-1, Mach 1.06, 14 October 1947. Sound speed is taken as
//   343 m/s throughout; real air at altitude is colder and sound is slower there.
// "light" (schematic): light needs no medium, so there is no "who is really moving". Special relativity
//   (Einstein, 1905) gives λ′ = λ √((1 + β) ÷ (1 − β)) for a source receding at β = v ÷ c. In the model
//   the rings spread at the drawn light speed from where the ship was, and the ship's clock runs slow by
//   γ = 1 ÷ √(1 − β²), so it emits crests γ times less often; those two facts together give exactly the
//   formula. Ives and Stilwell confirmed the time-dilation part with fast hydrogen ions in 1938.
//   Seen exactly side-on at the moment of emission the light is still redshifted by γ (transverse Doppler).
//   To see a 630 nm red light as 530 nm green you must approach at β = (1 − r²) ÷ (1 + r²), r = 530 ÷ 630:
//   0.171 c, about 51,000 km/s.
// "myth" (1 unit = 10 m): "the pitch rises as it comes closer". It does not. With the siren passing
//   4 m from you at 72 km/h the pitch computed from the geometry is flat, then falls. What rises is the
//   loudness (inverse square: −6 dB per doubling of distance), and listeners mistake that for rising
//   pitch: the "Doppler illusion" (Neuhoff & McBeath, J. Exp. Psychol. HPP 22, 970, 1996; McBeath &
//   Neuhoff, Psychon. Bull. Rev. 9, 306, 2002).
import { THREE, M, box, sphere, approach, clamp } from '../kit.js';
import {
  TAU, V_AIR, C, KMH, COL, hex, fmt0, fmtHz, nmRGB, bandOf, relRatio, gammaOf, heard, makeRings, makeTone, unlockAudio, board, panelBg, axes,
  title, line, curve, dot, text, clipTo, makeJet, makeAmbulance, makePerson, strip, fitNarrow, placeBoard, phoneView, lean, focusView, inReel,
} from '../doppler.js';

const U5 = 500, ALT = 3000;                 // m per unit in the jet scene; the jet's altitude (m)
const XL = 2500;                            // where the listener stands on the ground (m)
const MX = 0, LX = 70, YX = 140;            // the three scenes sit apart along x
const CS = 5;                               // drawn speed of light, units per second
const MYTH = { u: 20, d: 4, f: 700, XR: 110 };
const VIEWS = {
  mach: { pos: [MX + 0.5, 7.4, 25], target: [MX + 0.5, 7.4, 0] },
  light: { pos: [LX + 0.6, 13, 12], target: [LX + 0.6, 0, -2.2] },
  myth: { pos: [YX + 0.8, 11, 10.5], target: [YX + 0.8, 0, -2.4] },
};
const greenBeta = (() => { const r = 530 / 630; return (1 - r * r) / (1 + r * r); })();
const mythAt = (x) => heard([x, 0], [MYTH.u, 0], [0, MYTH.d], [0, 0]);
const dBs = (v) => (Math.round(v) === 0 ? '0 dB' : `−${Math.abs(Math.round(v))} dB`);
const eyeColor = (nm) => { const [r, g, b] = nmRGB(nm); return r + g + b < 0.05 ? [0.16, 0.17, 0.2] : [r, g, b]; };

export default {
  id: 'limits',
  short: 'Sonic booms, light, and a myth',
  title: 'Past the speed of sound, and three myths',
  subtitle: 'The formula divides by zero at Mach 1, light plays by different rules, and the pitch never rises.',
  view: VIEWS.mach,
  learn: `<p>Look at the formula again: f′ = f × v ÷ (v − vₛ). As the source nears the speed of sound, v − vₛ shrinks towards <b>zero</b> and the answer shoots off to infinity. At <b>Mach 1</b> the source keeps up with its own crests, and they pile into a wall of pressure on its nose.</p>
    <p>Go faster and the source <b>outruns its sound</b>. The rings are left behind, each still centred where the jet was, and their edges line up into a <b>cone</b>: a shock wave. Its half-angle follows <b>sin μ = 1 ÷ M</b>, so a faster jet drags a narrower cone. When the cone sweeps over you, you hear a <b>sonic boom</b>. Before that, nothing at all: the jet arrives in silence. The crack of a whip is the same thing, made by a tip moving faster than sound.</p>
    <p><b>Myth: the boom happens once, when the jet “breaks the sound barrier”.</b> No. The cone travels with the jet for as long as it flies supersonically, laying a carpet of boom along the ground. Each listener just hears it once, as it passes.</p>
    <p><b>Light plays by different rules.</b> Sound travels in air, so it matters whether the source or the listener moves through the air. Light needs no medium, so only the <b>relative</b> speed can matter. Einstein's relativity gives <b>λ′ = λ × √((1 + β) ÷ (1 − β))</b> with β = v ÷ c, a value that sits exactly between the two sound formulas. Part of it comes from the moving clock running slow. <b>Myth: “the light looked green to me, officer.”</b> To turn a red traffic light green you would have to drive at 17% of the speed of light, about 51,000 km every second.</p>
    <p><b>Myth: the pitch rises as the siren comes closer.</b> It feels that way, but the pitch is <b>steady</b> while the siren approaches, then falls. What rises is the <b>loudness</b>, and our ears mix the two up. Psychologists call it the Doppler illusion.</p>
    <p>One more. The redshift of far galaxies is not really speed through space. <b>Space itself stretches</b> while the light travels, stretching the light with it. That is why very distant galaxies can have redshifts that a simple Doppler speed could never explain.</p>
    <p class="tip"><b>Try it:</b> slide the jet from Mach 0.8 to Mach 2 and watch the rings pile up, then fall behind into a cone. Then press <b>Run the red light</b>.</p>`,
  terms: [
    { t: 'Mach number', d: 'Speed divided by the speed of sound. Mach 1 is the speed of sound; Mach 2 is twice that.' },
    { t: 'Shock wave', d: 'A sudden jump in pressure where many wavefronts pile up together.' },
    { t: 'Mach cone', d: 'The cone-shaped shock wave behind anything supersonic. Its half-angle μ obeys sin μ = 1 ÷ M.' },
    { t: 'Sonic boom', d: 'The bang heard when a Mach cone sweeps past a listener.' },
    { t: 'Relativistic Doppler effect', d: 'The Doppler effect for light, which depends only on the relative speed of source and observer.' },
    { t: 'Cosmological redshift', d: 'The stretching of light as the space it travels through expands.' },
  ],
  defaults: { focus: 'mach', mach: 1.5, beta: 0.1, lam: 532, sound: false },
  onChange(s, key) { if (key === 'sound' && s.sound) unlockAudio(); },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'mach', label: 'Sonic boom' }, { v: 'light', label: 'Light' }, { v: 'myth', label: 'Rising pitch?' }] },
    { key: 'mach', type: 'range', label: 'Jet: speed', min: 0.5, max: 3, step: 0.01, ends: ['Mach 0.5', 'Mach 3'], fmt: (v) => `Mach ${v.toFixed(2)} · ${fmt0(v * V_AIR * KMH)} km/h` },
    { key: 'beta', type: 'range', label: 'Light: speed of the source', min: 0, max: 0.9, step: 0.001, ends: ['still', '0.9 c'], fmt: (v) => `${(v * 100).toFixed(1)}% of light speed · ${fmt0((v * C) / 1000)} km/s` },
    { key: 'lam', type: 'seg', label: 'Light: the lamp’s own colour', options: [{ v: 630, label: 'Red, 630 nm' }, { v: 532, label: 'Green, 532 nm' }, { v: 460, label: 'Blue, 460 nm' }] },
    { key: 'go', type: 'buttons', label: 'Light', items: [{ label: 'Run the red light', act: (s) => { s.focus = 'light'; s.lam = 630; s.beta = Math.round(greenBeta * 1000) / 1000; } }] },
    { key: 'sound', type: 'toggle', label: 'Rising pitch?: hear the true pitch', hint: 'A tone at the computed pitch, louder as the siren nears. It needs the ♪ sound switch on.' },
  ],
  quiz: [
    { q: 'A jet flies level at Mach 2. What is the half-angle of its Mach cone?', options: ['30°', '45°', '60°', '90°'], answer: 0, why: 'sin μ = 1 ÷ M = 1 ÷ 2, so μ = 30°. A faster jet makes a narrower cone.' },
    { q: 'When does a supersonic jet make its sonic boom?', options: ['Only at the instant it passes Mach 1', 'All the time it flies faster than sound', 'Only when it slows down', 'Only over the sea'], answer: 1, why: 'The shock cone travels with the jet. Everyone along its path hears the boom once, as the cone sweeps over them.' },
    { q: 'A siren drives towards you at a steady speed, straight down the road. Before it reaches you, its pitch is…', options: ['rising steadily', 'steady, and higher than its true pitch', 'steady, and equal to its true pitch', 'falling steadily'], answer: 1, why: 'A steady approach gives a steady, raised pitch. It only falls as the siren passes. The feeling of rising pitch comes from the rising loudness.' },
  ],
  reel: [
    { ms: 6000, caption: 'Faster than sound, a jet leaves its waves behind. They pile into a cone, and you hear a sonic boom.', set: { focus: 'mach' }, act: (s, inst) => inst.seek?.(-11), anim: { mach: [0.8, 2.2] }, spin: 0, view: { pos: [MX + 0.5, 7, 24], target: [MX + 0.5, 9, 0] } },
  ],

  build({ stage }) {
    stage.phoneKey = null;
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    // ================================================================ MACH (side view)
    const A = new THREE.Group(); A.position.x = MX; root.add(A);
    const earth = box(60, 12, 16, M.matte(0x16241c)); earth.position.set(0, -6, 0); A.add(earth);
    const jet = makeJet(1.5); A.add(jet);
    const rings = makeRings(70, { color: hex(COL.wave), width: 0.06, plane: 'xy', z: 0, opacity: 0.9, seg: 96 }); A.add(rings);
    const coneM = M.glow(hex(COL.hot));
    const c1 = box(1, 0.07, 0.07, coneM), c2 = box(1, 0.07, 0.07, coneM); A.add(c1, c2);
    const man = makePerson({ s: 1.1 }); man.position.set(XL / U5, 0, 0.4); A.add(man);
    const bang = sphere(0.5, new THREE.MeshBasicMaterial({ color: hex(COL.hot), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), 16); bang.position.set(XL / U5, 1.3, 0.4); A.add(bang);
    for (let k = -12; k <= 12; k += 4) { const m = box(0.04, 0.3, 0.04, M.glow(0x6d7380)); m.position.set(k, 0.15, 1.2); A.add(m); stage.label(`${k / 2} km`, [k, -0.5, 1.2], A); }
    const lJet = stage.label('', [0, 0, 0], A, 'hot'); lJet.element.style.setProperty('--c', COL.f);
    const lMan = stage.label('', [XL / U5, 2.3, 0.4], A, 'hot');
    const lMu = stage.label('', [0, 0, 0], A, 'hot'); lMu.element.style.setProperty('--c', COL.hot);
    const lAlt = stage.label('3 km up', [-15, ALT / U5 + 0.6, 0], A);
    let at = 0, ax = -14 * U5, aNext = 0, since = 0, steady = 0, mPrev = 0, inside = false, boom = 0, heardBoom = false;

    // ================================================================ LIGHT
    const L = new THREE.Group(); L.position.x = LX; root.add(L);
    L.add(strip(60, 40, 0x07090f, 0));
    const lworld = new THREE.Group(); L.add(lworld);
    const stars = Array.from({ length: 40 }, (_, i) => { const d = sphere(0.05, M.glow(0x8fa0b8), 6); lworld.add(d); return { d, x: ((i * 7.13) % 30) - 15, z: ((i * 3.71) % 16) - 9 }; });
    const ship = new THREE.Group(); L.add(ship);
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.6, 20), M.metal(0xc9d1dc)); hull.rotation.z = -Math.PI / 2; hull.position.y = 0.5; ship.add(hull);
    const lamp = sphere(0.3, new THREE.MeshBasicMaterial({ color: 0x00ff66, toneMapped: false }), 18); lamp.position.set(-0.3, 1.05, 0); ship.add(lamp);
    const lrings = makeRings(44, { color: 0xffffff, width: 0.07, y: 0.3, opacity: 0.8 }); lworld.add(lrings);
    const mkEye = (x) => { const g = new THREE.Group(); g.position.set(x, 0, 0); const b = sphere(0.55, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), 20); b.position.y = 0.7; g.add(b); const st = box(0.12, 0.4, 0.12, M.metal(0x8a909c)); st.position.y = 0.2; g.add(st); L.add(g); g.ball = b; return g; };
    const eyeA = mkEye(6.5), eyeB = mkEye(-6.5);
    const lEA = stage.label('', [6.5, 2.0, 0], L, 'hot'), lEB = stage.label('', [-6.5, 2.0, 0], L, 'hot'), lShip = stage.label('', [0, 2.1, 0], L);
    let lt = 0, lsx = 0, lNext = 0;

    // ================================================================ MYTH
    const Y = new THREE.Group(); Y.position.x = YX; root.add(Y);
    Y.add(strip(60, 40, 0x10141b, 0)); Y.add(strip(30, 1.5, 0x232831, 0.012));
    const amb = makeAmbulance(0.8); Y.add(amb);
    const you = makePerson({ s: 1.25 }); you.position.set(0, 0, MYTH.d / 10); Y.add(you);
    const yrings = makeRings(50, { color: hex(COL.wave), width: 0.07, y: 0.3 }); Y.add(yrings);
    const lYou = stage.label('', [0, 1.9, MYTH.d / 10 + 0.4], Y, 'hot'); lYou.element.style.setProperty('--c', COL.lam);
    let yt = 0, yx = -MYTH.XR, yNext = 0, HY = mythAt(-MYTH.XR);

    // ================================================================ board
    let S = null, focus = '', key = '';
    const bd = board(root, 6.2, 4.2, 640, 432, (g, w, h) => {
      panelBg(g, w, h);
      if (!S) return;
      if (focus === 'light') {
        title(g, 'Light: between the two sound rules', '');
        const ax2 = axes(g, w, h, { x0: 76, y1: 64, y0: h - 92, xMax: 0.9, yMin: 1, yMax: 5, xTicks: [0, 0.3, 0.6, 0.9], yTicks: [1, 2, 3, 4, 5], xFmt: (x) => (x ? x.toFixed(1) + ' c' : '0'), yFmt: (y) => y + '×', xLabel: 'speed of approach', yLabel: 'f′ ÷ f' });
        const { X, Y: Yy } = ax2;
        clipTo(g, ax2, () => {
          curve(g, (b) => 1 / (1 - b), 0, 0.9, X, Yy, 'rgba(255,255,255,.4)', 3, [6, 5]);
          curve(g, (b) => 1 + b, 0, 0.9, X, Yy, 'rgba(255,255,255,.4)', 3, [2, 5]);
          curve(g, (b) => 1 / relRatio(b), 0, 0.9, X, Yy, COL.hi, 5);
        });
        text(g, 'sound, source moving', X(0.36), Yy(3.2), COL.soft, '15px sans-serif');
        text(g, 'sound, listener moving', X(0.5), Yy(1.28), COL.soft, '15px sans-serif');
        text(g, 'light', X(0.78), Yy(2.5), COL.hi, 'bold 17px sans-serif');
        dot(g, X(S.beta), Yy(Math.min(5, 1 / relRatio(S.beta))), COL.hot, 9);
        text(g, `${S.lam} nm lamp: ${(S.lam * relRatio(S.beta)).toFixed(0)} nm from ahead, ${(S.lam / relRatio(S.beta)).toFixed(0)} nm from behind`, 76, h - 12, COL.text, 'bold 18px sans-serif');
      } else if (focus === 'myth') {
        title(g, 'Pitch and loudness as it passes', 'computed');
        const x0 = 84, x1 = w - 28, X = (x) => x0 + ((x + MYTH.XR) / (2 * MYTH.XR)) * (x1 - x0);
        const lane = (yTop, hgt, lo, hi, fn, col, lab) => {
          g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1; g.strokeRect(x0, yTop, x1 - x0, hgt);
          g.strokeStyle = col; g.lineWidth = 5; g.beginPath();
          for (let i = 0; i <= 220; i++) { const x = -MYTH.XR + (2 * MYTH.XR * i) / 220, yy = yTop + hgt - ((fn(x) - lo) / (hi - lo)) * hgt; i ? g.lineTo(X(x), yy) : g.moveTo(X(x), yy); }
          g.stroke(); text(g, lab, x0 + 8, yTop + 22, col, 'bold 16px sans-serif');
          return (v) => yTop + hgt - ((v - lo) / (hi - lo)) * hgt;
        };
        const f = MYTH.f, yF = lane(60, 130, f * 0.9, f * 1.1, (x) => f * mythAt(x).ratio, COL.lam, 'pitch (Hz): flat, then it falls');
        const dB = (x) => -20 * Math.log10(mythAt(x).dist / MYTH.d);
        const yL = lane(212, 130, -32, 2, dB, COL.hot, 'loudness: this is what rises');
        text(g, fmt0(f * 1.06), 30, yF(f * 1.06) + 6, COL.soft, '15px sans-serif'); text(g, fmt0(f * 0.94), 30, yF(f * 0.94) + 6, COL.soft, '15px sans-serif');
        text(g, '0 dB', 30, yL(0) + 6, COL.soft, '15px sans-serif'); text(g, '−30', 30, yL(-30) + 6, COL.soft, '15px sans-serif');
        const xx = clamp(yx, -MYTH.XR, MYTH.XR);
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(xx), 60); g.lineTo(X(xx), 342); g.stroke(); g.setLineDash([]);
        dot(g, X(xx), yF(f * HY.ratio), COL.lam, 8); dot(g, X(xx), yL(dB(xx)), COL.hot, 8);
        text(g, 'coming', x0, 368, COL.soft, '16px sans-serif'); text(g, 'passes you', X(0) - 40, 368, COL.soft, '16px sans-serif'); text(g, 'going', x1 - 44, 368, COL.soft, '16px sans-serif');
        text(g, 'The pitch never rises. The loudness does.', x0, h - 14, COL.text, 'bold 19px sans-serif');
      } else {
        const Mn = S.mach;
        title(g, 'The formula hits a wall', 'f′ ÷ f = 1 ÷ (1 − M)');
        const ax2 = axes(g, w, h, { x0: 76, y1: 64, y0: h - 92, xMax: 3, yMax: 10, xTicks: [0, 1, 2, 3], yTicks: [0, 5, 10], xFmt: (x) => 'Mach ' + x, yFmt: (y) => y + '×', yLabel: 'pitch ahead' });
        const { X, Y: Yy } = ax2;
        clipTo(g, ax2, () => {
          g.fillStyle = 'rgba(255,181,71,.1)'; g.fillRect(X(1), Yy(10), X(3) - X(1), Yy(0) - Yy(10));
          curve(g, (m) => 1 / (1 - m), 0, 0.905, X, Yy, COL.hi, 5);
          line(g, [[1, 0], [1, 10]], X, Yy, '#ff7a7a', 3, [6, 5]);
        });
        text(g, 'sound barrier', X(1) + 8, Yy(9.2), '#ff9a9a', 'bold 16px sans-serif');
        text(g, 'no sound gets ahead:', X(1.45), Yy(6.4), COL.hot, '16px sans-serif');
        text(g, 'a cone, sin μ = 1 ÷ M', X(1.45), Yy(5.4), COL.hot, 'bold 17px sans-serif');
        if (Mn < 1) dot(g, X(Mn), Yy(Math.min(10, 1 / (1 - Mn))), COL.hot, 9); else dot(g, X(Mn), Yy(0.25), COL.hot, 9);
        text(g, Mn < 1 ? `Mach ${Mn.toFixed(2)}: pitch ahead × ${(1 / (1 - Mn)).toFixed(1)}` : `Mach ${Mn.toFixed(2)}: cone half-angle ${(Math.asin(1 / Mn) / TAU * 360).toFixed(0)}°`, 76, h - 12, COL.text, 'bold 19px sans-serif');
      }
    }, [0, 0, 0], 0);
    const tone = makeTone();
    const seekJet = (u) => { ax = u * U5; rings.clear(); since = 0; steady = 0; inside = false; heardBoom = false; aNext = at; };

    return {
      seek: seekJet,
      dispose() { stage.floor.visible = true; tone.stop(); },
      update(dt, s) {
        dt = Math.max(0, dt); S = s;
        const narrow = fitNarrow(stage, [lAlt, lShip, lJet]);
        if (s.focus !== focus) { focus = s.focus; focusView(stage, VIEWS, focus); key = ''; if (focus === 'mach') seekJet(-14); }
        phoneView(stage, 'lim' + focus, focus === 'mach' ? { pos: [MX, 7.4, 25], target: [MX, 6.2, 0] } : focus === 'light' ? { pos: [LX, 13, 12], target: [LX, 0, -2.4] } : { pos: [YX, 11, 10.5], target: [YX, 0, -2.4] });
        A.visible = focus === 'mach'; L.visible = focus === 'light'; Y.visible = focus === 'myth';
        let play = false, pf = 440, loud = 0;
        if (focus === 'mach') {
          placeBoard(bd, [MX + 8.6, 12.4, -2, 1.85, 0, -0.2], inReel() ? [MX + 0.5, 20, -2, 3.0, 0] : [MX + 1.5, 13.2, -2, 2.0, 0], stage);
          const vs = s.mach * V_AIR, T = dt * 4, every = 0.45;
          const t0 = at; at += T; ax += vs * T; since += vs * T;
          steady = Math.abs(s.mach - mPrev) > 1e-4 ? 0 : steady + vs * T; mPrev = s.mach;     // the straight lines only fit a steady speed
          if (ax > 15 * U5) seekJet(-15);
          if (aNext < t0 - 2 || aNext > at + every) aNext = t0;
          while (aNext <= at) { rings.emit((ax - vs * (at - aNext)) / U5, ALT / U5, aNext); aNext += every; }
          rings.update(at, V_AIR / U5, 13, 0.07);
          jet.position.set(ax / U5, ALT / U5, 0);
          const sup = s.mach > 1.005, mu = sup ? Math.asin(1 / s.mach) : Math.PI / 2;
          c1.visible = c2.visible = sup && Math.min(since, steady) > 300;
          if (sup) {
            const len = Math.min(26, (Math.min(since, steady) / U5) * Math.cos(mu)), jx = ax / U5, jy = ALT / U5;
            c1.scale.x = c2.scale.x = Math.max(0.001, len);
            c1.position.set(jx - (len / 2) * Math.cos(mu), jy - (len / 2) * Math.sin(mu), 0.02); c1.rotation.z = mu;
            c2.position.set(jx - (len / 2) * Math.cos(mu), jy + (len / 2) * Math.sin(mu), 0.02); c2.rotation.z = -mu;
            lMu.position.set(jx - 3.2 * Math.cos(mu), jy - 3.2 * Math.sin(mu) + 0.9, 0); lMu.element.innerHTML = `μ = <b>${(mu / TAU * 360).toFixed(0)}°</b>`;
          }
          lMu.visible = sup && Math.min(since, steady) > 2500;
          // has the cone (or, below Mach 1, the first ring) reached the listener?
          const reach = sup ? ALT * Math.sqrt(s.mach * s.mach - 1) : 0;
          const now = sup ? ax - XL >= reach && since >= ax - XL + ALT / Math.sqrt(s.mach * s.mach - 1) : rings.rings.some((r) => r.live && Math.hypot(XL / U5 - r.x, -r.z) <= r.R);
          if (sup && now && !inside) { boom = 1; heardBoom = true; }
          inside = now;
          boom = approach(boom, 0, 2.2, dt); bang.material.opacity = 0.85 * boom; bang.scale.setScalar(0.6 + 3 * boom);
          lJet.position.set(ax / U5, ALT / U5 + 1.0, 0); lJet.element.innerHTML = `Mach <b>${s.mach.toFixed(2)}</b>`;
          lMan.element.innerHTML = sup ? (inside ? '<b>BOOM</b>, then the roar' : 'hears nothing yet') : inside ? 'hears the jet' : 'not yet';
          lMan.element.style.setProperty('--c', sup && inside ? COL.hot : '#aab3c2');
        } else if (focus === 'light') {
          placeBoard(bd, [LX + 6.9, 3.2, -6.6, 1.3, -0.55], inReel() ? [LX, 5.4, -11.5, 2.4, -0.55] : [LX + 1.5, 3.0, -9.5, 1.5, -0.55], stage);
          const b = s.beta, gam = gammaOf(b), every = 0.22 * gam, v = b * CS;
          const t0 = lt; lt += dt; lsx += v * dt;
          if (lNext < t0 - 2 || lNext > lt + every) lNext = t0;
          while (lNext <= lt) { lrings.emit(lsx - v * (lt - lNext), 0, lNext); lNext += every; }
          lrings.update(lt, CS, 12.5);
          if (lsx > 300) { lsx -= 300; lrings.rings.forEach((r) => { r.x -= 300; }); }
          lworld.position.x = -lsx;
          const base = Math.floor(lsx / 30) * 30;
          stars.forEach((st) => { let x = base + st.x; if (x - lsx < -15) x += 30; if (x - lsx > 15) x -= 30; st.d.position.set(x, 0.1, st.z); });
          const la = s.lam * relRatio(b), lb = s.lam / relRatio(b);
          lamp.material.color.setRGB(...nmRGB(s.lam));
          eyeA.ball.material.color.setRGB(...eyeColor(la)); eyeB.ball.material.color.setRGB(...eyeColor(lb));
          lEA.element.innerHTML = `ahead sees <b>${la.toFixed(0)} nm</b>`; lEA.element.style.setProperty('--c', COL.hi);
          lEB.element.innerHTML = `behind sees <b>${lb.toFixed(0)} nm</b>`; lEB.element.style.setProperty('--c', COL.lo);
          lShip.element.textContent = `lamp: ${s.lam} nm`;
        } else {
          placeBoard(bd, [YX + 6.9, 3.0, -6.4, 1.3, -0.55], inReel() ? [YX, 5.4, -11.5, 2.4, -0.55] : [YX + 1.5, 3.0, -9.5, 1.5, -0.55], stage);
          const T = dt * 0.5, K = 28, every = K / MYTH.f;
          const t0 = yt; yt += T; yx += MYTH.u * T;
          if (yx > MYTH.XR) { yx = -MYTH.XR; }
          if (yNext < t0 - 1 || yNext > yt + every) yNext = t0;
          while (yNext <= yt) { yrings.emit((yx - MYTH.u * (yt - yNext)) / 10, 0, yNext); yNext += every; }
          yrings.update(yt, V_AIR / 10, 14);
          amb.position.set(yx / 10, 0.02, 0);
          HY = mythAt(yx);
          const lvl = -20 * Math.log10(HY.dist / MYTH.d);
          lYou.element.innerHTML = `hears <b>${fmtHz(MYTH.f * HY.ratio)}</b> · ${dBs(lvl)}`;
          play = s.sound; pf = MYTH.f * HY.ratio; loud = clamp(Math.pow(10, lvl / 20) * 2.2, 0.03, 1);
        }
        tone.follow(play, pf, loud);
        const kk = `${focus}|${s.mach}|${s.beta}|${s.lam}|${focus === 'myth' ? Math.round(yx) : 0}`;
        if (kk !== key) { key = kk; bd.redraw(); }
      },
      readout(s) {
        if (s.focus === 'light') {
          const b = s.beta, la = s.lam * relRatio(b), lb = s.lam / relRatio(b), g = gammaOf(b);
          return lean(`<div class="big">λ′ = λ √((1+β) ÷ (1−β))</div>
            <div class="row"><span>Speed, β = v ÷ c</span><b>${b.toFixed(3)} · ${fmt0((b * C) / 1000)} km/s</b></div>
            <div class="row"><span>The lamp sends out</span><b>${s.lam} nm, ${bandOf(s.lam)}</b></div>
            <div class="row"><span>Seen from ahead</span><b style="color:${COL.hi}">${la.toFixed(0)} nm, ${bandOf(la)}</b></div>
            <div class="row"><span>Seen from behind</span><b style="color:${COL.lo}">${lb.toFixed(0)} nm, ${bandOf(lb)}</b></div>
            <div class="row"><span>Moving clock runs slow, γ</span><b>${g.toFixed(3)}×</b></div>
            <div class="row"><span>Seen side-on: λ × γ</span><b>${(s.lam * g).toFixed(0)} nm</b></div>
            <small>Red 630 nm turns green 530 nm at ${(greenBeta * 100).toFixed(1)}% of light speed.</small>`, [0, 2, 3]);
        }
        if (s.focus === 'myth') {
          const f = MYTH.f, far = f * mythAt(-100).ratio, near = f * mythAt(-10).ratio, lvl = -20 * Math.log10(HY.dist / MYTH.d);
          return lean(`<div class="big">Pitch now: ${fmtHz(f * HY.ratio)}</div>
            <div class="row"><span>Siren at 72 km/h, 4 m away</span><b>${f} Hz</b></div>
            <div class="row"><span>Pitch, 100 m off, coming</span><b style="color:${COL.lam}">${far.toFixed(1)} Hz</b></div>
            <div class="row"><span>Pitch, 10 m off, coming</span><b style="color:${COL.lam}">${near.toFixed(1)} Hz</b></div>
            <div class="row"><span>Pitch change on the way in</span><b>${(near - far).toFixed(1).replace('-', '−')} Hz</b></div>
            <div class="row"><span>Loudness change on the way in</span><b style="color:${COL.hot}">+${(20 * Math.log10(mythAt(-100).dist / mythAt(-10).dist)).toFixed(0)} dB</b></div>
            <div class="row"><span>Loudness now (0 = nearest)</span><b>${dBs(lvl)}</b></div>
            <small>Rising loudness is heard as rising pitch:<br>the Doppler illusion (Neuhoff, McBeath 1996).</small>`, [1, 2, 4]);
        }
        const Mn = s.mach, sup = Mn > 1.005, mu = sup ? (Math.asin(1 / Mn) / TAU) * 360 : 0;
        return lean(`<div class="big">Mach ${Mn.toFixed(2)}: ${sup ? 'it outruns its own sound' : Mn >= 0.995 ? 'the crests pile up on the nose' : 'its sound still gets ahead'}</div>
          <div class="row"><span>Jet speed, vₛ</span><b>${fmt0(Mn * V_AIR)} m/s · ${fmt0(Mn * V_AIR * KMH)} km/h</b></div>
          <div class="row"><span>Pitch ahead, f × v ÷ (v − vₛ)</span><b class="${Mn < 0.995 ? 'ok' : 'no'}">${Mn < 0.995 ? `× ${(1 / (1 - Mn)).toFixed(1)}` : Mn <= 1.005 ? '÷ 0: breaks down' : 'negative: no meaning'}</b></div>
          <div class="row"><span>Mach cone half-angle, asin(1 ÷ M)</span><b style="color:${COL.hot}">${sup ? mu.toFixed(1) + '°' : 'no cone'}</b></div>
          <div class="row"><span>Cone reaches the ground, behind the jet</span><b>${sup ? ((ALT * Math.sqrt(Mn * Mn - 1)) / 1000).toFixed(1) + ' km' : 'n/a'}</b></div>
          <div class="row"><span>Listener on the ground</span><b>${sup ? (heardBoom && inside ? 'has heard the boom' : 'silence so far') : 'hears it coming'}</b></div>
          <small>Jet at 3 km. Time runs 4× fast. Sound taken as 343 m/s at every height.</small>`, [0, 2, 3]);
      },
    };
  },
};
