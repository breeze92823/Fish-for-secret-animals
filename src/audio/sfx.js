// Every one-shot sound in the game, synthesised from physical recipes (synth.js):
// coins are thin metal plates, the glockenspiel a free bar, wood and plastic die
// in tens of ms, food is crunchy noise grains over a soft "nom", impacts are a
// low sine thump under lowpassed brown noise. Nothing here throws or plays before
// the first gesture; each export returns quietly when audio isn't running.
import { COARSE_POINTER } from '../config.js'
import { A, isMuted, now, ready, voice } from './core.js'
import { bubble, bubbles, burst, crinkle, env, modal, rnd, route, tone, vary } from './synth.js'

const COIN = [[1, 1, 0.5], [1.504, 0.6, 0.36], [2.24, 0.45, 0.26], [2.71, 0.3, 0.18], [3.47, 0.22, 0.12], [4.03, 0.12, 0.08]]
const GLOCK = [[1, 1, 1.4], [2.756, 0.32, 0.45], [5.404, 0.1, 0.18], [8.933, 0.04, 0.08]]
const BELL = [[0.5, 0.3, 1.5], [1, 1, 1.3], [1.19, 0.45, 1], [1.5, 0.3, 0.85], [2, 0.42, 0.75], [2.5, 0.18, 0.5], [2.66, 0.22, 0.45], [3.01, 0.1, 0.35], [4.1, 0.06, 0.25]]
const WOOD = [[1, 1, 0.07], [2.57, 0.45, 0.035], [4.2, 0.22, 0.016], [6.1, 0.08, 0.01]]
const PLASTIC = [[1, 1, 0.026], [2.31, 0.5, 0.016], [3.93, 0.28, 0.01]]
const GLASS = [[1, 1, 0.45], [2.32, 0.5, 0.28], [4.25, 0.28, 0.16], [6.63, 0.14, 0.1]]
const METAL = [[1, 1, 0.35], [2.76, 0.5, 0.22], [5.4, 0.3, 0.12], [8.93, 0.15, 0.06]]

const semi = (n) => Math.pow(2, n / 12)
const C6 = 1046.5
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]

const lastAt = new Map()
function limit(name, ms) {
  const t = performance.now()
  if (t - (lastAt.get(name) ?? -1e9) < ms) return false
  lastAt.set(name, t)
  return true
}
function buzz(pattern) {
  if (!COARSE_POINTER || isMuted()) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Not allowed in this frame.
  }
}

function glock(t, notes, gap, gain = 0.14, verb = 0.25, bus = A.sfx) {
  notes.forEach((n, i) => modal({ t: t + i * gap, f: C6 * semi(n), modes: GLOCK, gain: gain * rnd(0.85, 1), strike: 0.12, pan: (i / Math.max(1, notes.length - 1) - 0.5) * 0.5, verb, bus }))
}
function coinRain(t, n, spread, gain, pan = 0) {
  for (let i = 0; i < n; i++) {
    const at = t + Math.pow(i / n, 1.3) * spread + rnd(0, 0.02)
    modal({ t: at, f: rnd(2500, 4400), modes: COIN, gain: gain * (1 - (i / n) * 0.7), beat: 7, strike: 0.25, decay: rnd(0.5, 1), pan: pan + rnd(-0.3, 0.3), verb: 0.08 })
  }
  crinkle({ t: t + spread * 0.4, n: COARSE_POINTER ? 6 : 12, dur: spread, gain: 0.03, f0: 4000, f1: 9000 })
}
function popper(t, pan) {
  burst({ t, type: 'highpass', f: 2800, q: 0.6, a: 0.0005, d: 0.012, gain: 0.45, pan, verb: 0.2 })
  burst({ t, f: 900, q: 0.9, a: 0.001, d: 0.05, gain: 0.24, pan })
  tone({ t, f: 170, f2: 60, d: 0.06, gain: 0.2, pan })
  crinkle({ t: t + 0.05, n: COARSE_POINTER ? 12 : 24, dur: 0.9, gain: 0.045, f0: 2500, f1: 8000, width: 0.9 })
}

// --- UI --------------------------------------------------------------------------------
export function click(pan = 0) {
  if (!limit('click', 30) || !voice(0.1, 2)) return
  const t = now()
  burst({ t, f: vary(4200, 0.1), q: 1.2, d: 0.006, gain: 0.2, bus: A.ui, pan })
  modal({ t, f: vary(1250, 0.06), modes: PLASTIC, gain: 0.16, bus: A.ui, pan })
  tone({ t, f: vary(170, 0.05), f2: 85, d: 0.04, gain: 0.22, bus: A.ui, pan })
}
export function press(pan = 0) {
  if (!limit('click', 30) || !voice(0.12, 2)) return
  const t = now()
  burst({ t, f: vary(3000, 0.1), q: 1, d: 0.008, gain: 0.2, bus: A.ui, pan })
  modal({ t, f: vary(820, 0.05), modes: PLASTIC, gain: 0.18, bus: A.ui, pan })
  tone({ t, f: vary(140, 0.05), f2: 68, d: 0.06, gain: 0.3, bus: A.ui, pan })
}
export function tick(pan = 0) {
  if (!limit('click', 30) || !voice(0.06, 2)) return
  const t = now()
  burst({ t, f: vary(6000, 0.1), q: 1.4, d: 0.004, gain: 0.12, bus: A.ui, pan })
  modal({ t, f: vary(2300, 0.06), modes: PLASTIC, gain: 0.1, bus: A.ui, pan })
}
export function windowOpen() {
  if (!limit('win', 90) || !voice(0.35, 2)) return
  const t = now()
  burst({ t, noise: 'pink', f: 320, f2: 2400, q: 0.9, a: 0.09, d: 0.17, gain: 0.3, bus: A.ui })
  tone({ t: t + 0.11, f: 125, f2: 70, d: 0.09, gain: 0.22, bus: A.ui })
  modal({ t: t + 0.1, f: C6 * semi(19), modes: GLOCK, gain: 0.04, verb: 0.2, bus: A.ui })
}
export function windowClose() {
  if (!limit('win', 90) || !voice(0.2, 2)) return
  burst({ t: now(), noise: 'pink', f: 2100, f2: 300, q: 0.9, a: 0.02, d: 0.14, gain: 0.34, bus: A.ui })
}
export function deny() {
  if (!limit('deny', 140) || !voice(0.2, 2)) return
  const t = now()
  modal({ t, f: vary(215, 0.03), modes: WOOD, gain: 0.42, strike: 0.15, bus: A.ui })
  modal({ t: t + 0.09, f: vary(168, 0.03), modes: WOOD, gain: 0.36, strike: 0.12, bus: A.ui })
  buzz(30)
}
// Spending money: the till drawer clunks, the bell rings, coins pour out.
export function purchase() {
  if (!limit('buy', 200) || !voice(1.4, 3)) return
  const t = now()
  burst({ t, type: 'lowpass', f: 700, q: 0.7, d: 0.1, gain: 0.3 })
  tone({ t, f: 95, f2: 52, d: 0.1, gain: 0.3 })
  modal({ t: t + 0.04, f: 1046, modes: BELL, gain: 0.18, beat: 4, strike: 0.2, verb: 0.15 })
  coinRain(t + 0.06, COARSE_POINTER ? 6 : 10, 0.45, 0.08)
  buzz([20, 40, 30])
}
export function equip() {
  if (!limit('equip', 120) || !voice(0.4, 2)) return
  const t = now()
  modal({ t, f: vary(1800, 0.04), modes: PLASTIC, gain: 0.16, strike: 0.15, bus: A.ui })
  modal({ t: t + 0.045, f: vary(2400, 0.04), modes: COIN, gain: 0.07, decay: 0.45, strike: 0.3, bus: A.ui })
  tone({ t: t + 0.045, f: 210, f2: 120, d: 0.035, gain: 0.2, bus: A.ui })
}
export function pop(up = true) {
  if (!limit('pop', 50) || !voice(0.15, 2)) return
  const t = now()
  bubble({ t, f: up ? vary(480, 0.08) : vary(720, 0.08), d: 0.06, gain: 0.26, rise: up ? 1.1 : -0.45, bus: A.ui })
  burst({ t, f: 2600, q: 1, d: 0.008, gain: 0.1, bus: A.ui })
}

