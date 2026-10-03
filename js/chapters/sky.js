// Chapter 4: the Doppler effect in the sky. Three scenes.
// "radar" (1 unit = 10 km, map seen from above, north at the top): a Doppler weather radar. It sends
//   microwave pulses and measures, for every patch of rain, the part of the wind along its beam. With a
//   wind blowing from compass direction d at speed V, rain at azimuth az has radial speed
//   v_r = −V cos(az − d): towards the radar upwind, away downwind, zero at right angles. Usual colours:
//   green towards, red away. S-band radars work near 2.8 GHz (wavelength 10.7 cm), so Δf = 2 v_r ÷ λ.
//   Pulsed radars really measure the phase change from one pulse to the next, which limits the fastest
//   speed they can read without "folding" to v_max = λ × PRF ÷ 4, while the farthest clear range is
//   c ÷ (2 × PRF): raise one and the other falls, the "Doppler dilemma" (Wikipedia, "Weather radar";
//   NEXRAD: S band 2.7–3.0 GHz, PRF 320–1,300 Hz). A rotating storm shows as a tight red-green pair.
//   The storm's winds are a Rankine vortex: v = V_rot r ÷ r_c inside the core, V_rot r_c ÷ r outside.
//   India's first Doppler weather radar began work at Chennai on 21 February 2002 (IMD, Mausam journal).
// "star" (not to scale): a planet and its star both circle their common centre of mass, so the star
//   swings towards and away from us and its spectral lines shift. For a circular orbit seen edge-on
//   K = (2πG ÷ P)^⅓ × m_p ÷ (M★ + m_p)^⅔.  Jupiter and the Sun: 12.5 m/s; Earth and the Sun: 0.09 m/s;
//   51 Pegasi b (minimum mass 0.47 Jupiters, P = 4.23 days, star 1.1 Suns): about 55 m/s, measured 56
//   (Mayor & Queloz, Nature 378, 355, 1995). Δλ = λ K ÷ c. The Hα line of hydrogen is at 656.28 nm.
//   Spectrograph precision: ELODIE about 7 m/s, HARPS about 0.3 m/s (Wikipedia, "Doppler spectroscopy").
// "hubble" (1 unit = 50 Mpc): galaxies recede at v = H₀ d (Hubble 1929; Lemaître 1927). H₀ is measured
//   as 67.4 km/s per Mpc from the cosmic microwave background (Planck 2018) and about 73 from nearby
//   supernovae and Cepheids (SH0ES); Hubble's own 1929 figure was about 500. For small redshifts
//   z = Δλ ÷ λ ≈ v ÷ c. 1 Mpc = 3.26 million light years. Andromeda is an exception: it approaches at
//   about 300 km/s (Slipher, 1912–13).
import { THREE, M, box, sphere, torus, clamp } from '../kit.js';
import {
  TAU, C, COL, hex, fmt0, fmtBig, nmColor, board, panelBg, axes, title, line, curve, dot, text, clipTo, dots, strip, fitNarrow, placeBoard, phoneView, lean,
  focusView, inReel,
} from '../doppler.js';

const D2R = Math.PI / 180;
const GN = 6.6743e-11, MSUN = 1.989e30, MJUP = 1.898e27, MEARTH = 5.972e24, DAY = 86400, YEAR = 365.25 * DAY;
const HA = 656.28;                                   // nm, hydrogen's red Hα line
const F_S = 2.8e9, LAM_S = C / F_S;                  // S-band weather radar
export const PLANETS = {
  peg: { name: '51 Pegasi b', m: 0.47 * MJUP, P: 4.2308 * DAY, Ms: 1.1 * MSUN, per: '4.23 days', star: '51 Pegasi' },
  jup: { name: 'Jupiter', m: MJUP, P: 11.862 * YEAR, Ms: MSUN, per: '11.9 years', star: 'the Sun' },
  earth: { name: 'Earth', m: MEARTH, P: YEAR, Ms: MSUN, per: '1 year', star: 'the Sun' },
};
export const wobble = (p) => Math.cbrt((TAU * GN) / p.P) * p.m / Math.pow(p.Ms + p.m, 2 / 3);
const fold = (v, vn) => ((((v + vn) % (2 * vn)) + 2 * vn) % (2 * vn)) - vn;        // what a pulsed radar reports
const RX = 0, SX = 60, HX = 120;
const VIEWS = {
  radar: { pos: [RX - 5.5, 31, 15], target: [RX - 5.5, 0, -5] },
  star: { pos: [SX - 3.6, 6.5, 13.5], target: [SX - 3.6, 3.0, 0] },
  hubble: { pos: [HX - 5.5, 31, 15], target: [HX - 5.5, 0, -5] },
};
const VORT = [8, 3.5], RC = 0.5, VROT = 16;                  // the rotating storm's centre (units) and core radius (5 km)

