// Chapter 1: the Doppler effect as a live experiment. 1 scene unit = 10 m, seen from above.
// A siren of frequency f drives along a road at vs through still air, where sound travels at
// v = 343 m/s (20 °C). The camera rides with the siren, so the road scrolls past underneath.
// Every ring is one wave crest (one in every K, so they are far enough apart to see). A ring is born
// where the siren was at that instant and then grows at v, centred on that spot for ever: the air does
// not know the siren has moved on. Nothing else is drawn in. Ahead, each new ring starts closer to the
// last one, so the crests are (v − vs) ÷ f apart; behind they are (v + vs) ÷ f apart.
// A listener beside the road (6 m from the siren's path) moves at vo against the traffic. The pitch they
// hear is worked out two ways: from the general Doppler geometry (doppler.js, heard()), and by simply
// counting the rings that sweep over them. On the line of travel both give
//   f′ = f × (v + vo) ÷ (v − vs)   coming together,   f′ = f × (v − vo) ÷ (v + vs)   moving apart.
import { THREE, M, box, sphere, approach, clamp } from '../kit.js';
import {
  V_AIR, COL, hex, fmt0, fmtHz, fmtL, kmh, noteOf, ratioLine, heard, makeRings, makeTone, unlockAudio, board, panelBg, axes, title, line,
  curve, dot, text, clipTo, makeAmbulance, makePerson, strip, bracket, fitNarrow, placeBoard, phoneView, lean, inReel,
} from '../doppler.js';

const U = 10;                 // metres in one scene unit
const ZL = 0.6;               // the listener stands 6 m from the siren's path
const EDGE = 11;              // the listener re-enters from the other side beyond this (units)
const batch = (f) => Math.max(1, Math.round(0.04 * f));     // one ring for every K crests
const VIEW = { pos: [0.6, 12.5, 11.5], target: [0.6, 0, -2.4] };