// --- Money --------------------------------------------------------------------------------
// One coin arriving at the wallet; i walks it up a pentatonic scale.
export function coin(i = 0, pan = 0) {
  if (!limit('coin', 28) || !voice(0.5, 1)) return
  const t = now()
  const f = 2350 * semi(PENTA[i % PENTA.length] * 0.5)
  modal({ t, f: vary(f, 0.01), modes: COIN, gain: 0.1, beat: 6, strike: 0.25, decay: 0.7, pan: pan + rnd(-0.15, 0.15), verb: 0.06 })
}
// Stepping onto the collect pad: a rising swoop and a shower of coins.
export function collect(big = false) {
  if (!limit('collect', 300) || !voice(1.2, 3)) return
  const t = now()
  burst({ t, noise: 'pink', f: 400, f2: 3200, q: 1, a: 0.08, d: 0.14, gain: 0.18 })
  bubble({ t: t + 0.05, f: 520, d: 0.07, gain: 0.24, rise: 1.2 })
  coinRain(t + 0.08, big ? 14 : 8, big ? 0.6 : 0.35, 0.07)
  glock(t + 0.1, big ? [0, 4, 7, 12, 16] : [7, 12, 16], 0.05, 0.1)
  buzz(20)
}
export function sell(n = 1) {
  if (!limit('sell', 120) || !voice(1, 2)) return
  const t = now()
  modal({ t, f: 1568, modes: BELL, gain: 0.12, beat: 4, strike: 0.2, verb: 0.12 })
  coinRain(t + 0.03, Math.min(14, 4 + n * 2), 0.4, 0.07)
}

// --- Throwing -------------------------------------------------------------------------------
// Held charge: a stretching rubbery creak and a tone rising with k (0..1). Returns a handle.
export function chargeStart() {
  if (!ready()) return { set() {}, stop() {} }
  const ctx = A.ctx
  const t = now()
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = 180
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 900
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.05, t + 0.08)
  osc.connect(lp).connect(g)
  const src = ctx.createBufferSource()
  src.buffer = A.noise.pink
  src.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 600
  bp.Q.value = 2
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0.0001, t)
  ng.gain.linearRampToValueAtTime(0.06, t + 0.1)
  src.connect(bp).connect(ng)
  route(g, { verb: 0.05 })
  route(ng)
  osc.start(t)
  src.start(t, Math.random())
  let stopped = false
  let lastTick = 0
  return {
    set(k) {
      if (stopped) return
      const c = ctx.currentTime
      osc.frequency.setTargetAtTime(180 + k * 520, c, 0.03)
      lp.frequency.setTargetAtTime(900 + k * 2600, c, 0.03)
      bp.frequency.setTargetAtTime(600 + k * 2200, c, 0.03)
      // Little ratchet clicks as the charge builds.
      const step = Math.floor(k * 8)
      if (step > lastTick) {
        lastTick = step
        modal({ f: 1400 + step * 160, modes: PLASTIC, gain: 0.05 + k * 0.04, bus: A.sfx })
      }
    },
    stop() {
      if (stopped) return
      stopped = true
      const c = ctx.currentTime
      g.gain.setTargetAtTime(0.0001, c, 0.03)
      ng.gain.setTargetAtTime(0.0001, c, 0.03)
      osc.stop(c + 0.2)
      src.stop(c + 0.2)
    },
  }
}
// The throw: a grunt of air off the arm and a whoosh that gets longer with power.
export function throwFood(k = 0.5) {
  if (!limit('throw', 60) || !voice(0.6, 2)) return
  const t = now()
  burst({ t, noise: 'pink', f: 500, f2: 2600 + k * 1800, q: 1.1, a: 0.03, d: 0.18 + k * 0.25, gain: 0.26 })
  burst({ t: t + 0.05, noise: 'pink', f: 2600, f2: 700, q: 1.4, a: 0.02, d: 0.25 + k * 0.4, gain: 0.08 })
  tone({ t, f: 150, f2: 80, d: 0.08, gain: 0.18 })
  buzz(15)
}
// Food lands on the bricks: a soft thump and a little squish, quieter far away (k 0..1).
export function foodLand(k = 1, pan = 0) {
  if (!limit('land-food', 60) || !voice(0.4, 1)) return
  const t = now()
  k = Math.max(0.15, Math.min(1, k))
  tone({ t, f: vary(130, 0.08), f2: 60, d: 0.09, gain: 0.3 * k, pan })
  burst({ t, noise: 'brown', type: 'lowpass', f: 700, q: 0.6, a: 0.002, d: 0.08, gain: 0.3 * k, pan })
  bubbles({ t: t + 0.01, n: 4, dur: 0.07, f0: 500, f1: 1400, gain: 0.05 * k })
  modal({ t, f: vary(420, 0.1), modes: PLASTIC, gain: 0.08 * k, pan })
}
// A baddie eating: crunchy bites with a happy "nom", then a gulp.
export function munch(k = 1, pan = 0, kind = 'crunch') {
  if (!voice(1, 2)) return
  const t = now()
  const bites = 3
  const crunch = kind === 'crunch' ? 1.6 : kind === 'jelly' || kind === 'squish' ? 0.5 : 1
  for (let i = 0; i < bites; i++) {
    const at = t + i * 0.17 + rnd(0, 0.02)
    crinkle({ t: at, n: COARSE_POINTER ? 6 : 11, dur: 0.06, gain: 0.12 * k * crunch, f0: 1500, f1: 5200, width: 0.2, verb: 0.03 })
    if (kind === 'squish' || kind === 'jelly') bubbles({ t: at, n: 4, dur: 0.07, f0: 300, f1: 1100, gain: 0.07 * k })
    if (kind === 'meat') burst({ t: at, noise: 'brown', type: 'lowpass', f: 900, q: 0.7, d: 0.05, gain: 0.18 * k, pan })
    burst({ t: at, f: rnd(1700, 2600), q: 1.5, a: 0.001, d: 0.025, gain: 0.16 * k, pan })
    // "nom": two formant-ish partials with a quick swell.
    tone({ t: at + 0.01, f: vary(300, 0.05), f2: 240, a: 0.01, d: 0.07, gain: 0.07 * k, pan, lp: 1200 })
    tone({ t: at + 0.01, type: 'triangle', f: vary(720, 0.05), f2: 620, a: 0.01, d: 0.05, gain: 0.03 * k, pan })
  }
  bubble({ t: t + bites * 0.17 + 0.04, f: 260, d: 0.09, gain: 0.18 * k, rise: 0.8 })
}
// Caught! A pop, a sparkly run up the glockenspiel (longer for rarer), glass shimmer.
export function caught(rarity = 0) {
  if (!voice(2.2, 4)) return
  const t = now()
  bubble({ t, f: 440, d: 0.08, gain: 0.28, rise: 1.4 })
  burst({ t, f: 3000, q: 1, d: 0.01, gain: 0.14 })
  const runs = [[0, 4, 7, 12], [0, 4, 7, 12, 16], [0, 4, 7, 12, 16, 19], [0, 4, 7, 11, 12, 16, 19, 24], [0, 4, 7, 12, 16, 19, 24, 28], [0, 4, 7, 12, 16, 19, 24, 28, 31], [0, 3, 7, 12, 15, 19, 24, 27, 31, 36]]
  glock(t + 0.05, runs[Math.min(6, rarity)], 0.06, 0.14, 0.35)
  for (let i = 0; i < (COARSE_POINTER ? 6 : 12) + rarity * 2; i++) modal({ t: t + 0.05 + Math.random() * 0.6, f: rnd(2800, 6500), modes: GLASS, gain: 0.02, decay: 0.6, pan: rnd(-0.7, 0.7), verb: 0.3 })
  if (rarity >= 3) {
    popper(t + 0.15, -0.5)
    popper(t + 0.22, 0.5)
  }
  if (rarity >= 4) modal({ t: t + 0.1, f: 523, modes: BELL, gain: 0.16, beat: 3, strike: 0.15, verb: 0.4 })
  buzz(rarity >= 3 ? [40, 50, 40, 50, 80] : 30)
}
// The baddie whisked off to your pen: a rising swoosh with a shimmer tail.
export function whoosh() {
  if (!limit('whoosh', 120) || !voice(0.8, 2)) return
  const t = now()
  burst({ t, noise: 'pink', f: 300, f2: 3400, q: 1.2, a: 0.12, d: 0.35, gain: 0.2 })
  for (let i = 0; i < 6; i++) modal({ t: t + 0.1 + i * 0.05, f: C6 * semi(12 + i * 2), modes: GLOCK, gain: 0.03, decay: 0.5, verb: 0.4 })
}
// Arriving in the pen: a soft landing and a twinkle.
export function arrive(pan = 0) {
  if (!voice(0.8, 2)) return
  const t = now()
  tone({ t, f: 110, f2: 55, d: 0.12, gain: 0.25, pan })
  burst({ t, noise: 'brown', type: 'lowpass', f: 500, q: 0.6, d: 0.12, gain: 0.25, pan })
  glock(t + 0.04, [12, 19, 24], 0.05, 0.08, 0.35)
}
// A wild baddie notices food: a curious little "hm?" chirp.
export function notice(pan = 0) {
  if (!limit('notice', 200) || !voice(0.3, 1)) return
  const t = now()
  tone({ t, f: vary(520, 0.06), f2: 780, a: 0.02, d: 0.12, gain: 0.06, pan, lp: 2400 })
}

