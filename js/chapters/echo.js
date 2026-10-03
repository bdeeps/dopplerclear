// Chapter 3: echoes that measure speed. Send a wave of known frequency at something that moves, and
// the echo comes back shifted twice: once because the target runs into the wave, once because it then
// re-sends it as a moving source. For a target much slower than the wave:
//   Δf = 2 f₀ v cos θ ÷ c      (θ between the target's motion and the beam; c is the wave's speed)
// "gun" (1 unit = 2 m): a radar speed gun and a cricket ball. The pitch is 22 yards = 20.12 m between
//   the stumps (MCC Laws of Cricket, Law 6). Traffic and sports guns use microwaves: X band 10.525 GHz,
//   K band 24.15 GHz, Ka band about 34.7 GHz (Wikipedia, "Radar speed gun"; its example: 24.15 GHz and
//   30 m/s give 4.83 kHz, which this formula reproduces). A gun off the line of flight reads v cos θ,
//   always low (the "cosine effect"). The ball's speed is held constant here; a real ball slows in the
//   air and at the bounce, and the figure shown on television is taken just after release.
//   Fastest electronically measured ball: Shoaib Akhtar, 161.3 km/h, 22 February 2003, Cape Town
//   (Guinness World Records; the ICC notes that speed guns are not uniform enough for an official record).
// "blood" (1 unit = 1 cm): Doppler ultrasound. A probe sends ultrasound of 2 to 8 MHz into the body at
//   an angle to a blood vessel; red blood cells scatter it back. Scanners assume c = 1,540 m/s in soft
//   tissue and keep the beam within about 60° of the flow, because cos θ changes fast beyond that and is
//   zero at 90° (Wikipedia, "Doppler ultrasonography"). Display convention: red towards the probe, blue
//   away ("BART": blue away, red towards). Typical speeds: about 30 cm/s on average in the aorta and
//   around 1 m/s at the peak of each beat (Guyton & Hall). The shift lands in the range of human
//   hearing, so machines can also play it as a whooshing sound.
// The waves are drawn hugely slowed (radio waves about a million times, ultrasound about 400 times) so
// that the squeeze is visible. Each echo ring is born at the target when an outgoing ring reaches it,
// so the echo spacing is produced by the motion, not drawn in.
import { THREE, M, box, sphere, beam, clamp } from '../kit.js';
import {
  TAU, C, C_TISSUE, KMH, COL, hex, fmt0, fmtBig, fmtHz, echoShift, makeRings, makeTone, unlockAudio, board, panelBg, axes, title, line, curve, dot, text,
  clipTo, makePerson, strip, dots, fitNarrow, placeBoard, phoneView, lean, focusView, inReel,
} from '../doppler.js';

const BANDS = { 10.525: 'X band', 24.15: 'K band', 34.7: 'Ka band' };
const PITCH = 20.12;                      // m between the two sets of stumps
const CW = 250, CWB = 400;                // drawn wave speeds: m/s for the radar scene, cm/s for the blood scene
const GX = 0, BX = 60;                    // the two scenes sit apart along x
const VIEWS = {
  gun: { pos: [GX - 3.4, 12.5, 12.5], target: [GX - 3.4, 0.2, -2.6] },
  blood: { pos: [BX - 2.3, 5.6, 15], target: [BX - 2.3, 5.0, 0] },
};
const D2R = Math.PI / 180;

