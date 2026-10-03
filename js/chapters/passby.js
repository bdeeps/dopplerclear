// Chapter 2: the pass-by. 1 scene unit = 10 m, seen from above; the ground and the air are still.
// "train": a train sounds its horn (f) as it runs along a straight track at speed u. A listener stands
//   d metres from the track. "you": the horn is fixed on a post d metres from a road and the listener
//   drives past in a car at u.
// The pitch is never typed in. Each instant the model finds where the sound arriving now was emitted
// (doppler.js, heard(): the sound left the train τ seconds ago, from u τ back down the track, and
// |listener − that point| = v τ), then uses only the part of the motion along that line:
//   train moves:  f′ = f ÷ (1 − (u ÷ v) cos θ)        you move:  f′ = f × (1 + (u ÷ v) cos θ)
// θ is the angle between the motion and the line of sound. Far away cos θ = ±1 (the straight-line
// formula); level with you cos θ = 0, so the true pitch is heard there. That is why the pitch slides
// smoothly instead of jumping. With a moving train the true pitch arrives d ÷ v seconds after the
// train passes its nearest point, when it is already u d ÷ v beyond you.
// Speeds for scale: Vande Bharat trains run at up to 160 km/h in service; Japan's Shinkansen at 320 km/h.
import { THREE, M, box, sphere, approach, clamp } from '../kit.js';
import {
  V_AIR, KMH, COL, hex, fmt0, fmtHz, noteOf, semitones, heard, makeRings, makeTone, unlockAudio, board, panelBg, axes, title, line, curve, dot, text,
  clipTo, makeTrain, makeCar, makePerson, strip, fitNarrow, placeBoard, phoneView, lean, inReel,
} from '../doppler.js';

const U = 10, XR = 140;                       // metres per unit; the mover runs from −XR to +XR
const batch = (f) => Math.max(1, Math.round(0.04 * f));
const VIEW = { pos: [0.8, 13, 11.5], target: [0.8, 0, -2.2] };
// heard frequency ratio with the mover at x (m), speed u (m/s), listener or horn d (m) from the path
export function passRatio(mode, x, u, d) {
  const h = mode === 'train' ? heard([x, 0], [u, 0], [0, d], [0, 0]) : heard([0, d], [0, 0], [x, 0], [u, 0]);
  return h;
}
const intervalName = (st) => (st < 0.75 ? 'under a semitone' : st < 1.5 ? 'about a semitone' : st < 2.5 ? 'about a whole tone' : st < 3.5 ? 'about a minor third' : st < 4.5 ? 'about a major third' : st < 5.5 ? 'about a fourth' : 'more than a fourth');