// --- Machines and rewards -------------------------------------------------------------------
// Fuse machine running for dur s: motor hum swelling, clanks, a whine rising, bubbling tanks.
export function fuseRun(dur = 2.6) {
  if (!voice(dur + 0.5, 3)) return
  const ctx = A.ctx
  const t = now()
  const motor = ctx.createOscillator()
  motor.type = 'sawtooth'
  motor.frequency.setValueAtTime(48, t)
  motor.frequency.exponentialRampToValueAtTime(92, t + dur)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(260, t)
  lp.frequency.exponentialRampToValueAtTime(1400, t + dur)
  const g = ctx.createGain()
  env(g.gain, t, 0.3, 0.09, 0.25, dur - 0.4)
  motor.connect(lp).connect(g)
  route(g, { verb: 0.1 })
  motor.start(t)
  motor.stop(t + dur + 0.4)
  tone({ t, f: 300, f2: 1800, glide: dur, a: 0.4, hold: dur - 0.6, d: 0.2, gain: 0.03, lp: 3000 })
  let at = t + 0.15
  while (at < t + dur - 0.1) {
    modal({ t: at, f: rnd(380, 620), modes: METAL, gain: 0.07, strike: 0.2, pan: rnd(-0.3, 0.3), verb: 0.12 })
    at += rnd(0.18, 0.38)
  }
  bubbles({ t: t + 0.2, n: COARSE_POINTER ? 18 : 36, dur: dur - 0.3, f0: 300, f1: 1400, gain: 0.05, verb: 0.15 })
}
// The fuse result: a poof, a deep boom and a bright fanfare.
export function fuseDone() {
  if (!voice(2.5, 4)) return
  const t = now()
  tone({ t, f: 90, f2: 38, d: 0.45, gain: 0.45 })
  burst({ t, noise: 'brown', type: 'lowpass', f: 900, f2: 200, q: 0.5, a: 0.004, d: 0.5, gain: 0.4 })
  burst({ t, noise: 'pink', f: 3000, f2: 600, q: 0.7, a: 0.01, d: 0.4, gain: 0.15 })
  popper(t + 0.12, -0.5)
  popper(t + 0.16, 0.5)
  glock(t + 0.2, [0, 4, 7, 12, 16, 19, 24], 0.065, 0.15, 0.35)
  modal({ t: t + 0.2, f: 784, modes: BELL, gain: 0.14, beat: 3, strike: 0.2, verb: 0.4 })
  buzz([50, 40, 50, 40, 90])
}
// The free chest: a creaky wooden lid, a thud, then the treasure sparkle.
export function chestOpen() {
  if (!voice(2, 3)) return
  const t = now()
  for (let i = 0; i < 9; i++) burst({ t: t + i * 0.035, noise: 'pink', f: 380 + i * 40, q: 9, a: 0.004, d: 0.03, gain: 0.08 })
  modal({ t: t + 0.33, f: 180, modes: WOOD, gain: 0.4, strike: 0.2 })
  tone({ t: t + 0.33, f: 100, f2: 55, d: 0.1, gain: 0.25 })
  glock(t + 0.42, [0, 7, 12, 16, 19, 24], 0.06, 0.14, 0.4)
  coinRain(t + 0.45, 14, 0.7, 0.08)
}
// An upgrade bought: a latch, then a quick rising run.
export function upgrade() {
  if (!limit('upgrade', 150) || !voice(1.2, 3)) return
  const t = now()
  purchase()
  glock(t + 0.12, [0, 4, 7, 12], 0.05, 0.12, 0.3)
}
// Objective banner done: party poppers and a short fanfare.
export function quest() {
  if (!voice(2, 3)) return
  const t = now()
  popper(t, -0.6)
  popper(t + 0.06, 0.6)
  glock(t + 0.1, [0, 4, 7, 12, 7, 12, 16, 19, 24], 0.07, 0.13, 0.35)
  buzz([30, 40, 30])
}
// A new baddie discovered for the Index.
export function discover() {
  if (!voice(1.2, 3)) return
  const t = now()
  modal({ t, f: 1568, modes: BELL, gain: 0.12, beat: 4, strike: 0.2, verb: 0.35 })
  glock(t + 0.08, [12, 16, 19, 24], 0.08, 0.1, 0.4)
}
// A door you can't afford / a full pen: a polite "nope".
export const nope = deny

// --- Body -------------------------------------------------------------------------------------
// Footsteps on studded grass bricks: a soft scuff and a few grains; k = how hard (running).
export function step(k = 0.5, pan = 0) {
  if (!voice(0.15, 0.5)) return
  const t = now()
  burst({ t, noise: 'pink', type: 'lowpass', f: vary(900, 0.15), q: 0.6, a: 0.003, d: 0.05, gain: 0.1 + k * 0.1, pan })
  burst({ t, f: vary(2600, 0.2), q: 1.6, a: 0.001, d: 0.012, gain: 0.03 + k * 0.03, pan })
  modal({ t, f: vary(260, 0.1), modes: PLASTIC, gain: 0.05 + k * 0.04, pan })
}
export function jump() {
  if (!limit('jump', 150) || !voice(0.25, 1)) return
  const t = now()
  burst({ t, noise: 'pink', f: 450, f2: 1400, q: 0.9, a: 0.03, d: 0.12, gain: 0.12 })
  step(0.6)
}
export function land(k = 0.5) {
  if (!limit('land', 120) || !voice(0.4, 1)) return
  const t = now()
  k = Math.max(0.25, Math.min(1, k))
  tone({ t, f: vary(85, 0.06), f2: 48, d: 0.11, gain: 0.35 * k })
  burst({ t, noise: 'brown', type: 'lowpass', f: 520, q: 0.6, a: 0.003, d: 0.12, gain: 0.35 * k })
  modal({ t, f: vary(240, 0.1), modes: PLASTIC, gain: 0.1 * k })
}
export function dayNight() {
  if (!voice(1.2, 2)) return
  burst({ t: now(), noise: 'pink', f: 250, f2: 1200, q: 0.6, a: 0.5, d: 0.6, gain: 0.12 })
}
export function respawn() {
  if (!limit('respawn', 400) || !voice(0.9, 2)) return
  const t = now()
  burst({ t, noise: 'pink', f: 3000, f2: 400, q: 1, a: 0.05, d: 0.3, gain: 0.22 })
  modal({ t: t + 0.05, f: C6 * semi(12), modes: GLOCK, gain: 0.06, verb: 0.4 })
}