// A rainbow strip with dark absorption lines: rest positions marked above, shifted lines drawn in.
function spectrum(g, x, y, w, h, lines, z, label) {
  const X = (nm) => x + ((nm - 380) / 370) * w;
  for (let i = 0; i < w; i++) { g.fillStyle = nmColor(380 + (i / w) * 370); g.fillRect(x + i, y, 1.5, h); }
  g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1; g.strokeRect(x, y, w, h);
  for (const nm of lines) {
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(nm), y - 12); g.lineTo(X(nm), y + h); g.stroke(); g.setLineDash([]);
    const s = nm * (1 + z);
    if (s > 380 && s < 750) { g.strokeStyle = '#05060a'; g.lineWidth = 5; g.beginPath(); g.moveTo(X(s), y); g.lineTo(X(s), y + h); g.stroke(); }
  }
  if (label) text(g, label, x, y + h + 22, COL.soft, '15px sans-serif');
}
const LINES = [410.17, 434.05, 486.13, 656.28];      // hydrogen's visible (Balmer) lines, nm

export default {
  id: 'sky',
  short: 'Storms, planets, galaxies',
  title: 'Reading the sky by its Doppler shift',
  subtitle: 'Weather radar sees the wind, a wobbling star gives away its planet, and galaxies show the universe expanding.',
  view: VIEWS.radar,
  learn: `<p><b>Weather radar.</b> An ordinary radar shows where rain is. A <b>Doppler weather radar</b> also measures how fast the raindrops are moving <b>towards or away</b> from it, by the tiny shift in the echo. Drawn in green and red, that map shows the wind inside a storm. A patch where strong “towards” sits right beside strong “away” means the air is <b>rotating</b>: the signature forecasters look for before a tornado. The India Meteorological Department's first Doppler radar started at Chennai in 2002, to watch cyclones in the Bay of Bengal (see CycloneClear, StormClear, TornadoClear and CloudburstClear).</p>
    <p>The radar has a blind spot. It only sees the part of the wind <b>along its beam</b>, so wind blowing across the beam reads as zero. That is why the green and red halves are split by a grey line at right angles to the wind.</p>
    <p><b>Starlight.</b> Light is a wave too, and atoms mark it with dark lines at exact wavelengths. If a star moves <b>away</b>, its lines slide towards the red: <b>redshift</b>. Moving <b>towards</b> us, they slide towards the blue: <b>blueshift</b>. The fraction is simple: <b>Δλ ÷ λ = v ÷ c</b>.</p>
    <p>A planet does not circle a fixed star. Both swing round their shared centre of mass, so the star <b>wobbles</b>. In 1995 Michel Mayor and Didier Queloz saw the star 51 Pegasi sliding to and fro at about <b>56 m/s</b> every 4.2 days: the first planet found around a Sun-like star. Jupiter moves our Sun at 12.5 m/s. Earth moves it at just 9 cm/s.</p>
    <p><b>Galaxies.</b> In 1912 Vesto Slipher found the Andromeda galaxy coming towards us at 300 km/s. But almost every other galaxy turned out to be <b>redshifted</b>, and in 1929 Edwin Hubble showed that the farther a galaxy is, the faster it recedes: <b>v = H₀ × d</b>. The universe is expanding.</p>
    <p class="tip"><b>Try it:</b> turn the wind and watch the zero line turn with it. Switch on the rotating storm and find the red-green pair. Then compare the wobble Jupiter gives the Sun with Earth's.</p>`,
  terms: [
    { t: 'Doppler weather radar', d: 'A radar that measures how fast rain is moving towards or away from it, as well as where it is.' },
    { t: 'Radial velocity', d: 'Speed along the line of sight: towards or away. The Doppler effect measures only this part.' },
    { t: 'Spectral line', d: 'A dark or bright line at one exact wavelength in a spectrum, made by a particular kind of atom.' },
    { t: 'Redshift and blueshift', d: 'Light stretched to longer wavelengths by motion away, or squeezed to shorter ones by motion towards.' },
    { t: 'Redshift, z', d: 'The fractional stretch of the wavelength: z = Δλ ÷ λ. For slow speeds, z = v ÷ c.' },
    { t: 'Hubble’s law', d: 'A galaxy’s speed of recession is proportional to its distance: v = H₀ × d. Also called the Hubble–Lemaître law.' },
  ],
  defaults: { focus: 'radar', wind: 10, dir: 240, rot: false, prf: 1000, planet: 'peg', dist: 300, h0: 70 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'radar', label: 'Weather radar' }, { v: 'star', label: 'Wobbling star' }, { v: 'hubble', label: 'Galaxies' }] },
    { key: 'wind', type: 'range', label: 'Radar: wind speed', min: 0, max: 45, step: 1, ends: ['calm', '45 m/s'], fmt: (v) => `${v} m/s · ${fmt0(v * 3.6)} km/h` },
    { key: 'dir', type: 'range', label: 'Radar: wind blowing from', min: 0, max: 359, step: 1, ends: ['N', 'N'], fmt: (v) => `${v}° (${['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(v / 45) % 8]})` },
    { key: 'rot', type: 'toggle', label: 'Radar: a rotating storm', hint: 'Winds of 16 m/s circling a core 10 km across, to the east.' },
    { key: 'prf', type: 'seg', label: 'Radar: pulses per second', options: [{ v: 600, label: '600' }, { v: 1000, label: '1,000' }, { v: 1300, label: '1,300' }] },
    { key: 'planet', type: 'seg', label: 'Star: tugged by', options: [{ v: 'peg', label: '51 Pegasi b' }, { v: 'jup', label: 'Jupiter' }, { v: 'earth', label: 'Earth' }] },
    { key: 'dist', type: 'range', label: 'Galaxies: distance of the marked galaxy', min: 10, max: 600, step: 5, ends: ['10 Mpc', '600 Mpc'], fmt: (v) => `${v} Mpc · ${fmt0(v * 3.2616)} million light years` },
    { key: 'h0', type: 'seg', label: 'Galaxies: Hubble constant, H₀', options: [{ v: 67.4, label: '67.4 (early universe)' }, { v: 70, label: '70' }, { v: 73, label: '73 (nearby)' }] },
  ],
  quiz: [
    { q: 'On a Doppler weather radar map, a patch of strong “towards” lies right next to strong “away”. What is happening there?', options: ['The radar is broken', 'It is raining very hard', 'The air is rotating', 'There is no wind'], answer: 2, why: 'One side of a spinning column of air moves towards the radar and the other side away. This tight pair is the sign of rotation inside a storm.' },
    { q: 'A star’s spectral lines shift slightly to the red, then to the blue, then back, over and over. What is the simplest explanation?', options: ['The star is changing colour', 'Something unseen, such as a planet, is swinging it round', 'The telescope is shaking', 'The star is exploding'], answer: 1, why: 'A planet and its star circle their shared centre of mass. The star’s to-and-fro motion along our line of sight shifts its lines red, then blue.' },
    { q: 'Using H₀ = 70 km/s per megaparsec, how fast is a galaxy 100 megaparsecs away receding?', options: ['70 km/s', '700 km/s', '7,000 km/s', '70,000 km/s'], answer: 2, why: 'v = H₀ × d = 70 × 100 = 7,000 km/s, about 2% of the speed of light.' },
  ],
  reel: [
    { ms: 5400, caption: 'Doppler weather radar colours the wind: green towards, red away. A tight red-green pair means rotation.', set: { focus: 'radar', wind: 10, rot: true, prf: 1000 }, anim: { dir: [200, 290] }, spin: 0, view: { pos: [RX, 34, 14], target: [RX, 0, -4.5] } },
    { ms: 5400, caption: 'Starlight shifts too. Galaxies are redshifted more the farther they are: the universe is expanding.', set: { focus: 'hubble', h0: 70 }, anim: { dist: [40, 560] }, spin: 0, view: { pos: [HX, 30, 15], target: [HX, 0, -4.5] } },
  ],

  build({ stage }) {
    stage.phoneKey = null;
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    // ================================================================ RADAR
    const R = new THREE.Group(); R.position.x = RX; root.add(R);
    R.add(strip(34, 34, 0x0d1420, 0));
    for (const r of [5, 10, 15]) { const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.03, r + 0.03, 96), M.ghost(0x5b6b84, 0.6)); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; R.add(ring); stage.label(`${r * 10} km`, [0, 0.1, r + 0.5], R); }
    const tower = box(0.3, 0.9, 0.3, M.metal(0x8a909c)); tower.position.y = 0.45; R.add(tower);
    const dome = sphere(0.42, M.plastic(0xf2f4f7), 20); dome.position.y = 1.1; R.add(dome);
    const sweep = box(15, 0.03, 0.08, M.ghost(0x8ef0ff, 0.55)); R.add(sweep);
    const NR = 380, rain = dots(NR, 0.3, 0xffffff, false, 8); rain.scale.y = 0.25; rain.position.y = 0.12; R.add(rain);
    let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const drops = Array.from({ length: NR }, (_, i) => {
      if (i >= NR - 90) { const a = rnd() * TAU, r = 0.15 + 1.5 * Math.sqrt(rnd()); return { x: VORT[0] + Math.cos(a) * r, z: VORT[1] + Math.sin(a) * r, storm: true }; }
      const a = rnd() * TAU, r = 1 + 13.5 * Math.sqrt(rnd()); return { x: Math.cos(a) * r, z: Math.sin(a) * r, storm: false };
    });
    const arrowW = new THREE.Group(); R.add(arrowW);
    const shaft = box(3, 0.06, 0.12, M.glow(0xffffff)); shaft.position.x = 0; arrowW.add(shaft);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 12), M.glow(0xffffff)); head.rotation.z = -Math.PI / 2; head.position.x = 1.8; arrowW.add(head);
    arrowW.position.set(-13.5, 0.3, 6);
    const lWind = stage.label('wind', [-13.5, 0.4, 7.6], R), lN = stage.label('N ↑', [-14.5, 0.2, 2], R);
    const lTo = stage.label('towards the radar', [0, 0, 0], R, 'hot'); lTo.element.style.setProperty('--c', '#6fe08a');
    const lAway = stage.label('away from it', [0, 0, 0], R, 'hot'); lAway.element.style.setProperty('--c', '#ff6a5a');
    const lRot = stage.label('rotation', [VORT[0], 0.4, VORT[1] - 3.2], R, 'hot'); lRot.element.style.setProperty('--c', COL.hot);
    let sweepA = 0;

    // ================================================================ STAR
    const SG = new THREE.Group(); SG.position.x = SX; root.add(SG);
    const star = sphere(1.0, new THREE.MeshBasicMaterial({ color: 0xffe9a8, toneMapped: false }), 32); SG.add(star);
    const glow = sphere(1.35, M.ghost(0xffd27a, 0.22), 24); star.add(glow);
    const planet = sphere(0.3, M.plastic(0x9b7fe0), 20); SG.add(planet);
    const orbitP = torus(4.2, 0.012, M.ghost(0xffffff, 0.35)); orbitP.rotation.x = Math.PI / 2; orbitP.position.y = 1.4; SG.add(orbitP);
    const orbitS = torus(0.7, 0.012, M.ghost(0xffd27a, 0.6)); orbitS.rotation.x = Math.PI / 2; orbitS.position.y = 1.4; SG.add(orbitS);
    const bary = sphere(0.07, M.glow(0xffffff), 10); bary.position.y = 1.4; SG.add(bary);
    const vArrow = box(1, 0.08, 0.08, M.glow(0xffffff)); SG.add(vArrow);
    const sight = box(6, 0.02, 0.02, M.ghost(0x8ef0ff, 0.5)); sight.position.set(-5.4, 1.4, 0); SG.add(sight);
    const lEarth = stage.label('← to our telescope', [-6.2, 2.0, 0], SG), lBary = stage.label('centre of mass', [0, 0.75, 0.9], SG);
    const lStar = stage.label('', [0, 0, 0], SG, 'hot');
    const lPlanet = stage.label('', [0, 0, 0], SG);
    let ph = 0;

    // ================================================================ GALAXIES
    const HG = new THREE.Group(); HG.position.x = HX; root.add(HG);
    HG.add(strip(34, 34, 0x07090f, 0));
    const NG = 170, gal = dots(NG, 0.17, 0xffffff, false, 8); gal.scale.y = 0.3; gal.position.y = 0.1; HG.add(gal);
    const gpos = Array.from({ length: NG }, () => { const a = rnd() * TAU, r = 0.9 + 12.6 * Math.sqrt(rnd()); return [Math.cos(a) * r, Math.sin(a) * r, 0.6 + rnd() * 0.9]; });
    const us = sphere(0.24, M.glow(0x8ef0ff), 14); us.position.y = 0.15; HG.add(us);
    const andro = sphere(0.17, M.glow(0x6fa8ff), 12); andro.position.set(0.75, 0.15, -0.35); HG.add(andro);
    const mark = sphere(0.3, M.glow(0xffb547), 14); HG.add(mark);
    const dRing = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 128), M.ghost(0xffb547, 0.7)); dRing.rotation.x = -Math.PI / 2; dRing.position.y = 0.05; HG.add(dRing);
    const lUs = stage.label('Milky Way: us', [0, 0.3, 1.0], HG), lAnd = stage.label('Andromeda: approaching at 300 km/s', [0.75, 0.3, -1.4], HG);
    const lMark = stage.label('', [0, 0, 0], HG, 'hot'); lMark.element.style.setProperty('--c', COL.hot);
    let ht = 0;

    // ================================================================ board
    let S = null, focus = '', key = '', rvNow = 0;
    const bd = board(root, 6.2, 4.2, 640, 432, (g, w, h) => {
      panelBg(g, w, h);
      if (!S) return;
      if (focus === 'star') {
        const p = PLANETS[S.planet], K = wobble(p), up = K >= 1 ? Math.ceil(K / 20) * 20 : 0.1;
        title(g, 'The star’s speed along our line of sight', '');
        const ax = axes(g, w, h, { x0: 84, y1: 70, y0: 260, xMax: 2, yMin: -up, yMax: up, xTicks: [0, 0.5, 1, 1.5, 2], yTicks: [-up, 0, up], xFmt: (x) => x + '', yFmt: (y) => (y > 0 ? '+' : '') + y, xLabel: 'time (orbits)', yLabel: 'm/s (+ is away)' });
        const { X, Y } = ax;
        clipTo(g, ax, () => { curve(g, (x) => K * Math.sin(TAU * x), 0, 2, X, Y, COL.lam, 5); });
        const u = (ph / TAU) % 2;
        dot(g, X(u), Y(K * Math.sin(TAU * u)), rvNow > 0 ? COL.lo : COL.hi, 9);
        spectrum(g, 84, 330, 520, 38, LINES, (rvNow / K) * 0.02, `lines slide ${rvNow > 0 ? 'red' : 'blue'}wards (drawn ${fmtBig((0.02 * C) / K)} times too big, to be seen)`);
      } else if (focus === 'hubble') {
        const v = S.h0 * S.dist, z = (v * 1000) / C;
        title(g, 'Farther means faster', `v = H₀ × d, H₀ = ${S.h0}`);
        const ax = axes(g, w, h, { x0: 92, y1: 66, y0: 262, xMax: 600, yMax: 45000, xTicks: [0, 200, 400, 600], yTicks: [0, 15000, 30000, 45000], yFmt: (y) => fmt0(y), xLabel: 'distance (Mpc)', yLabel: 'km/s' });
        const { X, Y } = ax;
        clipTo(g, ax, () => {
          line(g, [[0, 0], [600, 600 * 500]], X, Y, 'rgba(255,255,255,.3)', 2, [6, 5]);
          line(g, [[0, 0], [600, 600 * S.h0]], X, Y, COL.lo, 5);
        });
        text(g, 'Hubble’s 1929 estimate: 500', X(95), Y(40000), COL.soft, '15px sans-serif');
        dot(g, X(S.dist), Y(v), COL.hot, 9);
        spectrum(g, 92, 330, 512, 38, LINES, z, `hydrogen lines at z = ${z.toFixed(3)} (true shift)`);
      } else {
        const vn = (LAM_S * S.prf) / 4;
        title(g, 'Speed seen round the compass', 'v_r = −V cos(az − d)');
        const ax = axes(g, w, h, { x0: 84, y1: 66, y0: h - 92, xMax: 360, yMin: -50, yMax: 50, xTicks: [0, 90, 180, 270, 360], yTicks: [-50, -25, 0, 25, 50], xFmt: (x) => ['N', 'E', 'S', 'W', 'N'][x / 90], yFmt: (y) => (y > 0 ? '+' : '') + y, xLabel: 'direction the radar looks', yLabel: 'm/s (+ is away)' });
        const { X, Y } = ax;
        clipTo(g, ax, () => {
          g.fillStyle = 'rgba(255,90,90,.12)'; g.fillRect(X(0), Y(50), X(360) - X(0), Y(vn) - Y(50)); g.fillRect(X(0), Y(-vn), X(360) - X(0), Y(-50) - Y(-vn));
          curve(g, (a) => -S.wind * Math.cos((a - S.dir) * D2R), 0, 360, X, Y, 'rgba(255,255,255,.35)', 2, [5, 5]);
          const pts = []; for (let a = 0; a <= 360; a += 1) pts.push([a, fold(-S.wind * Math.cos((a - S.dir) * D2R), vn)]);
          for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i][1] - pts[i - 1][1]) < vn) line(g, [pts[i - 1], pts[i]], X, Y, pts[i][1] > 0 ? '#ff6a5a' : '#6fe08a', 5);
        });
        text(g, `beyond ±${vn.toFixed(0)} m/s the reading folds over`, X(8), Y(50) + 20, '#ff9a9a', '15px sans-serif');
        const az = ((sweepA / D2R) % 360 + 360) % 360;
        dot(g, X(az), Y(fold(-S.wind * Math.cos((az - S.dir) * D2R), vn)), COL.hot, 8);
      }
    }, [0, 0, 0], -0.5);
    const col = new THREE.Color();

    return {
      dispose() { stage.floor.visible = true; },
      update(dt, s) {
        dt = Math.max(0, dt); S = s;
        const narrow = fitNarrow(stage, [lWind, lN, lBary, lEarth, lUs, lAnd, lPlanet]);
        if (s.focus !== focus) { focus = s.focus; focusView(stage, VIEWS, focus); key = ''; }
        phoneView(stage, 'sky' + focus, focus === 'radar' ? { pos: [RX, 31, 15], target: [RX, 0, -2.5] } : focus === 'star' ? { pos: [SX, 6.5, 13.5], target: [SX, 2.6, 0] } : { pos: [HX, 31, 15], target: [HX, 0, -2.5] });
        R.visible = focus === 'radar'; SG.visible = focus === 'star'; HG.visible = focus === 'hubble';
        if (focus === 'radar') {
          placeBoard(bd, [RX + 9.5, 4.5, -13.5, 2.5, -0.75], inReel() ? [RX, 5, -20, 3.4, -0.75] : [RX + 2, 4, -17, 2.6, -0.75], stage);
          const d = s.dir * D2R, wx = -Math.sin(d) * s.wind, wz = Math.cos(d) * s.wind, vn = (LAM_S * s.prf) / 4;
          const T = dt * 300 / 10000;                              // 300× faster; 10,000 m per unit
          sweepA += dt * 1.1;
          sweep.position.set(7.5 * Math.sin(sweepA), 0.3, -7.5 * Math.cos(sweepA)); sweep.rotation.y = Math.PI / 2 - sweepA;
          drops.forEach((p, i) => {
            let vx = wx, vz = wz;
            if (p.storm && !s.rot) { rain.place(i, 0, -50, 0, 0.001); return; }
            if (s.rot) {
              const rx = p.x - VORT[0], rz = p.z - VORT[1], r = Math.hypot(rx, rz) || 1e-6;
              if (r < 4) { const vt = VROT * (r < RC ? r / RC : RC / r); vx += (-rz / r) * vt; vz += (rx / r) * vt; }
            }
            if (p.storm) { const rx = p.x - VORT[0], rz = p.z - VORT[1], r = Math.hypot(rx, rz) || 1e-6, vt = VROT * (r < RC ? r / RC : RC / r); p.x += (-rz / r) * vt * T * 0.5; p.z += (rx / r) * vt * T * 0.5; }
            else { p.x += wx * T; p.z += wz * T; const r = Math.hypot(p.x, p.z); if (r > 14.6) { p.x *= -0.985; p.z *= -0.985; } }
            const r = Math.hypot(p.x, p.z) || 1e-6, vr = fold((vx * p.x + vz * p.z) / r, vn), k = clamp(Math.abs(vr) / 30, 0, 1);
            const az = Math.atan2(p.x, -p.z), age = (((sweepA - az) % TAU) + TAU) % TAU / TAU, lit = 0.45 + 0.55 * Math.exp(-age * 3);
            if (Math.abs(vr) < 1.2) col.setRGB(0.42 * lit, 0.45 * lit, 0.5 * lit);
            else if (vr < 0) col.setRGB(0.08 * lit, (0.4 + 0.6 * k) * lit, 0.2 * lit);
            else col.setRGB((0.45 + 0.55 * k) * lit, 0.1 * lit, 0.08 * lit);
            rain.place(i, p.x, 0, p.z, p.storm ? 0.75 : 1); rain.setColorAt(i, col);
          });
          rain.done();
          arrowW.rotation.y = -Math.atan2(wz, wx); arrowW.visible = s.wind > 0;
          const show = s.wind >= 4 && !narrow;
          lTo.visible = lAway.visible = show; lRot.visible = s.rot;
          lTo.position.set(9.5 * Math.sin(d), 0.4, -9.5 * Math.cos(d)); lAway.position.set(-9.5 * Math.sin(d), 0.4, 9.5 * Math.cos(d));
          lWind.element.textContent = `wind ${s.wind} m/s`;
        } else if (focus === 'star') {
          placeBoard(bd, [SX + 0.9, 7.1, -1, 0.85, 0], inReel() ? [SX + 0.6, 7.4, -2, 1.5, 0] : [SX + 0.6, 6.6, -2, 1.25, 0], stage);
          const p = PLANETS[s.planet], K = wobble(p);
          ph += dt * TAU / 7;
          const rs = 0.7, rp = s.planet === 'peg' ? 3.2 : s.planet === 'jup' ? 3.9 : 3.6;
          orbitP.scale.setScalar(rp / 4.2);
          planet.scale.setScalar(s.planet === 'earth' ? 0.45 : 1); planet.material.color.setHex(s.planet === 'earth' ? 0x4d8fe0 : s.planet === 'jup' ? 0xd9a066 : 0x9b7fe0);
          // the star and planet sit on opposite sides of the centre of mass; +x is away from us
          star.position.set(-rs * Math.cos(ph), 1.4, -rs * Math.sin(ph));
          planet.position.set(rp * Math.cos(ph), 1.4, rp * Math.sin(ph));
          rvNow = K * Math.sin(ph);                                // d/dt of −cos is +sin: positive when moving away
          const len = 1.7 * Math.abs(Math.sin(ph));
          vArrow.scale.x = Math.max(0.001, len); vArrow.position.set(star.position.x + Math.sign(rvNow) * (1.1 + len / 2), 1.4, star.position.z);
          vArrow.material.color.setHex(rvNow > 0 ? 0xff7a59 : 0x7fd0ff);
          star.material.color.setRGB(1, 0.91 - 0.1 * Math.sin(ph), 0.66 - 0.3 * Math.sin(ph));
          lStar.position.set(star.position.x, 3.5, star.position.z);
          lStar.element.innerHTML = `${rvNow > 0 ? 'moving away: redder' : 'moving towards us: bluer'} · <b>${Math.abs(rvNow) >= 1 ? rvNow.toFixed(0) : rvNow.toFixed(2)} m/s</b>`;
          lStar.element.style.setProperty('--c', rvNow > 0 ? COL.lo : COL.hi);
          lPlanet.position.set(planet.position.x, 0.6, planet.position.z); lPlanet.element.textContent = p.name;
        } else {
          placeBoard(bd, [HX + 9.5, 4.5, -13.5, 2.5, -0.75], inReel() ? [HX, 5, -19, 3.2, -0.7] : [HX + 2, 4, -16, 2.5, -0.7], stage);
          ht = (ht + dt / 9) % 1;
          const a = 1 + 0.3 * ht, fade = Math.min(1, ht * 8, (1 - ht) * 8);
          gpos.forEach(([x, z, sz], i) => {
            const r = Math.hypot(x, z), k = clamp(r / 13, 0, 1);
            col.setRGB(fade, fade * (1 - 0.72 * k), fade * (1 - 0.9 * k));
            gal.place(i, x * a, 0, z * a, sz); gal.setColorAt(i, col);
          });
          gal.done();
          const rr = (s.dist / 50) * a, ang = -0.6;
          mark.position.set(rr * Math.cos(ang), 0.2, rr * Math.sin(ang)); dRing.scale.setScalar(rr);
          const v = s.h0 * s.dist;
          lMark.position.set(mark.position.x, 0.8, mark.position.z - 0.9);
          lMark.element.innerHTML = `${s.dist} Mpc away: receding at <b>${fmt0(v)} km/s</b>`;
        }
        const kk = `${focus}|${s.wind}|${s.dir}|${s.prf}|${s.planet}|${s.dist}|${s.h0}|${focus === 'star' ? Math.round(ph * 14) : focus === 'radar' ? Math.round(sweepA * 12) : 0}`;
        if (kk !== key) { key = kk; bd.redraw(); }
      },
      readout(s) {
        if (s.focus === 'star') {
          const p = PLANETS[s.planet], K = wobble(p), dl = (HA * 1e-9 * K) / C;
          return lean(`<div class="big">${p.name} swings ${p.star} at ${K >= 1 ? K.toFixed(1) + ' m/s' : (K * 100).toFixed(1) + ' cm/s'}</div>
            <div class="row"><span>One orbit takes</span><b>${p.per}</b></div>
            <div class="row"><span>Star’s speed now, along our view</span><b style="color:${rvNow > 0 ? COL.lo : COL.hi}">${rvNow > 0 ? '+' : '−'}${Math.abs(rvNow) >= 1 ? Math.abs(rvNow).toFixed(1) : Math.abs(rvNow).toFixed(3)} m/s</b></div>
            <div class="row"><span>Shift of the 656.28 nm line, λ K ÷ c</span><b>${(dl * 1e12).toPrecision(2)} pm</b></div>
            <div class="row"><span>That is one part in</span><b>${fmtBig(C / K)}</b></div>
            <div class="row"><span>Can a 0.3 m/s spectrograph see it?</span><b class="${K > 0.3 ? 'ok' : 'no'}">${K > 0.3 ? 'yes' : 'not yet'}</b></div>
            <small>Seen edge-on, with a circular orbit. 1 pm is a millionth of a millionth of a metre.</small>`, [0, 1, 2]);
        }
        if (s.focus === 'hubble') {
          const v = s.h0 * s.dist, z = (v * 1000) / C;
          return lean(`<div class="big">v = H₀ × d = ${fmt0(v)} km/s</div>
            <div class="row"><span>Distance, d</span><b>${s.dist} Mpc</b></div>
            <div class="row"><span>Hubble constant, H₀</span><b>${s.h0} km/s per Mpc</b></div>
            <div class="row"><span>Redshift, z ≈ v ÷ c</span><b style="color:${COL.lo}">${z.toFixed(4)}</b></div>
            <div class="row"><span>Hydrogen’s 656.3 nm line arrives at</span><b>${(HA * (1 + z)).toFixed(1)} nm</b></div>
            <div class="row"><span>Its light set out about</span><b>${fmt0(s.dist * 3.2616)} million years ago</b></div>
            <small>The straight-line law holds for nearby galaxies. Farther out, see the last chapter.</small>`, [0, 2, 3]);
        }
        const vn = (LAM_S * s.prf) / 4, rmax = C / (2 * s.prf) / 1000;
        return lean(`<div class="big">Δf = 2 v ÷ λ = ${fmt0((2 * s.wind) / LAM_S)} Hz</div>
          <div class="row"><span>Radar frequency (S band)</span><b>2.8 GHz · λ = ${(LAM_S * 100).toFixed(1)} cm</b></div>
          <div class="row"><span>Rain upwind, moving towards</span><b style="color:#6fe08a">−${s.wind} m/s</b></div>
          <div class="row"><span>Rain downwind, moving away</span><b style="color:#ff6a5a">+${s.wind} m/s</b></div>
          <div class="row"><span>Rain at right angles to the wind</span><b>0 m/s</b></div>
          <div class="row"><span>Fastest speed read correctly, λ × PRF ÷ 4</span><b class="${s.wind > vn ? 'no' : 'ok'}">±${vn.toFixed(1)} m/s</b></div>
          <div class="row"><span>Farthest clear range, c ÷ (2 × PRF)</span><b>${fmt0(rmax)} km</b></div>
          <small>The map is drawn 300× faster than real time.${s.rot ? ' Storm: 16 m/s winds round a 10 km core.' : ''}</small>`, [1, 2, 4]);
      },
    };
  },
};