export default {
  id: 'passby',
  short: 'The pass-by',
  title: 'Why the pitch slides as it passes',
  subtitle: 'A train horn, a listener beside the track, and the smooth drop between two pitches.',
  view: VIEW,
  learn: `<p>Stand near a railway line as an express goes through with its horn on. The horn sounds <b>high</b> as it comes, then slides <b>down</b> as it goes by. The musical gap between the two is the Doppler shift, and you can work out the train's speed from it.</p>
    <p>Far down the track the train is coming almost straight at you, so you hear <b>f × v ÷ (v − u)</b>. Far away on the other side you hear <b>f × v ÷ (v + u)</b>. At 110 km/h a 400 Hz horn goes from about 439 Hz to 367 Hz: a drop of about three semitones.</p>
    <p>Why does it <b>slide</b> instead of jumping? Because the train does not run through you. Only the part of its speed that points <b>along the line to your ear</b> counts. As it comes level, more and more of its motion is sideways, so the shift fades to nothing, then grows the other way. Stand close to the track and the slide is quick. Stand far back and it is slow and gentle.</p>
    <p>The orange dot shows something easy to miss: the sound you hear <b>now</b> left the train a moment <b>ago</b>, from farther back down the track. You hear the horn's true pitch a little after the train has passed you.</p>
    <p>Now switch to <b>You drive past</b>. The horn stands still and you move. You still hear a drop, but not quite the same one: <b>f × (1 + u ÷ v)</b> down to <b>f × (1 − u ÷ v)</b>. For sound it matters who is moving through the <b>air</b>. Film sound designers add this slide to make a pass-by feel real (see FilmSoundClear).</p>
    <p class="tip"><b>Try it:</b> move the listener from 2 m to 100 m from the track and watch the curve go from a cliff to a gentle slope. The two end pitches do not change.</p>`,
  terms: [
    { t: 'Radial speed', d: 'The part of a speed that points straight towards or away from you. Only this part causes a Doppler shift.' },
    { t: 'Pass-by', d: 'The moment a moving source goes past. The pitch slides from above the true note to below it.' },
    { t: 'Semitone', d: 'The smallest step on a piano, a frequency ratio of about 1.06. Twelve make an octave.' },
    { t: 'Sound delay', d: 'Sound takes time to reach you, about 3 seconds per kilometre, so you hear where the source was, not where it is.' },
    { t: 'Closest approach', d: 'The point where the source is nearest. There its motion is all sideways and the shift is zero.' },
  ],
  defaults: { focus: 'train', kmh: 110, d: 20, f: 400, sound: false, slow: 0.5 },
  onChange(s, key) { if (key === 'sound' && s.sound) unlockAudio(); },
  controls: [
    { key: 'focus', type: 'seg', label: 'Who moves', options: [{ v: 'train', label: 'The train passes you' }, { v: 'you', label: 'You drive past' }] },
    { key: 'kmh', type: 'range', label: 'Speed, u', min: 20, max: 320, step: 5, ends: ['20 km/h', '320 km/h'], fmt: (v) => `${v} km/h · ${(v / KMH).toFixed(1)} m/s` },
    { key: 'd', type: 'range', label: 'Distance from the track or road, d', min: 2, max: 100, step: 1, ends: ['2 m', '100 m'], fmt: (v) => `${v} m` },
    { key: 'f', type: 'range', label: 'Horn frequency, f', min: 150, max: 900, step: 5, ends: ['150 Hz', '900 Hz'], fmt: (v) => `${v} Hz (${noteOf(v)})` },
    { key: 'sound', type: 'toggle', label: 'Hear the pitch slide', hint: 'A tone at the computed pitch. It needs the ♪ sound switch on.' },
    { key: 'slow', type: 'seg', label: 'Show time at', options: [{ v: 1, label: 'Real speed' }, { v: 0.5, label: '½' }, { v: 0.25, label: '¼' }] },
    { key: 'go', type: 'buttons', label: 'Shortcuts', items: [
      { label: 'Run it again', act: (s, inst) => inst.seek?.(-XR) },
      { label: 'Vande Bharat, 160 km/h', act: (s, inst) => { s.focus = 'train'; s.kmh = 160; inst.seek?.(-XR); } },
      { label: 'Bullet train, 320 km/h', act: (s, inst) => { s.focus = 'train'; s.kmh = 320; inst.seek?.(-XR); } },
    ] },
  ],
  quiz: [
    { q: 'A train horn slides down in pitch as it passes. When do you hear the horn’s true pitch?', options: ['While it is far away and coming', 'Just as the sound from its nearest point reaches you', 'Never', 'Only when it has stopped'], answer: 1, why: 'At its nearest point the train moves sideways to you, not towards or away, so that sound is not shifted. It reaches you a moment after the train has passed.' },
    { q: 'You move back from 5 m to 80 m from the track. What changes about the pitch drop?', options: ['The two end pitches move closer together', 'It takes longer: the slide becomes gentler', 'The pitch now rises instead', 'Nothing at all'], answer: 1, why: 'The far-away pitches depend only on the train’s speed. Farther back, the angle changes more slowly, so the same drop is spread over more time.' },
    { q: 'A 400 Hz horn passes at 30 m/s. Which is the bigger shift on approach: the horn moving towards you, or you driving towards a still horn?', options: ['The horn moving: 438 Hz against 435 Hz', 'You moving: 438 Hz against 435 Hz', 'They are exactly equal', 'Neither shifts'], answer: 0, why: 'Moving source: 400 × 343 ÷ 313 ≈ 438 Hz. Moving listener: 400 × 373 ÷ 343 ≈ 435 Hz. Sound travels in the air, so who moves through the air matters.' },
  ],
  reel: [
    { ms: 5600, caption: 'A passing train’s horn slides down in pitch. It slides, not jumps, because the train does not run through you.', set: { focus: 'train', kmh: 160, d: 20, f: 400, slow: 0.5 }, act: (s, inst) => inst.seek?.(-65), spin: 0, view: { pos: [0, 16, 8], target: [0, 0, -3.4] } },
    { ms: 5000, caption: 'Drive past a still horn and it drops too, by a slightly different amount: in air it matters who moves.', set: { focus: 'you', kmh: 160, d: 20, f: 400, slow: 0.5 }, act: (s, inst) => inst.seek?.(-58), spin: 0, view: { pos: [0, 16, 8], target: [0, 0, -3.4] } },
  ],

  build({ stage }) {
    stage.phoneKey = null;
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    root.add(strip(90, 60, 0x10141b, 0));
    // the track / road
    const bed = strip(34, 1.0, 0x2a2622, 0.012); root.add(bed);
    const rails = [-0.22, 0.22].map((z) => { const r = box(34, 0.04, 0.05, M.metal(0x9aa3b2)); r.position.set(0, 0.04, z); root.add(r); return r; });
    const roadMarks = Array.from({ length: 17 }, (_, i) => { const m = box(0.7, 0.012, 0.07, M.glow(0x9aa3b2)); m.position.set((i - 8) * 2, 0.02, 0); root.add(m); return m; });
    // metre marks along the path
    [-100, -50, 0, 50, 100].forEach((m) => { const p = box(0.06, 0.02, 0.5, M.glow(0x6d7380)); p.position.set(m / U, 0.02, -0.9); root.add(p); stage.label(m ? `${Math.abs(m)} m` : 'nearest point', [m / U, 0.1, -1.5], root); });
    const train = makeTrain(0.85); root.add(train);
    const car = makeCar(0xffb547, 0.8); root.add(car);
    const person = makePerson({ s: 1.3 }); root.add(person);
    const post = new THREE.Group(); root.add(post);
    const pole = box(0.1, 1.3, 0.1, M.metal(0x8a909c)); pole.position.y = 0.65; post.add(pole);
    const hornM = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 18, 1, true), M.plastic(0xe0453a, { side: THREE.DoubleSide })); hornM.rotation.x = Math.PI / 2; hornM.position.set(0, 1.35, -0.1); post.add(hornM);
    const halo = sphere(0.3, new THREE.MeshBasicMaterial({ color: hex(COL.hot), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), 16); root.add(halo);
    const rings = makeRings(56, { color: hex(COL.wave), width: 0.07, y: 0.3 }); root.add(rings);
    // where the sound you hear now was made, and its path to the ear
    const ghost = sphere(0.16, M.glow(hex(COL.hot)), 14); root.add(ghost);
    const path = box(1, 0.03, 0.03, M.ghost(hex(COL.hot), 0.7)); root.add(path);
    const lGhost = stage.label('the sound you hear now left from here', [0, 0, 0], root, 'hot'); lGhost.element.style.setProperty('--c', COL.hot);
    const lEar = stage.label('', [0, 0, 0], root, 'hot'); lEar.element.style.setProperty('--c', COL.lam);
    const lSrc = stage.label('', [0, 0, 0], root, 'hot'); lSrc.element.style.setProperty('--c', COL.f);

    let S = null, H = null, x = -XR, t = 0, nextEmit = 0, flash = 0, key = '', mode = '';
    const bd = board(root, 6.2, 4.2, 640, 432, (g, w, h) => {
      panelBg(g, w, h);
      if (!S) return;
      const u = S.kmh / KMH, f = S.f;
      title(g, 'Pitch heard as it passes', S.focus === 'train' ? 'the train moves' : 'you move');
      const ax = axes(g, w, h, { x0: 84, y1: 64, y0: h - 92, xMin: -XR, xMax: XR, yMin: 0.7, yMax: 1.45, xTicks: [-100, -50, 0, 50, 100], yTicks: [0.8, 1, 1.2, 1.4], xFmt: (v) => (v > 0 ? '+' : '') + v, yFmt: (v) => fmt0(v * f), xLabel: S.focus === 'train' ? 'where the train is (m)' : 'where you are (m)', yLabel: 'Hz' });
      const { X, Y } = ax, other = S.focus === 'train' ? 'you' : 'train';
      clipTo(g, ax, () => {
        line(g, [[-XR, 1], [XR, 1]], X, Y, COL.f, 2, [6, 6]);
        curve(g, (xx) => passRatio(other, xx, u, S.d).ratio, -XR, XR, X, Y, 'rgba(255,255,255,.3)', 2, [5, 5]);
        curve(g, (xx) => passRatio(S.focus, xx, u, S.d).ratio, -XR, XR, X, Y, COL.lam, 5);
        line(g, [[x, 0.7], [x, 1.45]], X, Y, 'rgba(255,255,255,.45)', 2, [4, 4]);
      });
      text(g, `true pitch ${f} Hz`, X(XR) - 150, Y(1) - 8, COL.f, '16px sans-serif');
      if (H) dot(g, X(clamp(x, -XR, XR)), Y(clamp(H.ratio, 0.7, 1.45)), COL.hot, 9);
      text(g, `${S.d} m away: ${S.d <= 8 ? 'a sudden drop' : S.d <= 35 ? 'a quick slide' : 'a long, gentle slide'}`, 84, h - 12, COL.text, 'bold 19px sans-serif');
    }, [0, 0, 0], -0.55);
    const tone = makeTone();
    const seek = (m) => { x = m; rings.clear(); nextEmit = t; };

    return {
      seek,
      dispose() { stage.floor.visible = true; tone.stop(); },
      update(dt, s) {
        dt = Math.max(0, dt); S = s;
        const narrow = fitNarrow(stage, [lGhost, lSrc]);
        phoneView(stage, 'passby', { pos: [0, 13, 11.5], target: [0, 0, -2.4] });
        placeBoard(bd, [6.2, 3.2, -6.6, 1.5], inReel() ? [0, 5.4, -11.5, 2.4] : [1.5, 3.0, -9.5, 1.5], stage);
        if (s.focus !== mode) { mode = s.focus; seek(-XR * 0.75); }
        const isTrain = mode === 'train', u = s.kmh / KMH, T = dt * s.slow, K = batch(s.f), every = K / s.f;
        const t0 = t; t += T; x += u * T;
        if (x > XR) { x = -XR; if (!isTrain) rings.clear(); }
        const d = s.d, dz = d / U;
        if (nextEmit < t0 - 1 || nextEmit > t + every) nextEmit = t0;
        while (nextEmit <= t) {
          if (isTrain) rings.emit((x - u * (t - nextEmit)) / U, 0, nextEmit); else rings.emit(0, dz, nextEmit);
          nextEmit += every;
        }
        rings.update(t, V_AIR / U, 15);
        // models
        train.visible = isTrain; rails.forEach((r) => { r.visible = isTrain; }); person.visible = isTrain;
        car.visible = !isTrain; post.visible = !isTrain; roadMarks.forEach((m) => { m.visible = !isTrain; });
        bed.material.color.setHex(isTrain ? 0x2a2622 : 0x232831);
        train.position.set(x / U - 0.6, 0.02, 0); car.position.set(x / U, 0.02, 0);
        person.position.set(0, 0, dz); post.position.set(0, 0, dz);
        const ear = isTrain ? [0, dz] : [x / U, 0], src = isTrain ? [x / U, 0] : [0, dz];
        H = passRatio(mode, x, u, d);
        const fh = s.f * H.ratio;
        // rings sweeping over the ear make it flash
        for (const r of rings.rings) {
          if (!r.live) continue;
          const gap = Math.hypot(ear[0] - r.x, ear[1] - r.z) - r.R;
          if (!r.hit && gap <= 0 && Number.isFinite(r.gap) && r.gap > 0) { r.hit = true; flash = 1; }
          r.gap = gap;
        }
        flash = approach(flash, 0, 9, dt); halo.material.opacity = 0.75 * flash; halo.scale.setScalar(0.6 + 1.1 * flash);
        halo.position.set(ear[0], isTrain ? 1.25 : 0.95, ear[1]);
        // the emission point of the sound arriving now
        const ex = H.ex / U, ez = H.ez / U;
        ghost.visible = path.visible = isTrain && !inReel(); lGhost.visible = isTrain && !narrow && Math.abs(x) < 110 && H.tau * u > 4;
        ghost.position.set(ex, 0.75, ez);
        const len = Math.hypot(ear[0] - ex, ear[1] - ez);
        path.scale.x = Math.max(0.001, len); path.position.set((ex + ear[0]) / 2, 0.75, (ez + ear[1]) / 2); path.rotation.y = -Math.atan2(ear[1] - ez, ear[0] - ex);
        lGhost.position.set(ex, 1.5, ez - 0.6);
        lEar.position.set(ear[0], 1.9, ear[1] + (isTrain ? 0.5 : 0));
        lEar.element.innerHTML = `${isTrain ? 'listener' : 'you'} hear${isTrain ? 's' : ''} <b>${fmtHz(fh)}</b>`;
        lSrc.position.set(src[0], isTrain ? 1.5 : 2.1, src[1] - (isTrain ? 0.9 : 0));
        lSrc.element.innerHTML = `horn: <b>${s.f} Hz</b>`;
        tone.follow(s.sound, fh, clamp(25 / Math.max(5, H.dist), 0.15, 1));
        const kk = `${mode}|${s.kmh}|${s.d}|${s.f}|${Math.round(x / 2)}`;
        if (kk !== key) { key = kk; bd.redraw(); }
      },
      readout(s) {
        const u = s.kmh / KMH, isTrain = s.focus === 'train';
        const hi = isTrain ? V_AIR / (V_AIR - u) : 1 + u / V_AIR, lo = isTrain ? V_AIR / (V_AIR + u) : 1 - u / V_AIR;
        const st = semitones(hi / lo), fh = H ? s.f * H.ratio : s.f;
        const alt = isTrain ? 1 + u / V_AIR : V_AIR / (V_AIR - u);
        return lean(`<div class="big">Hears now: ${fmtHz(fh)} (${noteOf(fh)})</div>
          <div class="row"><span>${isTrain ? 'Train' : 'Your'} speed, u</span><b>${s.kmh} km/h = ${u.toFixed(1)} m/s</b></div>
          <div class="row"><span>Coming, far off: ${isTrain ? 'f × v ÷ (v − u)' : 'f × (1 + u ÷ v)'}</span><b style="color:${COL.hi}">${fmtHz(s.f * hi)}</b></div>
          <div class="row"><span>Going, far off: ${isTrain ? 'f × v ÷ (v + u)' : 'f × (1 − u ÷ v)'}</span><b style="color:${COL.lo}">${fmtHz(s.f * lo)}</b></div>
          <div class="row"><span>Total drop</span><b>${st.toFixed(1)} semitones, ${intervalName(st)}</b></div>
          ${isTrain ? `<div class="row"><span>True pitch heard when the train is</span><b>${((u * s.d) / V_AIR).toFixed(1)} m past you</b></div>` : `<div class="row"><span>True pitch heard</span><b>exactly as you pass the horn</b></div>`}
          <div class="row"><span>${isTrain ? 'If you moved instead, coming' : 'If the horn moved instead, coming'}</span><b>${fmtHz(s.f * alt)}</b></div>
          <small>${s.slow < 1 ? `Shown at ${s.slow === 0.5 ? 'half' : 'quarter'} speed. ` : ''}Speed of sound 343 m/s (air at 20 °C).</small>`, [1, 2, 3]);
      },
    };
  },
};