// --- The throw sequence (game/throw.js) ---------------------------------------------------------
// Stepping onto the yellow band: a soft rising swoosh and a bright four-note "ready" arpeggio.
export function bandEnter() {
  if (!limit('band', 400) || !voice(1.2, 3)) return
  const t = now()
  burst({ t, noise: 'pink', f: 300, f2: 2600, q: 0.9, a: 0.18, d: 0.2, gain: 0.16 })
  tone({ t, f: 220, f2: 440, glide: 0.3, a: 0.05, d: 0.3, gain: 0.05, lp: 1800 })
  glock(t + 0.12, [0, 4, 7, 12], 0.07, 0.11, 0.3)
}
export function bandExit() {
  if (!limit('band', 300) || !voice(0.8, 2)) return
  const t = now()
  burst({ t, noise: 'pink', f: 2400, f2: 400, q: 0.9, a: 0.04, d: 0.22, gain: 0.12 })
  glock(t + 0.03, [12, 7, 0], 0.06, 0.08, 0.25)
}
// The meter slider turning round at either end: a tiny plastic tick, brighter at the top.
export function meterTick(top = false) {
  if (!voice(0.1, 0.5)) return
  modal({ f: top ? 2300 : 1300, modes: PLASTIC, gain: top ? 0.09 : 0.05, bus: A.ui })
}
// The power locked in. grade 0 = PERFECT (bell chord + sparkle) .. 3 = WEAK (a dull clunk).
export function lockIn(grade = 2) {
  if (!voice(1.2, 3)) return
  const t = now()
  modal({ t, f: 900, modes: WOOD, gain: 0.3, strike: 0.2, bus: A.ui })
  tone({ t, f: 160, f2: 80, d: 0.08, gain: 0.2 })
  if (grade === 0) {
    glock(t + 0.03, [12, 16, 19, 24, 28], 0.035, 0.13, 0.4)
    modal({ t: t + 0.03, f: 1568, modes: BELL, gain: 0.12, beat: 4, strike: 0.15, verb: 0.35 })
    crinkle({ t: t + 0.05, n: COARSE_POINTER ? 8 : 16, dur: 0.5, gain: 0.03, f0: 5000, f1: 10000, width: 0.9, verb: 0.3 })
    buzz([25, 30, 40])
  } else if (grade === 1) glock(t + 0.03, [7, 12, 16], 0.04, 0.11, 0.3)
  else if (grade === 2) glock(t + 0.03, [4, 7], 0.05, 0.08, 0.2)
  else tone({ t: t + 0.03, f: 300, f2: 180, d: 0.18, gain: 0.08, lp: 1200 })
}
// A brassy chord stab: detuned saws through a lowpass that opens and closes (notes in semitones from f).
function stab(t, f, notes, { gain = 0.06, d = 0.5, lp = 2600, verb = 0.3 } = {}) {
  for (const n of notes) {
    for (const det of [-9, 9]) tone({ t, type: 'sawtooth', f: f * semi(n), detune: det, a: 0.012, hold: 0.05, d, gain, lp, lpq: 1.2, verb, pan: det / 30 })
  }
}
// A rising noise sweep that builds over dur s (the windup holding back).
function riser(t, dur, gain = 0.1) {
  burst({ t, noise: 'pink', f: 300, f2: 6000, q: 2.2, a: dur * 0.9, d: 0.08, gain })
  tone({ t, type: 'triangle', f: 180, f2: 720, glide: dur, a: dur * 0.8, d: 0.1, gain: gain * 0.5, lp: 2400 })
}
// The cast banner pops (THROW_MODE.castFx): grade 0 PERFECT .. 3 WEAK; special = 'secret' (Jackpot
// Bait) / 'lucky' (Lucky Cast). PERFECT: a fanfare stab, party poppers and a riser into the
// release; GREAT: a smaller stab; GOOD: a soft riser; WEAK: a sad "wah-wah-wahhh".
export function castShow(grade = 2, special = '') {
  if (!voice(2.2, 4)) return
  const t = now() + 0.05
  const big = grade === 0 || special
  if (big) {
    stab(t, 523.25, [0, 4, 7, 12], { gain: 0.05, d: 0.55 })
    stab(t + 0.16, 523.25, [5, 9, 12, 17], { gain: 0.045, d: 0.35 })
    stab(t + 0.3, 523.25, [7, 12, 16, 19], { gain: 0.055, d: 0.8 })
    popper(t + 0.02, -0.6)
    popper(t + 0.1, 0.6)
    glock(t + 0.32, [12, 16, 19, 24, 28, 31], 0.045, 0.1, 0.4)
    riser(t + 0.2, 0.75, 0.09)
    if (special === 'secret') {
      tone({ t, f: 65, f2: 40, d: 0.9, gain: 0.4 })
      modal({ t: t + 0.3, f: 784, modes: BELL, gain: 0.16, beat: 3, strike: 0.2, verb: 0.5 })
      for (let i = 0; i < 12; i++) modal({ t: t + 0.4 + Math.random() * 0.7, f: rnd(2800, 6500), modes: GLASS, gain: 0.03, decay: 0.6, pan: rnd(-0.8, 0.8), verb: 0.4 })
    } else if (special === 'lucky') coinRain(t + 0.35, 14, 0.6, 0.06)
    buzz([40, 30, 40, 30, 80])
  } else if (grade === 1) {
    stab(t, 587.33, [0, 4, 7], { gain: 0.045, d: 0.4 })
    stab(t + 0.14, 587.33, [5, 9, 12], { gain: 0.05, d: 0.6 })
    popper(t + 0.05, 0)
    glock(t + 0.2, [12, 16, 19, 24], 0.05, 0.09, 0.35)
    riser(t + 0.1, 0.55, 0.07)
    buzz([30, 30, 40])
  } else if (grade === 2) {
    riser(t, 0.35, 0.05)
    glock(t + 0.05, [7, 12], 0.07, 0.07, 0.3)
  } else {
    // Sad trombone: three falling steps and a long sagging last note with a wobble.
    const steps = [[233, 226], [220, 213], [208, 201]]
    steps.forEach(([f, f2], i) => tone({ t: t + i * 0.2, type: 'sawtooth', f, f2, a: 0.03, hold: 0.08, d: 0.1, gain: 0.07, lp: 900, lpq: 2 }))
    for (let i = 0; i < 6; i++) tone({ t: t + 0.6 + i * 0.09, type: 'sawtooth', f: 196 - i * 1.5 + (i % 2 ? 4 : -4), f2: 194 - i * 1.5, a: 0.02, hold: 0.04, d: 0.06, gain: 0.065 * (1 - i * 0.12), lp: 800, lpq: 2 })
  }
}
// The release of a graded cast, on top of launch(): PERFECT booms, crackles and throws confetti;
// GREAT a smaller boom and pop; GOOD a light flick; WEAK a limp little "fwip".
export function castRelease(grade = 2, special = '') {
  if (!voice(1.6, 4)) return
  const t = now()
  if (grade === 0 || special) {
    tone({ t, f: 110, f2: 32, d: 0.6, gain: 0.45 })
    burst({ t, noise: 'brown', type: 'lowpass', f: 1400, f2: 160, q: 0.6, a: 0.003, d: 0.55, gain: 0.38 })
    burst({ t, type: 'highpass', f: 3500, q: 0.6, a: 0.0005, d: 0.02, gain: 0.3 })
    popper(t + 0.04, -0.5)
    popper(t + 0.09, 0.5)
    for (let i = 0; i < 10; i++) modal({ t: t + 0.05 + Math.random() * 0.5, f: rnd(3000, 7000), modes: GLASS, gain: 0.03, decay: 0.5, pan: rnd(-0.8, 0.8), verb: 0.4 })
    glock(t + 0.06, [24, 19, 16, 12, 16, 19, 24, 31], 0.035, 0.08, 0.35)
  } else if (grade === 1) {
    tone({ t, f: 100, f2: 40, d: 0.4, gain: 0.35 })
    burst({ t, noise: 'brown', type: 'lowpass', f: 1000, f2: 200, q: 0.6, a: 0.003, d: 0.35, gain: 0.25 })
    popper(t + 0.04, 0)
    glock(t + 0.05, [19, 16, 12, 19, 24], 0.04, 0.07, 0.3)
  } else if (grade === 2) {
    glock(t + 0.04, [12, 19], 0.05, 0.05, 0.25)
  } else {
    burst({ t, noise: 'pink', f: 900, f2: 300, q: 1.2, a: 0.01, d: 0.18, gain: 0.12 })
    tone({ t, type: 'triangle', f: 260, f2: 140, d: 0.25, gain: 0.06, lp: 900 })
  }
}
// The arm pulling back: a rubbery creak stretching upward.
export function windup() {
  if (!voice(0.5, 2)) return
  const t = now()
  tone({ t, type: 'triangle', f: 150, f2: 420, glide: 0.28, a: 0.03, d: 0.25, gain: 0.07, lp: 1400 })
  burst({ t, noise: 'pink', f: 500, f2: 2200, q: 3, a: 0.15, d: 0.14, gain: 0.07 })
}
// The launch: a hard air crack, a sub thump and a long ripping whoosh (longer with power k).
export function launch(k = 0.7) {
  if (!voice(1.6, 4)) return
  const t = now()
  burst({ t, type: 'highpass', f: 2200, q: 0.7, a: 0.0005, d: 0.03, gain: 0.35 })
  tone({ t, f: 140, f2: 45, d: 0.22, gain: 0.42 })
  burst({ t, noise: 'brown', type: 'lowpass', f: 900, f2: 200, q: 0.6, a: 0.002, d: 0.18, gain: 0.3 })
  burst({ t: t + 0.01, noise: 'pink', f: 600, f2: 4800, q: 1.2, a: 0.02, d: 0.35 + k * 0.5, gain: 0.32 })
  burst({ t: t + 0.08, noise: 'pink', f: 4000, f2: 900, q: 1.6, a: 0.05, d: 0.5 + k * 0.6, gain: 0.1, pan: 0.3 })
  for (let i = 0; i < 4; i++) modal({ t: t + 0.04 + i * 0.03, f: C6 * semi(12 + i * 4), modes: GLOCK, gain: 0.035, decay: 0.4, verb: 0.3 })
  buzz([35, 20, 25])
}
// Wind rushing past the chase camera while the food flies. Returns { set(speed 0..1), stop() }.
export function windLoop() {
  if (!ready()) return { set() {}, stop() {} }
  const ctx = A.ctx
  const t = now()
  const src = ctx.createBufferSource()
  src.buffer = A.noise.pink
  src.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 500
  bp.Q.value = 0.9
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.16, t + 0.25)
  // Flutter: a slow LFO on the filter, like gusts over the ears.
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 5.5
  const lg = ctx.createGain()
  lg.gain.value = 180
  lfo.connect(lg).connect(bp.frequency)
  src.connect(bp).connect(g)
  route(g)
  src.start(t, Math.random() * 2)
  lfo.start(t)
  let stopped = false
  return {
    set(k) {
      if (stopped) return
      const c = ctx.currentTime
      bp.frequency.setTargetAtTime(380 + k * 1700, c, 0.08)
      g.gain.setTargetAtTime(0.05 + k * 0.17, c, 0.08)
      lfo.frequency.setTargetAtTime(4 + k * 6, c, 0.1)
    },
    stop(fade = 0.12) {
      if (stopped) return
      stopped = true
      const c = ctx.currentTime
      g.gain.setTargetAtTime(0.0001, c, fade)
      src.stop(c + fade * 6)
      lfo.stop(c + fade * 6)
    },
  }
}
// Flying over a new rarity zone: a pass-by whoosh and a chime that climbs zone by zone.
export function zoneCross(i = 0) {
  if (!voice(1, 3)) return
  const t = now()
  burst({ t, noise: 'pink', f: 1800, f2: 500, q: 1.3, a: 0.03, d: 0.25, gain: 0.12 })
  const base = [0, 2, 4, 7, 9, 12, 14][Math.min(6, i)]
  glock(t, [base, base + 7, base + 12], 0.045, 0.12, 0.4)
  modal({ t, f: C6 * semi(base) * 0.5, modes: BELL, gain: 0.05 + i * 0.01, beat: 3, verb: 0.4 })
  buzz(15)
}
// Slow motion kicks in: a deep downward "bwoom" and a stretched air tail.
export function slowmo() {
  if (!voice(1.2, 3)) return
  const t = now()
  tone({ t, f: 220, f2: 55, glide: 0.8, a: 0.02, d: 0.9, gain: 0.22, lp: 900 })
  burst({ t, noise: 'pink', f: 2600, f2: 300, q: 0.8, a: 0.05, d: 0.9, gain: 0.12 })
}
// Touchdown: a heavy sub thump, a crunchy splat and debris pattering down.
export function impact(k = 1) {
  if (!voice(1.4, 4)) return
  const t = now()
  k = Math.max(0.3, Math.min(1, k))
  tone({ t, f: 95, f2: 32, d: 0.5, gain: 0.55 * k })
  burst({ t, noise: 'brown', type: 'lowpass', f: 1200, f2: 180, q: 0.5, a: 0.002, d: 0.45, gain: 0.48 * k })
  burst({ t, type: 'highpass', f: 1800, q: 0.6, a: 0.0008, d: 0.05, gain: 0.25 * k })
  crinkle({ t: t + 0.02, n: COARSE_POINTER ? 10 : 22, dur: 0.12, gain: 0.12 * k, f0: 1200, f1: 5000, width: 0.7 })
  bubbles({ t: t + 0.01, n: 8, dur: 0.15, f0: 300, f1: 900, gain: 0.07 * k })
  crinkle({ t: t + 0.25, n: COARSE_POINTER ? 8 : 16, dur: 0.6, gain: 0.03, f0: 2000, f1: 6000, width: 0.9 })
  buzz([60, 30, 40])
}
// A bounce after touchdown (k = how hard).
export function bounce(k = 0.5) {
  if (!voice(0.3, 1)) return
  const t = now()
  tone({ t, f: vary(150, 0.06), f2: 70, d: 0.1, gain: 0.25 * k })
  burst({ t, noise: 'brown', type: 'lowpass', f: 800, q: 0.6, d: 0.07, gain: 0.25 * k })
  modal({ t, f: vary(380, 0.08), modes: PLASTIC, gain: 0.1 * k })
}
// "Click to continue" pressed.
export function proceed() {
  if (!voice(0.4, 2)) return
  const t = now()
  modal({ t, f: 1500, modes: PLASTIC, gain: 0.14, strike: 0.1, bus: A.ui })
  bubble({ t: t + 0.02, f: 600, d: 0.06, gain: 0.18, rise: 0.9, bus: A.ui })
}
// One letter of the name typing out (i = letter index).
export function typeKey(i = 0) {
  if (!voice(0.15, 0.5)) return
  const t = now()
  modal({ t, f: vary(2600, 0.06) * (1 + (i % 3) * 0.04), modes: PLASTIC, gain: 0.1, strike: 0.15, bus: A.ui })
  burst({ t, f: vary(5200, 0.1), q: 2, d: 0.008, gain: 0.08, bus: A.ui })
}
// Suspense before the card: a snare roll that speeds up and swells over dur s.
export function drumroll(dur = 1.2, rarity = 0) {
  if (!voice(dur + 0.2, 3)) return
  const t = now()
  let at = 0
  let gap = 0.085
  while (at < dur) {
    const k = at / dur
    burst({ t: t + at, f: vary(1900, 0.15), q: 0.8, a: 0.001, d: 0.045, gain: (0.05 + k * 0.12) * (1 + rarity * 0.08), pan: rnd(-0.2, 0.2), verb: 0.15 })
    at += gap
    gap = Math.max(0.035, gap * 0.95)
  }
  tone({ t, f: 70, f2: 110, glide: dur, a: dur * 0.8, d: 0.1, gain: 0.08 + rarity * 0.02, lp: 400 })
}
// The rarity card slams in: a crash, a chord stab and a run, all bigger for rarer finds.
export function reveal(rarity = 0) {
  if (!voice(2.6, 5)) return
  const t = now()
  burst({ t, type: 'highpass', f: 5000, q: 0.5, a: 0.002, d: 0.8 + rarity * 0.25, gain: 0.12 + rarity * 0.025, verb: 0.4 })
  tone({ t, f: 110, f2: 55, d: 0.3, gain: 0.35 })
  burst({ t, noise: 'brown', type: 'lowpass', f: 600, q: 0.6, d: 0.2, gain: 0.3 })
  const chords = [[0, 4, 7], [0, 4, 7, 12], [0, 4, 7, 11, 14], [0, 3, 7, 10, 14], [0, 4, 7, 11, 14, 18], [0, 3, 7, 12, 15, 19], [0, 5, 7, 12, 17, 19, 24]]
  for (const n of chords[Math.min(6, rarity)]) {
    tone({ t, type: 'triangle', f: 261.6 * semi(n), a: 0.005, d: 0.5 + rarity * 0.12, gain: 0.05, lp: 3000, verb: 0.3 })
    modal({ t, f: C6 * semi(n), modes: GLOCK, gain: 0.08, strike: 0.1, verb: 0.35 })
  }
  if (rarity >= 2) glock(t + 0.12, [12, 16, 19, 24, 28, 31].slice(0, 3 + rarity), 0.05, 0.1, 0.4)
  if (rarity >= 3) {
    popper(t + 0.06, -0.6)
    popper(t + 0.1, 0.6)
    modal({ t: t + 0.05, f: 523, modes: BELL, gain: 0.18, beat: 3, strike: 0.15, verb: 0.5 })
  }
  if (rarity >= 5) for (let i = 0; i < 14; i++) modal({ t: t + 0.1 + Math.random() * 1.2, f: rnd(2800, 7000), modes: GLASS, gain: 0.03, decay: 0.8, pan: rnd(-0.8, 0.8), verb: 0.5 })
  buzz(rarity >= 3 ? [60, 40, 60, 40, 120] : [40, 30])
}
// The "NEW!" stamp.
export function newStamp() {
  if (!voice(0.8, 2)) return
  const t = now()
  modal({ t, f: 220, modes: WOOD, gain: 0.4, strike: 0.2, bus: A.ui })
  tone({ t, f: 130, f2: 70, d: 0.08, gain: 0.25 })
  glock(t + 0.05, [19, 24], 0.05, 0.1, 0.3)
}
// A full-screen wipe between shots.
export function wipe() {
  if (!limit('wipe', 250) || !voice(0.8, 2)) return
  const t = now()
  burst({ t, noise: 'pink', f: 400, f2: 3800, q: 1, a: 0.12, d: 0.25, gain: 0.18 })
  burst({ t: t + 0.25, noise: 'pink', f: 3800, f2: 600, q: 1, a: 0.04, d: 0.3, gain: 0.1 })
}
// The Lucky Throw armed.
export function luckyArm() {
  if (!voice(1.4, 3)) return
  const t = now()
  purchase()
  glock(t + 0.1, [0, 4, 7, 12, 16, 19, 24], 0.04, 0.1, 0.4)
  for (let i = 0; i < 8; i++) modal({ t: t + 0.1 + Math.random() * 0.6, f: rnd(3000, 6500), modes: GLASS, gain: 0.025, decay: 0.6, pan: rnd(-0.7, 0.7), verb: 0.4 })
}