export default {
  id: 'idea',
  short: 'The Doppler effect',
  title: 'A moving source squeezes its own waves',
  subtitle: 'Each crest spreads from where the source was, so they bunch up ahead and stretch out behind.',
  view: VIEW,
  learn: `<p>An ambulance races past and its siren seems to drop: <b>eeee-yowww</b>. The siren never changed. What changed is how often its sound waves reached your ear. That is the <b>Doppler effect</b>.</p>
    <p>Watch the rings. Each one is a wave <b>crest</b>, and each spreads out as a circle from the spot <b>where the siren was</b> when it made it. Sound in air always travels at about <b>343 m/s</b>, whatever the siren is doing. But the siren keeps driving forward, so it starts every new crest a little closer to the last one. <b>Ahead</b>, the crests are <b>bunched up</b>. <b>Behind</b>, they are <b>stretched out</b>.</p>
    <p>Your ear counts crests. Bunched crests arrive more often, so you hear a <b>higher frequency</b>, a higher pitch. Stretched crests arrive less often: a <b>lower pitch</b>. The rule along the line of travel is <b>f′ = f × (v + vₒ) ÷ (v − vₛ)</b>, where v is the wave speed, vₛ is the source's speed towards you and vₒ is your speed towards the source. Moving apart, flip both signs.</p>
    <p>The listener matters too. Run <b>towards</b> a sound and you meet its crests sooner, so you hear it higher. Run away and you hear it lower. And if you ride <b>alongside</b> the siren at its own speed, nothing shifts at all: only motion that changes the <b>distance</b> between you counts.</p>
    <p>Everyday speeds give small shifts. A car at 60 km/h changes the pitch by about 5%, less than a semitone. The sliders here go much faster so you can see the squeeze. (How waves work in the first place is in WaveClear.)</p>
    <p class="tip"><b>Try it:</b> set the source speed to zero and see perfect circles. Speed it up and watch the gap ahead shrink. Then press <b>Ride alongside</b> and check that the listener hears the true pitch again.</p>`,
  terms: [
    { t: 'Doppler effect', d: 'The change in the frequency you receive when a wave’s source and its receiver are getting closer or farther apart.' },
    { t: 'Frequency (f)', d: 'How many wave crests are made, or arrive, each second, in hertz (Hz). We hear it as pitch.' },
    { t: 'Wavefront', d: 'A line joining points on the same crest. From a small source it is a circle (in 3D, a sphere).' },
    { t: 'Wavelength (λ)', d: 'The distance between one crest and the next. A moving source shortens it ahead and lengthens it behind.' },
    { t: 'Wave speed (v)', d: 'How fast crests travel through the medium: about 343 m/s for sound in air. The source’s motion does not change it.' },
    { t: 'Medium', d: 'The stuff a wave travels through. For sound it is the air, and speeds are measured against it.' },
  ],
  defaults: { f: 440, vs: 100, vo: 0, sound: false, slow: 0.125 },
  onChange(s, key) { if (key === 'sound' && s.sound) unlockAudio(); },
  controls: [
    { key: 'vs', type: 'range', label: 'Source speed, vₛ', min: 0, max: 300, step: 1, ends: ['still', '300 m/s'], fmt: (v) => `${v} m/s · ${kmh(v)} · Mach ${(v / V_AIR).toFixed(2)}` },
    { key: 'vo', type: 'range', label: 'Listener speed against the traffic, vₒ', min: -100, max: 100, step: 1, ends: ['same way', 'towards'], fmt: (v) => (v === 0 ? 'standing still' : `${Math.abs(v)} m/s ${v > 0 ? 'towards the oncoming source' : 'the same way as the source'}`) },
    { key: 'f', type: 'range', label: 'Siren frequency, f', min: 110, max: 880, step: 1, ends: ['110 Hz', '880 Hz'], fmt: (v) => `${v} Hz (${noteOf(v)})` },
    { key: 'sound', type: 'toggle', label: 'Hear what the listener hears', hint: 'A tone at the computed pitch. It needs the ♪ sound switch on.' },
    { key: 'slow', type: 'seg', label: 'Slow motion', options: [{ v: 0.25, label: '4× slower' }, { v: 0.125, label: '8× slower' }, { v: 0.0625, label: '16× slower' }] },
    { key: 'go', type: 'buttons', label: 'Shortcuts', items: [
      { label: 'Stop the source', act: (s) => { s.vs = 0; } },
      { label: 'Ride alongside', act: (s) => { s.vo = -Math.min(100, s.vs); if (s.vs > 100) s.vs = 100; } },
      { label: 'Express train, 160 km/h', act: (s) => { s.vs = 44; s.vo = 0; } },
    ] },
  ],
  quiz: [
    { q: 'A siren makes 400 crests a second and drives towards you. Why do you hear more than 400 a second?', options: ['The siren vibrates faster when it moves', 'Sound travels faster from a moving source', 'Each crest starts closer to the one before, so they reach you closer together', 'The air gets thicker in front'], answer: 2, why: 'The siren and the speed of sound are unchanged. The source moves forward between crests, so ahead of it they are bunched and arrive more often.' },
    { q: 'A 440 Hz horn comes straight at you at 100 m/s. Sound travels at 343 m/s. What do you hear?', options: ['About 621 Hz', 'About 540 Hz', '440 Hz', 'About 341 Hz'], answer: 0, why: 'f′ = f × v ÷ (v − vₛ) = 440 × 343 ÷ 243 ≈ 621 Hz. Going away it would be 440 × 343 ÷ 443 ≈ 341 Hz.' },
    { q: 'You cycle beside a moving band wagon at exactly its speed. How does its music sound?', options: ['Higher', 'Lower', 'Unchanged', 'Silent'], answer: 2, why: 'The distance between you and the source is not changing, so there is no Doppler shift. (v + vₒ) ÷ (v − vₛ) with vₒ = −vₛ gives exactly 1.' },
  ],
  reel: [
    { ms: 5400, caption: 'Every sound wave spreads from where the siren was, so a moving siren bunches its waves ahead.', set: { f: 440, vo: 0, slow: 0.125 }, act: (s, inst) => inst.place?.(9), anim: { vs: [0, 170] }, spin: 0, view: { pos: [0, 15, 7.5], target: [0, 0, -3.2] } },
    { ms: 5400, caption: 'Bunched waves arrive more often, so you hear a higher pitch. Behind, they stretch and the pitch drops.', set: { f: 440, vs: 150, vo: 0, slow: 0.25 }, act: (s, inst) => inst.place?.(4.6), spin: 0, view: { pos: [0, 15, 7.5], target: [0, 0, -3.2] } },
  ],

  build({ stage }) {
    stage.phoneKey = null;
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const world = new THREE.Group(); root.add(world);        // everything fixed to the ground and the air
    // ---------------------------------------------------------------- the set
    const ground = strip(90, 60, 0x10141b, 0); root.add(ground);
    const road = strip(90, 1.5, 0x232831, 0.012); root.add(road);
    const dashes = Array.from({ length: 26 }, () => { const d = box(0.7, 0.012, 0.08, M.glow(0x9aa3b2)); world.add(d); return d; });
    const posts = Array.from({ length: 12 }, () => { const p = box(0.08, 0.5, 0.08, M.glow(0x465061)); world.add(p); return p; });
    const siren = makeAmbulance(0.8); siren.position.y = 0.02; root.add(siren);
    const rings = makeRings(46, { color: hex(COL.wave), width: 0.07, y: 0.32 }); world.add(rings);
    const ear = new THREE.Group(); world.add(ear);
    const person = makePerson({ s: 1.25 }); ear.add(person);
    const halo = sphere(0.3, new THREE.MeshBasicMaterial({ color: hex(COL.hot), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), 16); halo.position.y = 1.2; ear.add(halo);
    const mover = box(0.5, 0.05, 0.3, M.plastic(0x5b6577)); mover.position.y = 0.03; ear.add(mover);
    const brA = bracket(hex(COL.hi)), brB = bracket(hex(COL.lo)); world.add(brA, brB);
    const lA = stage.label('', [0, 0, 0], world, 'hot'), lB = stage.label('', [0, 0, 0], world, 'hot');
    lA.element.style.setProperty('--c', COL.hi); lB.element.style.setProperty('--c', COL.lo);
    const lS = stage.label('', [0, 1.5, 0], root, 'hot'); lS.element.style.setProperty('--c', COL.f);
    const lE = stage.label('', [0, 1.9, 0], ear, 'hot'); lE.element.style.setProperty('--c', COL.hot);
    const lWas = stage.label('each ring is centred where the siren was', [0, 0, 0], world);

    // ---------------------------------------------------------------- the chart
    let S = null, H = null;
    const bd = board(root, 6.2, 4.2, 640, 432, (g, w, h) => {
      panelBg(g, w, h);
      if (!S) return;
      title(g, 'Pitch you hear', 'f′ ÷ f against source speed');
      const ax = axes(g, w, h, { x0: 70, y1: 64, y0: h - 92, xMax: 0.9, yMax: 3, xTicks: [0, 0.3, 0.6, 0.9], yTicks: [0, 1, 2, 3], xFmt: (v) => (v ? v.toFixed(1) : '0'), yFmt: (v) => v + '×', xLabel: 'source speed ÷ speed of sound' });
      const { X, Y } = ax, m = S.vs / V_AIR, mo = S.vo / V_AIR;
      clipTo(g, ax, () => {
        line(g, [[0, 1], [0.9, 1]], X, Y, 'rgba(255,255,255,.35)', 2, [6, 6]);
        curve(g, (x) => (1 + mo) / (1 - x), 0, 0.9, X, Y, COL.hi, 5);
        curve(g, (x) => (1 - mo) / (1 + x), 0, 0.9, X, Y, COL.lo, 5);
      });
      text(g, 'ahead: higher', X(0.36), Y(2.25), COL.hi, 'bold 18px sans-serif');
      text(g, 'behind: lower', X(0.5), Y(0.36), COL.lo, 'bold 18px sans-serif');
      const ra = (1 + mo) / (1 - m), rb = (1 - mo) / (1 + m);
      if (ra <= 3) dot(g, X(m), Y(ra), COL.hi, 9);
      dot(g, X(m), Y(rb), COL.lo, 9);
      text(g, `${S.f} Hz siren:  ${fmt0(S.f * ra)} Hz ahead,  ${fmt0(S.f * rb)} Hz behind`, 70, h - 12, COL.text, 'bold 19px sans-serif');
    }, [0, 0, 0], -0.55);

    // ---------------------------------------------------------------- state
    let t = 0, sx = 0, lx = 80, nextEmit = 0, order = [], lastCross = null, counted = null, flash = 0, key = '';
    const tone = makeTone();
    const dist = (r) => Math.hypot(lx / U - r.x, ZL - r.z);
    const resync = () => { rings.rings.forEach((r) => { if (r.live) { r.gap = dist(r) - r.R; r.hit = r.gap <= 0; } }); lastCross = null; counted = null; };
    const place = (rel) => { lx = sx + rel * U; resync(); };

    return {
      place,
      dispose() { stage.floor.visible = true; tone.stop(); },
      update(dt, s) {
        dt = Math.max(0, dt); S = s;
        const narrow = fitNarrow(stage, [lWas, lS]);
        phoneView(stage, 'idea', { pos: [0, 12.5, 11.5], target: [0, 0, -2.6] });
        placeBoard(bd, [6.6, 3.2, -6.6, 1.5], inReel() ? [0, 5.4, -11.5, 2.4] : [1.5, 3.0, -9.5, 1.5], stage);
        const T = dt * s.slow, K = batch(s.f), every = K / s.f;
        // move the source and the listener, then emit the crests that fell due in this step
        const t0 = t; t += T; sx += s.vs * T; lx -= s.vo * T;
        if (nextEmit < t0 - 1 || nextEmit > t + every) nextEmit = t0;
        while (nextEmit <= t) {
          const r = rings.emit((sx - s.vs * (t - nextEmit)) / U, 0, nextEmit);
          order.push(r); if (order.length > 46) order.shift();
          nextEmit += every;
        }
        rings.update(t, V_AIR / U, 12.5);
        // the listener counts rings as they sweep past
        for (const r of rings.rings) {
          if (!r.live || r.hit) continue;
          const gap = dist(r) - r.R;
          if (gap <= 0) {
            const tc = Number.isFinite(r.gap) && r.gap > 0 ? t - (T * -gap) / (r.gap - gap) : t;
            if (lastCross !== null && tc > lastCross) counted = K / (tc - lastCross);
            lastCross = tc; r.hit = true; flash = 1;
          }
          r.gap = gap;
        }
        // wrap the listener round when they leave the picture
        let rel = (lx - sx) / U;
        if (rel < -EDGE) { lx += 2 * EDGE * U; resync(); } else if (rel > EDGE) { lx -= 2 * EDGE * U; resync(); }
        rel = (lx - sx) / U;
        // keep the numbers small: slide everything back now and then
        if (sx > 4000) { const d = 4000; sx -= d; lx -= d; rings.rings.forEach((r) => { r.x -= d / U; }); }
        world.position.x = -sx / U;
        const base = Math.floor(sx / U / 2) * 2;
        dashes.forEach((d, i) => d.position.set(base + (i - 13) * 2 + 1, 0.02, 0));
        const pb = Math.floor(sx / U / 5) * 5;
        posts.forEach((p, i) => p.position.set(pb + (Math.floor(i / 2) - 3) * 5, 0.25, i % 2 ? 1.5 : -1.5));
        ear.position.set(lx / U, 0, ZL);
        mover.visible = Math.abs(s.vo) > 0.5;
        flash = approach(flash, 0, 9, dt); halo.material.opacity = 0.75 * flash; halo.scale.setScalar(0.6 + 1.2 * flash);
        siren.lamp.material.color.setHex(Math.sin(t / s.slow * 9) > 0 ? 0x5aa0ff : 0xff4d5e);
        // what the listener hears, from the geometry of where each crest was emitted
        H = heard([sx, 0], [s.vs, 0], [lx, ZL * U], [-s.vo, 0]);
        const fh = H ? s.f * H.ratio : s.f;
        tone.follow(s.sound, fh, clamp(60 / (H ? H.dist : 60), 0.25, 1));
        // crest spacing, measured between two real rings ahead and behind the source
        const live = order.filter((r) => r.live && r.R > 0.05);
        const a = live[live.length - 3], b = live[live.length - 4];
        const show = !!(a && b) && !inReel();
        brA.visible = brB.visible = show; lA.visible = lB.visible = show;
        if (show) {
          const xa0 = a.x + a.R, xa1 = b.x + b.R, xb0 = b.x - b.R, xb1 = a.x - a.R;
          brA.set(xa0, xa1, 0.36, 0); brB.set(xb0, xb1, 0.36, 0);
          lA.position.set((xa0 + xa1) / 2 + 0.8, 0.36, -1.5); lB.position.set((xb0 + xb1) / 2 - 0.8, 0.36, -1.5);
          lA.element.innerHTML = `ahead: crests <b>${fmtL(((xa1 - xa0) * U) / K)}</b> apart`;
          lB.element.innerHTML = `behind: <b>${fmtL(((xb1 - xb0) * U) / K)}</b> apart`;
        }
        const old = live[Math.max(0, live.length - 9)];
        lWas.visible = !narrow && !!old && s.vs > 20;
        if (old) lWas.position.set(old.x, 0.4, 1.9);
        lS.element.innerHTML = `siren: <b>${s.f} Hz</b>`;
        lE.element.innerHTML = `hears <b>${fmtHz(fh)}</b>`;
        const kk = `${s.f}|${s.vs}|${s.vo}`;
        if (kk !== key) { key = kk; bd.redraw(); }
      },
      readout(s) {
        const ra = ratioLine(V_AIR, s.vs, s.vo), rb = ratioLine(V_AIR, -s.vs, -s.vo), K = batch(s.f);
        const fh = H ? s.f * H.ratio : s.f;
        const term = (toward) => (s.vo === 0 ? '343' : `(343 ${(s.vo > 0) === toward ? '+' : '−'} ${Math.abs(s.vo)})`);
        return lean(`<div class="big">f′ = f × (v + vₒ) ÷ (v − vₛ)</div>
          <div class="row"><span>Ahead: ${s.f} × ${term(true)} ÷ (343 − ${s.vs})</span><b style="color:${COL.hi}">${fmtHz(s.f * ra)}</b></div>
          <div class="row"><span>Behind: ${s.f} × ${term(false)} ÷ (343 + ${s.vs})</span><b style="color:${COL.lo}">${fmtHz(s.f * rb)}</b></div>
          <div class="row"><span>Crests ahead, (v − vₛ) ÷ f</span><b>${fmtL((V_AIR - s.vs) / s.f)}</b></div>
          <div class="row"><span>Crests behind, (v + vₛ) ÷ f</span><b>${fmtL((V_AIR + s.vs) / s.f)}</b></div>
          <div class="row"><span>This listener hears now</span><b style="color:${COL.hot}">${fmtHz(fh)} (${noteOf(fh)})</b></div>
          <div class="row"><span>Counted from the rings passing</span><b style="color:${COL.lam}">${counted ? fmtHz(counted) : 'counting…'}</b></div>
          <small>One ring for every ${K} crest${K > 1 ? 's' : ''}. Time is slowed ${Math.round(1 / s.slow)}×.</small>`, [0, 1, 4, 5]);
      },
    };
  },
};