export default {
  id: 'echo',
  short: 'Speed guns and ultrasound',
  title: 'Bounce a wave off it and read its speed',
  subtitle: 'A radar gun clocks a cricket ball, and ultrasound clocks the blood in an artery.',
  view: VIEWS.gun,
  learn: `<p>The Doppler effect is not just something you hear. It is a <b>speedometer</b>. Send out a wave of a known frequency, let it bounce off a moving thing, and compare the echo with what you sent. The difference tells you the speed.</p>
    <p>An echo is shifted <b>twice</b>. The moving target runs into your waves, so it meets them more often. Then it sends them back as a moving source, squeezing them again. For anything much slower than the wave, the change is <b>Δf = 2 × f₀ × v ÷ c</b>.</p>
    <p>A <b>radar speed gun</b> does this with microwaves. The one that puts <b>“145 km/h”</b> on the screen at a cricket match sits beyond the boundary in line with the pitch. At 24.15 GHz, a 145 km/h ball shifts the echo by about 6,500 Hz: tiny next to 24 billion, but easy for electronics to count. Traffic police use the same gun on cars.</p>
    <p>There is a catch: the gun only sees motion <b>along its beam</b>. From off to one side it reads <b>v × cos θ</b>, which is always a little <b>low</b>. That is why the gun is placed in line with the ball's flight.</p>
    <p><b>Doppler ultrasound</b> uses the same idea with high-pitched sound inside the body. A probe sends ultrasound at a few million hertz. Moving red blood cells scatter it back, shifted. The machine turns the shift into the <b>speed and direction of blood flow</b>, usually coloured red for flow towards the probe and blue for flow away. It is how an echocardiogram shows blood moving through the heart's chambers (see HeartClear and CirculationClear).</p>
    <p class="tip"><b>Try it:</b> bowl faster and watch the orange echo crests crowd together. Move the gun off the line and see it read low. Then tilt the ultrasound beam to 90° and watch the shift vanish.</p>`,
  terms: [
    { t: 'Doppler shift (Δf)', d: 'The difference between the frequency sent and the frequency received.' },
    { t: 'Radar', d: 'Finding things by bouncing radio waves or microwaves off them. A Doppler radar also measures their speed.' },
    { t: 'Cosine effect', d: 'A beam at an angle θ to the motion only measures v × cos θ, so it reads low.' },
    { t: 'Ultrasound', d: 'Sound too high to hear, above 20,000 Hz. Medical probes use 2 to 15 million hertz.' },
    { t: 'Doppler ultrasound', d: 'An ultrasound scan that measures how fast blood, or the heart wall, is moving and in which direction.' },
    { t: 'Lidar', d: 'A speed gun that times pulses of laser light instead of using the Doppler shift.' },
  ],
  defaults: { focus: 'gun', ball: 145, band: 24.15, off: 0, vb: 60, fb: 5, th: 50, dir: 'to', sound: false },
  onChange(s, key) { if (key === 'sound' && s.sound) unlockAudio(); },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'gun', label: 'Cricket speed gun' }, { v: 'blood', label: 'Blood-flow ultrasound' }] },
    { key: 'ball', type: 'range', label: 'Gun: ball speed', min: 60, max: 165, step: 0.5, ends: ['60 km/h', '165 km/h'], fmt: (v) => `${v.toFixed(1)} km/h · ${(v / KMH).toFixed(1)} m/s` },
    { key: 'band', type: 'seg', label: 'Gun: radar frequency', options: [{ v: 10.525, label: 'X · 10.525 GHz' }, { v: 24.15, label: 'K · 24.15 GHz' }, { v: 34.7, label: 'Ka · 34.7 GHz' }] },
    { key: 'off', type: 'range', label: 'Gun: how far off the line of the pitch', min: 0, max: 40, step: 1, ends: ['in line', '40°'], fmt: (v) => `${v}° · reads ${(Math.cos(v * D2R) * 100).toFixed(1)}% of the speed` },
    { key: 'bowl', type: 'buttons', label: 'Gun: bowl', items: [
      { label: 'Spinner, 85', act: (s) => { s.focus = 'gun'; s.ball = 85; } },
      { label: 'Fast, 145', act: (s) => { s.focus = 'gun'; s.ball = 145; } },
      { label: 'Record, 161.3', act: (s) => { s.focus = 'gun'; s.ball = 161.3; } },
    ] },
    { key: 'vb', type: 'range', label: 'Ultrasound: blood speed', min: 5, max: 150, step: 1, ends: ['5 cm/s', '150 cm/s'], fmt: (v) => `${v} cm/s` },
    { key: 'th', type: 'range', label: 'Ultrasound: angle between beam and flow, θ', min: 30, max: 90, step: 1, ends: ['30°', '90°'], fmt: (v) => `${v}° · cos θ = ${Math.cos(v * D2R).toFixed(2)}` },
    { key: 'fb', type: 'seg', label: 'Ultrasound: probe frequency', options: [{ v: 2, label: '2 MHz' }, { v: 5, label: '5 MHz' }, { v: 8, label: '8 MHz' }] },
    { key: 'dir', type: 'seg', label: 'Ultrasound: blood flows', options: [{ v: 'to', label: 'Towards the probe' }, { v: 'away', label: 'Away from it' }] },
    { key: 'sound', type: 'toggle', label: 'Hear the shift, Δf', hint: 'Both shifts fall in the range of hearing. It needs the ♪ sound switch on.' },
  ],
  quiz: [
    { q: 'Why is the echo from a moving target shifted twice as much as you might expect?', options: ['The gun sends two beams', 'The target meets the waves more often, then re-sends them as a moving source', 'Radio waves speed up when they bounce', 'The gun is moving too'], answer: 1, why: 'A reflector acts first as a moving listener and then as a moving source. The two shifts add, giving Δf = 2 f₀ v ÷ c.' },
    { q: 'A speed gun stands 30° off the line of a ball travelling at 140 km/h. What does it show?', options: ['About 162 km/h', '140 km/h', 'About 121 km/h', '0 km/h'], answer: 2, why: 'It measures only the part of the speed along its beam: 140 × cos 30° ≈ 121 km/h. An off-line gun always reads low.' },
    { q: 'An ultrasound beam crosses an artery at exactly 90° to the flow. What Doppler shift does it measure?', options: ['The largest possible', 'Half the usual', 'None', 'A negative one'], answer: 2, why: 'cos 90° = 0. Blood crossing the beam at right angles is not getting nearer or farther, so there is no shift. That is why the probe is tilted.' },
  ],
  reel: [
    { ms: 5200, caption: 'A radar gun bounces microwaves off a cricket ball. The echo comes back squeezed: Δf = 2 f₀ v ÷ c.', set: { focus: 'gun', band: 24.15, off: 0 }, anim: { ball: [90, 160] }, spin: 0, view: { pos: [GX - 2.6, 15, 7], target: [GX - 2.6, 0, -4.6] } },
    { ms: 5200, caption: 'Doppler ultrasound does the same with sound, measuring how fast blood flows and which way.', set: { focus: 'blood', fb: 5, th: 50, dir: 'to' }, anim: { vb: [20, 120] }, spin: 0, view: { pos: [BX + 0.4, 6.4, 10], target: [BX + 0.4, 6.6, 0] } },
  ],

  build({ stage }) {
    stage.phoneKey = null;
    const root = new THREE.Group(); stage.root.add(root);
    // ================================================================ GUN (1 unit = 2 m)
    const G = new THREE.Group(); G.position.x = GX; root.add(G);
    const HALF = PITCH / 4;                                       // half the pitch in units
    const grass = strip(46, 30, 0x14291b, 0.004); G.add(grass);
    const pitch = strip(PITCH / 2 + 1.2, 1.52, 0xb79d6a, 0.012); G.add(pitch);
    const stumpM = M.plastic(0xf2ead8);
    for (const x of [-HALF, HALF]) for (const z of [-0.06, 0, 0.06]) G.add(beam([x, 0, z], [x, 0.36, z], 0.012, stumpM, 8));
    for (const x of [-HALF + 0.61, HALF - 0.61]) { const c = box(0.02, 0.006, 1.52, M.glow(0xf2f4f7)); c.position.set(x, 0.02, 0); G.add(c); }
    const bowler = makePerson({ shirt: 0x2c5f9e, s: 0.95 }); bowler.position.set(-HALF - 0.1, 0, -0.35); G.add(bowler);
    const batter = makePerson({ shirt: 0xf2f4f7, s: 0.95 }); batter.position.set(HALF - 0.55, 0, 0.3); G.add(batter);
    const bat = box(0.05, 0.42, 0.06, M.plastic(0xd9b77a)); bat.position.set(HALF - 0.75, 0.25, 0.12); bat.rotation.z = 0.35; G.add(bat);
    const ball = sphere(0.085, M.plastic(0xc8102e, { roughness: 0.35 }), 16); G.add(ball);
    const gun = new THREE.Group(); G.add(gun);
    gun.add(beam([0, 0, 0], [0, 0.9, 0], 0.03, M.metal(0x8a909c), 8));
    const gbody = box(0.5, 0.3, 0.3, M.plastic(0x2b3039)); gbody.position.y = 1.0; gun.add(gbody);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 20, 1, true), M.metal(0xd8dde6, { side: THREE.DoubleSide })); dish.rotation.z = Math.PI / 2; dish.position.set(0.36, 1.0, 0); gun.add(dish);
    const out = makeRings(26, { color: hex(COL.wave), width: 0.07, y: 0.55, opacity: 0.85 }); G.add(out);
    const back = makeRings(26, { color: hex(COL.hot), width: 0.07, y: 0.6, opacity: 0.95 }); G.add(back);
    const lGun = stage.label('', [0, 0, 0], G, 'hot'); lGun.element.style.setProperty('--c', COL.wave);
    const lBall = stage.label('', [0, 0, 0], G, 'hot'); lBall.element.style.setProperty('--c', COL.hot);
    const lSlow = stage.label('radio waves drawn about a million times slower than real', [0, 0.1, 3.4], G);
    const lPitch = stage.label('pitch: 20.12 m', [0, 0.1, 1.3], G);
    let gt = 0, bx = -HALF, rest = 0, gNext = 0;
    const GR = 5;                                                 // the gun stands 10 m behind the bowler's stumps (drawn close; real ones sit beyond the boundary)

    // ================================================================ BLOOD (1 unit = 1 cm)
    const B = new THREE.Group(); B.position.x = BX; root.add(B);
    const YS = 4.2, YV = 1.6, RV = 0.42, HX = 0.8;                // skin height, vessel centre height and radius, where the beam meets the vessel
    const tissue = box(9, YS, 3.4, M.clear(0xe8a78f, 0.16)); tissue.position.set(0, YS / 2, 0); B.add(tissue);
    const skin = box(9, 0.14, 3.4, M.plastic(0xd9a184)); skin.position.set(0, YS + 0.07, 0); B.add(skin);
    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(RV, RV, 9, 24, 1, true), M.clear(0xff5a5a, 0.22)); vessel.rotation.z = Math.PI / 2; vessel.position.set(0, YV, 0); B.add(vessel);
    const NCELL = 150, cells = dots(NCELL, 0.085, 0xd81e2c, true, 10); B.add(cells);
    const cell = Array.from({ length: NCELL }, (_, i) => { const a = (i * 2.399) % TAU, r = RV * 0.9 * Math.sqrt(((i * 0.618) % 1)); return { x: ((i * 7.31) % 9) - 4.5, y: Math.cos(a) * r, z: Math.sin(a) * r, k: 1 - (r / RV) ** 2 }; });
    const marker = sphere(0.14, M.glow(0xffffff), 12); B.add(marker);
    const probe = new THREE.Group(); B.add(probe);
    const pbody = box(0.9, 1.7, 0.9, M.plastic(0xe9eef5)); pbody.position.y = 0.95; probe.add(pbody);
    const pface = box(0.95, 0.14, 0.95, M.plastic(0x3d7bd9)); pface.position.y = 0.07; probe.add(pface);
    const cord = beam([0, 1.8, 0], [0, 2.6, 0], 0.07, M.matte(0x2b3039), 8); probe.add(cord);
    const bOut = makeRings(22, { color: hex(COL.wave), width: 0.05, plane: 'xy', z: 0.02, opacity: 0.85 }); B.add(bOut);
    const bBack = makeRings(22, { color: hex(COL.hot), width: 0.05, plane: 'xy', z: 0.04, opacity: 0.95 }); B.add(bBack);
    const beamLine = box(1, 0.02, 0.02, M.ghost(0x8ef0ff, 0.5)); B.add(beamLine);
    const flowBox = box(1.3, 2 * RV, 0.04, M.ghost(0xff3b3b, 0.5)); flowBox.position.set(HX, YV, 0.5); B.add(flowBox);
    const lProbe = stage.label('probe', [0, 0, 0], B), lSkin = stage.label('skin', [3.9, YS + 0.6, 0], B), lVes = stage.label('artery', [-3.6, YV + 0.9, 0], B);
    const lTh = stage.label('', [HX + 0.9, YV + 0.9, 0], B, 'hot'); lTh.element.style.setProperty('--c', COL.lam);
    const lFlow = stage.label('', [HX + 2.6, YV - 0.95, 0], B, 'hot');
    const lSlowB = stage.label('ultrasound drawn about 400 times slower than real', [0, -0.5, 0], B);
    let bt = 0, mx = 0, bNext = 0;

    // ================================================================ board
    let S = null, focus = '', key = '';
    const bd = board(root, 6.2, 4.2, 640, 432, (g, w, h) => {
      panelBg(g, w, h);
      if (!S) return;
      if (focus === 'blood') {
        const v = S.vb / 100, f0 = S.fb * 1e6;
        title(g, 'Shift against beam angle', 'Δf = 2 f₀ v cos θ ÷ c');
        const top = Math.max(500, Math.ceil(echoShift(f0, v, C_TISSUE, Math.cos(30 * D2R)) / 500) * 500);
        const ax = axes(g, w, h, { x0: 92, y1: 64, y0: h - 92, xMax: 90, yMax: top, xTicks: [0, 30, 60, 90], yTicks: [0, top / 2, top], xFmt: (x) => x + '°', yFmt: (y) => fmt0(y), xLabel: 'angle between beam and flow', yLabel: 'Hz' });
        const { X, Y } = ax;
        clipTo(g, ax, () => {
          g.fillStyle = 'rgba(255,90,90,.12)'; g.fillRect(X(60), Y(top), X(90) - X(60), Y(0) - Y(top));
          curve(g, (a) => echoShift(f0, v, C_TISSUE, Math.cos(a * D2R)), 0, 90, X, Y, COL.lam, 5);
        });
        text(g, 'beyond 60°: angle', X(60) + 8, Y(top) + 24, '#ff9a9a', '15px sans-serif');
        text(g, 'errors matter a lot', X(60) + 8, Y(top) + 44, '#ff9a9a', '15px sans-serif');
        dot(g, X(S.th), Y(echoShift(f0, v, C_TISSUE, Math.cos(S.th * D2R))), COL.hot, 9);
        text(g, `${Math.round(S.vb)} cm/s at ${S.th}°, ${S.fb} MHz probe: ${fmt0(echoShift(f0, v, C_TISSUE, Math.cos(S.th * D2R)))} Hz`, 92, h - 12, COL.text, 'bold 19px sans-serif');
      } else {
        title(g, 'Echo shift against speed', 'Δf = 2 f₀ v ÷ c');
        const ax = axes(g, w, h, { x0: 84, y1: 64, y0: h - 92, xMax: 180, yMax: 12, xTicks: [0, 60, 120, 180], yTicks: [0, 4, 8, 12], yFmt: (y) => y + '', xLabel: 'speed (km/h)', yLabel: 'kHz' });
        const { X, Y } = ax;
        clipTo(g, ax, () => {
          for (const b of [10.525, 24.15, 34.7]) curve(g, (k) => echoShift(b * 1e9, k / KMH, C) / 1000, 0, 180, X, Y, b === S.band ? COL.lam : 'rgba(255,255,255,.3)', b === S.band ? 5 : 2);
        });
        [[10.525, 'X'], [24.15, 'K'], [34.7, 'Ka']].forEach(([b, n]) => text(g, n, X(172), Y(echoShift(b * 1e9, 172 / KMH, C) / 1000) - 8, b === S.band ? COL.lam : COL.soft, 'bold 17px sans-serif'));
        const vr = (S.ball / KMH) * Math.cos(S.off * D2R);
        dot(g, X(vr * KMH), Y(echoShift(S.band * 1e9, vr, C) / 1000), COL.hot, 9);
        text(g, `${S.ball.toFixed(1)} km/h ball: echo ${fmt0(echoShift(S.band * 1e9, vr, C))} Hz higher`, 84, h - 12, COL.text, 'bold 19px sans-serif');
      }
    }, [0, 0, 0], -0.5);
    const tone = makeTone();
    // an outgoing ring has reached the target: start an echo ring there, aimed back at the sender
    const echo = (pool, r, sender, tx, tz, tvx, tvz, t, T, gap, half) => {
      const tc = Number.isFinite(r.gap) && r.gap > 0 ? t - (T * -gap) / (r.gap - gap) : t;
      const px = tx - tvx * (t - tc), pz = tz - tvz * (t - tc), a = Math.atan2(sender[1] - pz, sender[0] - px);
      pool.emit(px, pz, tc, { a0: a - half, a1: a + half });
    };

    return {
      dispose() { tone.stop(); },
      update(dt, s) {
        dt = Math.max(0, dt); S = s;
        const narrow = fitNarrow(stage, [lSlow, lPitch, lSkin, lVes, lSlowB, lProbe]);
        if (s.focus !== focus) { focus = s.focus; focusView(stage, VIEWS, focus); key = ''; out.clear(); back.clear(); bOut.clear(); bBack.clear(); }
        phoneView(stage, 'echo' + focus, focus === 'gun' ? { pos: [GX - 2.5, 12.5, 12.5], target: [GX - 2.5, 0.2, -2.4] } : { pos: [BX - 0.8, 5, 14.5], target: [BX - 0.8, 4.6, 0] });
        G.visible = focus === 'gun'; B.visible = focus === 'blood';
        if (focus === 'gun') placeBoard(bd, [GX + 2.4, 3.4, -7.2, 1.6], inReel() ? [GX - 2.6, 5.4, -10.5, 2.4] : [GX - 2.2, 2.8, -9.2, 1.5], stage);
        else placeBoard(bd, [BX + 2.6, 9.9, 0, 0.92, 0], inReel() ? [BX + 0.4, 10.6, 0, 1.4, 0] : [BX - 3.4, 10.4, 0, 1.0, 0], stage);
        if (focus === 'gun') {
          const v = s.ball / KMH, T = dt / 8, off = s.off * D2R;
          const gp = [-HALF - GR * Math.cos(off), GR * Math.sin(off)];       // gun position (x, z)
          gun.position.set(gp[0], 0, gp[1]); gun.rotation.y = off;
          const t0 = gt; gt += T;
          // the ball: from the bowler's hand to the batter, then a short pause
          if (rest > 0) { rest -= T; if (rest <= 0) bx = -HALF + 0.3; } else { bx += (v / 2) * T; if (bx > HALF - 0.5) rest = 0.12; }
          const u = clamp((bx + HALF) / (2 * HALF), 0, 1), flying = rest <= 0;
          ball.visible = flying;
          ball.position.set(bx, u < 0.72 ? 1.1 * (1 - (u / 0.72) ** 1.6) + 0.085 : 0.085 + 0.9 * (u - 0.72), 0);
          // outgoing crests, aimed at the middle of the pitch
          const every = 0.012, aim = Math.atan2(-gp[1], -gp[0]);
          if (gNext < t0 - 1 || gNext > gt + every) gNext = t0;
          while (gNext <= gt) { out.emit(gp[0] + 0.5 * Math.cos(aim), gp[1] + 0.5 * Math.sin(aim), gNext, { a0: aim - 0.2, a1: aim + 0.2 }); gNext += every; }
          out.update(gt, CW / 2, 15); back.update(gt, CW / 2, 13);
          for (const r of out.rings) {
            if (!r.live) continue;
            const gap = Math.hypot(bx - r.x, -r.z) - r.R;
            if (!r.hit && gap <= 0) { r.hit = true; if (flying) echo(back, r, gp, bx, 0, v / 2, 0, gt, T, gap, 0.38); }
            r.gap = gap;
          }
          const cos = Math.cos(off), df = echoShift(s.band * 1e9, v, C, cos);
          lGun.position.set(gp[0], 1.9, gp[1]); lGun.element.innerHTML = `gun reads <b>${(s.ball * cos).toFixed(1)} km/h</b>`;
          lBall.position.set(bx, 1.75, 0); lBall.visible = flying; lBall.element.innerHTML = `echo <b>+${fmt0(df)} Hz</b>`;
          lPitch.visible = !narrow && s.off < 12;
          tone.follow(s.sound, df, 0.6);
        } else {
          const v = s.vb, sgn = s.dir === 'to' ? -1 : 1, T = dt / 40, th = s.th * D2R;
          // the beam runs from the probe, right and down, to the vessel at (HX, YV)
          const dx = Math.cos(th), dy = -Math.sin(th), L = (YS - YV) / Math.sin(th), px = HX - dx * L, py = YS + 0.14;
          probe.position.set(px, py, 0); probe.rotation.z = Math.PI / 2 - th;
          const bl = L + 1.2; beamLine.scale.x = bl; beamLine.position.set(px + dx * bl / 2, py + dy * bl / 2, 0); beamLine.rotation.z = -th;
          const t0 = bt; bt += T;
          cell.forEach((c, i) => { c.x += sgn * v * c.k * T; if (c.x > 4.5) c.x -= 9; if (c.x < -4.5) c.x += 9; cells.place(i, c.x, YV + c.y, c.z); }); cells.done();
          mx += sgn * v * T; if (mx > 0.8) mx -= 1.6; if (mx < -0.8) mx += 1.6;
          marker.position.set(HX + mx, YV, 0);
          const every = 0.0015, aim = Math.atan2(dy, dx);
          if (bNext < t0 - 1 || bNext > bt + every) bNext = t0;
          while (bNext <= bt) { bOut.emit(px + dx * 0.1, py + dy * 0.1 - 0.14, bNext, { a0: aim - 0.3, a1: aim + 0.3 }); bNext += every; }
          bOut.update(bt, CWB, L + 0.9); bBack.update(bt, CWB, L + 0.2);
          for (const r of bOut.rings) {
            if (!r.live) continue;
            const gap = Math.hypot(HX + mx - r.x, YV - r.z) - r.R;
            if (!r.hit && gap <= 0) { r.hit = true; echo(bBack, r, [px, py], HX + mx, YV, sgn * v, 0, bt, T, gap, 0.45); }
            r.gap = gap;
          }
          const toward = s.dir === 'to', none = s.th === 90;
          flowBox.material.color.setHex(none ? 0x555b66 : toward ? 0xff3b3b : 0x3b7bff);
          lProbe.position.set(px - dx * 1.6, py - dy * 1.6 + 0.9, 0);
          lTh.element.innerHTML = `θ = <b>${s.th}°</b>`;
          lFlow.element.innerHTML = none ? 'no shift: flow is across the beam' : toward ? `towards the probe: shown <b>red</b>` : `away from the probe: shown <b>blue</b>`;
          lFlow.element.style.setProperty('--c', none ? '#aab3c2' : toward ? '#ff7a7a' : '#7fa8ff');
          tone.follow(s.sound, Math.max(40, echoShift(s.fb * 1e6, v / 100, C_TISSUE, Math.cos(th))), 0.6);
        }
        const kk = `${focus}|${s.ball}|${s.band}|${s.off}|${s.vb}|${s.fb}|${s.th}`;
        if (kk !== key) { key = kk; bd.redraw(); }
      },
      readout(s) {
        if (s.focus === 'blood') {
          const cos = Math.cos(s.th * D2R), df = echoShift(s.fb * 1e6, s.vb / 100, C_TISSUE, cos);
          return lean(`<div class="big">Δf = 2 f₀ v cos θ ÷ c = ${fmt0(df)} Hz</div>
            <div class="row"><span>Probe sends, f₀</span><b>${s.fb} MHz</b></div>
            <div class="row"><span>Blood speed, v</span><b>${s.vb} cm/s</b></div>
            <div class="row"><span>Beam to flow, θ (cos θ)</span><b style="color:${COL.lam}">${s.th}° (${cos.toFixed(2)})</b></div>
            <div class="row"><span>Sound in soft tissue, c</span><b>1,540 m/s</b></div>
            <div class="row"><span>Echo comes back</span><b style="color:${s.th === 90 ? '#aab3c2' : s.dir === 'to' ? '#ff7a7a' : '#7fa8ff'}">${s.th === 90 ? 'unchanged' : `${fmt0(df)} Hz ${s.dir === 'to' ? 'higher' : 'lower'}`}</b></div>
            <small>The machine turns Δf back into speed and direction. The shift is in the range of hearing, so it can be played as sound.</small>`, [1, 2, 4]);
        }
        const v = s.ball / KMH, cos = Math.cos(s.off * D2R), df = echoShift(s.band * 1e9, v, C, cos);
        return lean(`<div class="big">Gun reads ${(s.ball * cos).toFixed(1)} km/h</div>
          <div class="row"><span>Gun sends, f₀ (${BANDS[s.band]})</span><b>${s.band} GHz</b></div>
          <div class="row"><span>Ball speed, v</span><b>${s.ball.toFixed(1)} km/h = ${v.toFixed(1)} m/s</b></div>
          <div class="row"><span>Echo shift, 2 f₀ v cos θ ÷ c</span><b style="color:${COL.hot}">+${fmt0(df)} Hz</b></div>
          <div class="row"><span>That is one part in</span><b>${fmtBig((s.band * 1e9) / Math.max(1, df))}</b></div>
          <div class="row"><span>Gun off the line by ${s.off}°</span><b class="${s.off ? 'no' : 'ok'}">${s.off ? `reads ${(s.ball * (1 - cos)).toFixed(1)} km/h low` : 'reads true'}</b></div>
          <div class="row"><span>Time to cover the 20.12 m pitch</span><b>${(PITCH / v).toFixed(2)} s</b></div>
          <small>The ball’s speed is held steady here. A real ball slows in the air and at the bounce.</small>`, [1, 2, 4]);
      },
    };
  },
};