// Pushing out through a bush: a leafy rustle with a couple of twig snaps.
export function rustle() {
  if (!voice(0.8, 2)) return
  const t = now()
  crinkle({ t, n: COARSE_POINTER ? 14 : 28, dur: 0.45, gain: 0.07, f0: 1500, f1: 6000, width: 0.6 })
  burst({ t, noise: 'pink', f: 1800, f2: 900, q: 0.8, a: 0.04, d: 0.35, gain: 0.12 })
  modal({ t: t + 0.12, f: vary(1300, 0.1), modes: WOOD, gain: 0.08, strike: 0.15 })
  modal({ t: t + 0.27, f: vary(1700, 0.1), modes: WOOD, gain: 0.06, strike: 0.15 })
}

// --- Foods (Food Shop + throws; foods have a sound "kind" and a rarity fx level 0..10) ---
// The food pops into your hand: a soft pop, a sparkle that grows with rarity.
export function foodAppear(fx = 0) {
  if (!limit('food-appear', 150) || !voice(0.6, 2)) return
  const t = now()
  bubble({ t, f: vary(420, 0.06), d: 0.07, gain: 0.2, rise: 1.2 })
  if (fx >= 2) glock(t + 0.03, [12, 19, 24].slice(0, 1 + Math.min(2, fx >> 1)), 0.05, 0.06, 0.35)
  if (fx >= 6) for (let i = 0; i < 6; i++) modal({ t: t + 0.05 + i * 0.04, f: rnd(3200, 6400), modes: GLASS, gain: 0.02, decay: 0.5, pan: rnd(-0.5, 0.5), verb: 0.4 })
}
// Launch shimmer on top of the whoosh: a rising run for rarer foods, choir-ish bell above.
export function foodLaunch(fx = 0) {
  if (fx < 1 || !voice(1.2, 3)) return
  const t = now()
  const run = [0, 4, 7, 12, 16, 19, 24, 28, 31, 36].slice(0, 2 + Math.min(8, fx))
  glock(t + 0.05, run, 0.035, 0.05 + fx * 0.006, 0.4)
  if (fx >= 6) {
    tone({ t, type: 'sawtooth', f: 220, f2: 440, glide: 0.5, a: 0.08, d: 0.6, gain: 0.03, lp: 1600, verb: 0.5 })
    tone({ t, type: 'sawtooth', f: 330, f2: 660, glide: 0.5, a: 0.08, d: 0.6, gain: 0.02, lp: 1600, verb: 0.5 })
  }
  if (fx >= 8) modal({ t: t + 0.08, f: 784, modes: BELL, gain: 0.1, beat: 3, strike: 0.1, verb: 0.5 })
}
// What the food itself sounds like hitting the ground (layered over impact()).
export function foodImpact(kind = 'soft', k = 1, fx = 0) {
  if (!voice(1.2, 3)) return
  const t = now()
  k = Math.max(0.3, Math.min(1, k))
  switch (kind) {
    case 'crunch':
      crinkle({ t, n: COARSE_POINTER ? 14 : 30, dur: 0.16, gain: 0.24 * k, f0: 1800, f1: 7500, width: 0.6 })
      burst({ t, type: 'highpass', f: 3000, q: 0.7, a: 0.0005, d: 0.03, gain: 0.25 * k })
      modal({ t, f: vary(900, 0.1), modes: WOOD, gain: 0.25 * k, strike: 0.2 })
      break
    case 'squish':
      bubbles({ t, n: 12, dur: 0.2, f0: 250, f1: 1000, gain: 0.13 * k, d: [0.02, 0.06] })
      burst({ t, noise: 'brown', type: 'lowpass', f: 1500, f2: 280, q: 0.8, a: 0.002, d: 0.18, gain: 0.38 * k })
      tone({ t, f: 230, f2: 90, d: 0.13, gain: 0.15 * k, lp: 900 })
      break
    case 'meat':
      burst({ t, type: 'highpass', f: 1300, q: 0.6, a: 0.0006, d: 0.025, gain: 0.42 * k })
      tone({ t, f: 150, f2: 58, d: 0.18, gain: 0.32 * k })
      bubbles({ t: t + 0.01, n: 5, dur: 0.1, f0: 200, f1: 600, gain: 0.07 * k })
      break
    case 'jelly':
      // A wobbly boing: a pitch that bounces up and down, plus wet blips.
      for (let i = 0; i < 4; i++) tone({ t: t + i * 0.07, f: 180 + (i % 2 ? 260 : 60), f2: 180 + (i % 2 ? 60 : 260), a: 0.005, d: 0.08, gain: (0.16 - i * 0.03) * k, lp: 1800 })
      bubbles({ t, n: 8, dur: 0.25, f0: 400, f1: 1300, gain: 0.08 * k })
      break
    case 'metal':
      modal({ t, f: vary(620, 0.04), modes: METAL, gain: 0.32 * k, beat: 6, strike: 0.3, verb: 0.35 })
      modal({ t: t + 0.01, f: vary(1380, 0.04), modes: METAL, gain: 0.16 * k, beat: 4, verb: 0.35 })
      coinRain(t + 0.05, COARSE_POINTER ? 6 : 12, 0.5, 0.06)
      break
    case 'cosmic':
      tone({ t, f: 80, f2: 28, d: 0.9, gain: 0.4 * k })
      for (let i = 0; i < (COARSE_POINTER ? 8 : 16); i++) modal({ t: t + Math.random() * 0.8, f: rnd(2400, 7000), modes: GLASS, gain: 0.035, decay: 0.8, pan: rnd(-0.8, 0.8), verb: 0.5 })
      glock(t + 0.05, [0, 7, 12, 19, 24], 0.05, 0.08, 0.5)
      break
    default:
      // soft: a pillowy whump.
      burst({ t, noise: 'pink', type: 'lowpass', f: 900, f2: 250, q: 0.6, a: 0.004, d: 0.2, gain: 0.3 * k })
      tone({ t, f: 125, f2: 60, d: 0.16, gain: 0.25 * k })
      crinkle({ t: t + 0.02, n: COARSE_POINTER ? 4 : 8, dur: 0.1, gain: 0.05 * k, f0: 1500, f1: 4000 })
  }
  if (fx >= 4) modal({ t: t + 0.05, f: 523 * semi(Math.min(12, fx)), modes: BELL, gain: 0.06 + fx * 0.008, beat: 3, strike: 0.1, verb: 0.5 })
  if (fx >= 9) {
    popper(t + 0.08, -0.4)
    popper(t + 0.14, 0.4)
  }
}
// A smaller version for each bounce.
export function foodBounce(kind = 'soft', k = 0.5) {
  if (!limit('food-bounce', 50) || !voice(0.3, 1)) return
  const t = now()
  if (kind === 'crunch') crinkle({ t, n: 6, dur: 0.06, gain: 0.1 * k, f0: 2000, f1: 6000 })
  else if (kind === 'squish' || kind === 'jelly') bubbles({ t, n: 4, dur: 0.08, f0: 300, f1: 900, gain: 0.07 * k })
  else if (kind === 'metal') modal({ t, f: vary(900, 0.06), modes: METAL, gain: 0.12 * k, beat: 5 })
  else if (kind === 'cosmic') modal({ t, f: rnd(2400, 4800), modes: GLASS, gain: 0.05 * k, verb: 0.4 })
  else if (kind === 'meat') burst({ t, type: 'highpass', f: 1400, q: 0.6, d: 0.02, gain: 0.18 * k })
}
// Buying a food: the till, then a fanfare that grows with its rarity.
export function foodBuy(fx = 0) {
  purchase()
  if (!voice(2, 4)) return
  const t = now() + 0.12
  const runs = [[0, 4, 7, 12], [0, 4, 7, 12, 16], [0, 4, 7, 12, 16, 19], [0, 4, 7, 11, 12, 16, 19, 24], [0, 4, 7, 12, 16, 19, 24, 28], [0, 4, 7, 12, 16, 19, 24, 28, 31]]
  glock(t, runs[Math.min(5, Math.floor(fx / 2))], 0.055, 0.13, 0.35, A.ui)
  if (fx >= 4) modal({ t: t + 0.05, f: 659, modes: BELL, gain: 0.14, beat: 3, strike: 0.15, verb: 0.4, bus: A.ui })
  if (fx >= 6) {
    popper(t + 0.1, -0.5)
    popper(t + 0.18, 0.5)
  }
  if (fx >= 8) for (let i = 0; i < 10; i++) modal({ t: t + 0.2 + Math.random() * 0.6, f: rnd(2800, 6500), modes: GLASS, gain: 0.025, decay: 0.6, pan: rnd(-0.7, 0.7), verb: 0.4, bus: A.ui })
}
// Equipping an owned food: a quick two-note "ready".
export function foodEquip(fx = 0) {
  if (!voice(0.5, 2)) return
  glock(now() + 0.04, fx >= 6 ? [7, 12, 19] : [7, 12], 0.05, 0.08, 0.25, A.ui)
}

// --- Water (the fishing loop) ---------------------------------------------------------------------
// A splash (k = how big): a wet noise whoosh, a low plunk, a fizz of bubbles, droplets pattering.
export function splash(k = 1) {
  if (!voice(1.2, 3)) return
  const t = now()
  k = Math.max(0.2, Math.min(1, k))
  burst({ t, noise: 'pink', type: 'bandpass', f: 1500, f2: 420, q: 0.7, a: 0.004, d: 0.3 + k * 0.35, gain: 0.4 * k })
  burst({ t, type: 'highpass', f: 3400, q: 0.5, a: 0.002, d: 0.22 + k * 0.1, gain: 0.2 * k })
  tone({ t, f: 190, f2: 70, d: 0.18, gain: 0.28 * k, lp: 900 })
  bubbles({ t: t + 0.03, n: COARSE_POINTER ? 8 : 16, dur: 0.45, f0: 300, f1: 1500, gain: 0.1 * k })
  crinkle({ t: t + 0.18, n: COARSE_POINTER ? 6 : 14, dur: 0.5 * k + 0.2, gain: 0.05 * k, f0: 2500, f1: 7500, width: 0.9 })
}
// A nibble on the bobber: a little plop.
export function plop(k = 0.6) {
  if (!voice(0.3, 1)) return
  const t = now()
  bubble({ t, f: vary(420, 0.12), d: 0.09, gain: 0.3 * k, rise: 1.8 })
  bubbles({ t: t + 0.02, n: 4, dur: 0.12, f0: 500, f1: 1200, gain: 0.05 * k })
}
// The reel: a ratchet of quick clicks (k = how long it runs).
export function reel(k = 1) {
  if (!voice(0.5, 2)) return
  const t = now()
  const n = Math.round(8 + k * 10)
  for (let i = 0; i < n; i++) modal({ t: t + i * 0.028, f: vary(2300, 0.05), modes: PLASTIC, gain: 0.05 * (1 - i / n) + 0.02, strike: 0.05 })
}

// --- Tackle: rods, baits and trails (their power level `fx` runs 0..10 with the rarity) --------------
// A rod being swung: a tier-scaled power-up under the whoosh. Plain rods only whip; every rarity
// adds a layer: a rising glock run, a choir swell, a sub boom, a crackle, a final bell + sparkle rain.
export function rodPower(fx = 0, tier = 0) {
  if (fx < 1 || !limit('rod-power', 120) || !voice(1.6, 4)) return
  const t = now()
  const k = Math.min(1, Math.max(fx / 10, tier / 53))
  burst({ t, type: 'highpass', f: 2200 + fx * 250, q: 0.7, a: 0.002, d: 0.12 + fx * 0.012, gain: 0.12 + k * 0.1 })
  if (fx >= 3) tone({ t, f: 90 + fx * 8, f2: 40, d: 0.28 + k * 0.4, gain: 0.18 + k * 0.2, lp: 700 })
  if (fx >= 4) {
    tone({ t, type: 'sawtooth', f: 180, f2: 360 + fx * 30, glide: 0.45, a: 0.06, d: 0.55, gain: 0.025 + k * 0.02, lp: 1800, verb: 0.5 })
    tone({ t, type: 'sawtooth', f: 270, f2: 540 + fx * 40, glide: 0.45, a: 0.06, d: 0.55, gain: 0.02 + k * 0.02, lp: 2000, verb: 0.5 })
  }
  if (fx >= 5) crinkle({ t: t + 0.03, n: COARSE_POINTER ? 10 : 22, dur: 0.45, gain: 0.05 + k * 0.03, f0: 2500, f1: 9000, width: 0.8 })
  if (fx >= 6) modal({ t: t + 0.1, f: 659 * semi(fx - 6), modes: BELL, gain: 0.1 + k * 0.06, beat: 3, strike: 0.12, verb: 0.55 })
  if (fx >= 7) {
    tone({ t: t + 0.04, f: 55, f2: 30, d: 0.9, gain: 0.3 })
    for (let i = 0; i < (COARSE_POINTER ? 6 : 12); i++) modal({ t: t + 0.1 + i * 0.045, f: rnd(2600, 7200), modes: GLASS, gain: 0.03, decay: 0.7, pan: rnd(-0.8, 0.8), verb: 0.5 })
  }
  if (fx >= 9) {
    glock(t + 0.12, [0, 7, 12, 16, 19, 24, 28, 31, 36], 0.045, 0.1, 0.5)
    popper(t + 0.35, -0.5)
    popper(t + 0.42, 0.5)
  }
}
// Buying a bait pack: a till, then a fanfare that grows with the bait's rarity, jackpot = slot payout.
export function baitBuy(fx = 0, jackpot = false) {
  purchase()
  if (!voice(2, 4)) return
  const t = now() + 0.1
  if (jackpot) {
    for (let i = 0; i < 14; i++) modal({ t: t + i * 0.05, f: 1500 + (i % 4) * 300, modes: PLASTIC, gain: 0.07, strike: 0.1, pan: rnd(-0.3, 0.3) })
    glock(t + 0.7, [0, 4, 7, 12, 16, 19, 24, 28, 31], 0.06, 0.16, 0.4, A.ui)
    coinRain(t + 0.75, COARSE_POINTER ? 14 : 28, 1.1, 0.07)
    popper(t + 0.85, -0.5)
    popper(t + 0.95, 0.5)
    return
  }
  glock(t, [0, 5, 9, 12, 17, 21, 24, 29].slice(0, 3 + Math.min(5, fx >> 1)), 0.05, 0.12, 0.35, A.ui)
  bubbles({ t, n: 6 + fx, dur: 0.3, f0: 400, f1: 1600, gain: 0.07, bus: A.ui })
  if (fx >= 4) modal({ t: t + 0.06, f: 740, modes: BELL, gain: 0.13, beat: 3, strike: 0.15, verb: 0.4, bus: A.ui })
  if (fx >= 6) popper(t + 0.12, 0.4)
  if (fx >= 8) for (let i = 0; i < 10; i++) modal({ t: t + 0.2 + Math.random() * 0.6, f: rnd(2800, 6500), modes: GLASS, gain: 0.025, decay: 0.6, pan: rnd(-0.7, 0.7), verb: 0.4, bus: A.ui })
}
// Hooking a bait on / putting it away.
export function baitEquip(fx = 0, off = false) {
  if (!voice(0.5, 2)) return
  const t = now()
  if (off) {
    glock(t + 0.03, [12, 5], 0.06, 0.07, 0.2, A.ui)
    return
  }
  bubble({ t, f: 520, d: 0.06, gain: 0.2, rise: 1.5 })
  glock(t + 0.05, fx >= 5 ? [5, 12, 17] : [5, 12], 0.05, 0.09, 0.3, A.ui)
}
// The bait goes on the hook as you cast: a wet "plip" and a charge that grows with its rarity.
export function baitUse(fx = 0, jackpot = false) {
  if (!limit('bait-use', 200) || !voice(1.4, 3)) return
  const t = now()
  bubble({ t, f: vary(360, 0.08), d: 0.08, gain: 0.25, rise: 1.6 })
  bubbles({ t: t + 0.02, n: 6, dur: 0.2, f0: 500, f1: 1500, gain: 0.06 })
  if (fx >= 2) glock(t + 0.06, [7, 12, 16, 19].slice(0, 1 + (fx >> 1)), 0.05, 0.08 + fx * 0.006, 0.4)
  if (fx >= 4) tone({ t, type: 'sawtooth', f: 140, f2: 420, glide: 0.5, a: 0.05, d: 0.5, gain: 0.03, lp: 1500, verb: 0.5 })
  if (fx >= 6) for (let i = 0; i < (COARSE_POINTER ? 5 : 10); i++) modal({ t: t + 0.08 + i * 0.05, f: rnd(2800, 6800), modes: GLASS, gain: 0.03, decay: 0.7, pan: rnd(-0.7, 0.7), verb: 0.5 })
  if (fx >= 8) modal({ t: t + 0.15, f: 880, modes: BELL, gain: 0.14, beat: 3, strike: 0.12, verb: 0.6 })
  if (jackpot) {
    for (let i = 0; i < 10; i++) modal({ t: t + i * 0.06, f: 1200 + i * 140, modes: PLASTIC, gain: 0.06, strike: 0.08 })
    modal({ t: t + 0.7, f: 1568, modes: BELL, gain: 0.2, beat: 3, strike: 0.15, verb: 0.5 })
  }
}
// A trail bought / tried on: a soft sparkle swoosh.
export function trailBuy(fx = 0) {
  purchase()
  if (!voice(1.5, 3)) return
  const t = now() + 0.1
  glock(t, [0, 7, 12, 19, 24, 28].slice(0, 3 + Math.min(3, fx >> 1)), 0.05, 0.1, 0.45, A.ui)
  burst({ t, type: 'highpass', f: 3000, q: 0.6, a: 0.01, d: 0.4, gain: 0.07, bus: A.ui })
  for (let i = 0; i < (COARSE_POINTER ? 5 : 10); i++) modal({ t: t + 0.1 + Math.random() * 0.5, f: rnd(3000, 7000), modes: GLASS, gain: 0.02, decay: 0.5, pan: rnd(-0.7, 0.7), verb: 0.4, bus: A.ui })
}
export function trailTry(fx = 0) {
  if (!voice(0.6, 2)) return
  const t = now()
  burst({ t, type: 'highpass', f: 2600, q: 0.6, a: 0.02, d: 0.25, gain: 0.08, bus: A.ui })
  glock(t + 0.04, fx >= 5 ? [12, 19, 24] : [12, 19], 0.05, 0.08, 0.35, A.ui)
}

// --- The animal's-eye view (the bait is in the water) ---------------------------------------------
// Diving in: a muffled rush, a low swell and a swarm of bubbles, as if the ears went under.
export function dive() {
  if (!voice(1.4, 3)) return
  const t = now()
  burst({ t, noise: 'pink', type: 'lowpass', f: 2400, f2: 260, q: 0.7, a: 0.01, d: 0.9, gain: 0.35 })
  tone({ t, f: 140, f2: 48, d: 0.6, gain: 0.3, lp: 600 })
  bubbles({ t: t + 0.04, n: COARSE_POINTER ? 10 : 22, dur: 0.7, f0: 250, f1: 1400, gain: 0.09, verb: 0.2 })
  tone({ t: t + 0.1, f: 55, f2: 62, a: 0.5, d: 1.2, gain: 0.1, lp: 300 }) // the water's low hum
}
// The animal spots the bait: a sonar ping with a shimmer and a curious rising blip.
export function sonar() {
  if (!voice(1.6, 4)) return
  const t = now()
  tone({ t, f: 1180, f2: 1160, a: 0.004, d: 1.1, gain: 0.16, verb: 0.55 })
  tone({ t: t + 0.18, f: 1180, f2: 1160, a: 0.004, d: 0.8, gain: 0.07, verb: 0.55 })
  tone({ t: t + 0.03, f: 440, f2: 820, glide: 0.18, a: 0.01, d: 0.26, gain: 0.08, lp: 2600 })
  glock(t + 0.12, [12, 16, 19, 24], 0.06, 0.07, 0.5)
}
// A heartbeat (k = 0..1 how worked up it is): two soft thumps, harder as the bait gets close.
export function heartbeat(k = 0) {
  if (!voice(0.4, 2)) return
  const t = now()
  const g = 0.28 + k * 0.3
  tone({ t, f: 78, f2: 40, d: 0.16, gain: g, lp: 400 })
  burst({ t, noise: 'brown', type: 'lowpass', f: 300, q: 0.6, d: 0.12, gain: g * 0.6 })
  tone({ t: t + 0.15, f: 66, f2: 36, d: 0.2, gain: g * 0.8, lp: 360 })
  buzz([25, 70, 25])
}
// The lunge at the bait: a rising water rush and a tight whoosh of bubbles.
export function lunge() {
  if (!voice(0.8, 3)) return
  const t = now()
  burst({ t, noise: 'pink', type: 'bandpass', f: 400, f2: 3600, q: 0.8, a: 0.12, d: 0.2, gain: 0.34 })
  tone({ t, f: 120, f2: 520, glide: 0.25, a: 0.05, d: 0.2, gain: 0.12, lp: 1800 })
  bubbles({ t, n: COARSE_POINTER ? 6 : 12, dur: 0.25, f0: 500, f1: 2200, gain: 0.07 })
}
// The bite lands: a wet chomp, a glass ting and the bait's pop.
export function chomp() {
  if (!voice(0.8, 4)) return
  const t = now()
  tone({ t, f: 210, f2: 70, d: 0.14, gain: 0.4, lp: 900 })
  burst({ t, noise: 'brown', type: 'lowpass', f: 1400, f2: 300, q: 0.6, a: 0.002, d: 0.16, gain: 0.35 })
  bubble({ t: t + 0.02, f: 520, d: 0.08, gain: 0.3, rise: 2 })
  modal({ t: t + 0.03, f: 1900, modes: GLASS, gain: 0.1, strike: 0.15, verb: 0.3 })
  buzz([50, 20, 50])
}
