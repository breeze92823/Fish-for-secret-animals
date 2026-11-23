// Trails (TRAILS in config) and the tier-scaled "power" effects of rods and baits.
//   emitTrail   - spawn a trail's particles for `dt` seconds at a point moving along `dir`
//   trailColor  - the colour of the streak behind the bobber at k (0 head .. 1 tail)
//   castBlast   - what a cast looks like for a rod of power `level` (0..10 = FOOD_RARITIES fx):
//                 each step up adds: sparkles, ring, stars, a light beam, spiral, shockwaves,
//                 lightning stars, a confetti finish
//   baitBlast   - the bait going on the hook: grows with the bait's rarity; the Jackpot Bait pays out
// Pools only (fx.particle / fx.sparkle ...), no per-frame allocation beyond three scratch values.
import { Color, Vector3 } from 'three'
import { COARSE_POINTER, FOOD_RARITIES } from '../config.js'
import { SPR } from './particles.js'

const tmp = new Color()
const tmp2 = new Color()
const at = new Vector3()
const rnd = (a, b) => a + Math.random() * (b - a)
const DENSITY = COARSE_POINTER ? 0.6 : 1
const RAINBOW = ['#ff5a5a', '#ffb02a', '#ffe14a', '#5aff8a', '#5ac8ff', '#c07dff']

export const trailLevel = (def) => FOOD_RARITIES[def?.rarity ?? 0].fx

export function trailColor(def, k, t, out) {
  const r = def.ribbon
  if (r === 'rainbow') return out.setHSL((t * 0.5 + k * 1.3) % 1, 1, 0.62)
  if (Array.isArray(r)) return out.set(r[0]).lerp(tmp2.set(r[1]), k)
  return null
}

// One trail at p for dt seconds; dir = which way p is moving (unit-ish), scale thins it out.
export function emitTrail(fx, def, p, dir, dt, t, scale = 1) {
  const lvl = trailLevel(def)
  for (const part of def.parts) {
    const n = part.rate * dt * DENSITY * scale * (1 + lvl * 0.05)
    let cnt = Math.floor(n)
    if (Math.random() < n - cnt) cnt++
    for (let i = 0; i < cnt; i++) {
      if (part.hue) tmp.setHSL(((part.hueBase ?? 0) + (t * 0.7 + Math.random() * 0.25) * (part.hueSpan ?? 1)) % 1, 1, 0.6)
      else tmp.set(part.c[(Math.random() * part.c.length) | 0])
      const size = rnd(part.size[0], part.size[1])
      fx.particle(part.glow ? 'glow' : 'solid', {
        x: p.x + rnd(-0.12, 0.12),
        y: p.y + rnd(-0.12, 0.12),
        z: p.z + rnd(-0.12, 0.12),
        vx: -dir.x * part.back + rnd(-part.spread, part.spread),
        vy: -dir.y * part.back + part.up * rnd(0.4, 1.4) + rnd(-0.2, 0.2),
        vz: -dir.z * part.back + rnd(-part.spread, part.spread),
        color: tmp,
        size,
        size1: part.s === 'smoke' ? size * 1.8 : 0,
        life: rnd(part.life[0], part.life[1]),
        gravity: part.grav,
        drag: 0.8,
        sprite: SPR[part.s] ?? SPR.dot,
        spin: part.spin ? rnd(-part.spin, part.spin) : 0,
        fadeIn: 0.08,
      })
    }
  }
}

// A preview burst for TRY IT / buying: a quick puff of the trail's own particles around p.
export function trailBurst(fx, def, p, count = 18) {
  const dir = { x: 0, y: 0, z: 0 }
  for (let i = 0; i < count; i++) emitTrail(fx, def, p, dir, 0.09, performance.now() / 1000 + i * 0.1, 1.6)
}

// --- Rod cast effects (level = the rod's FOOD_RARITIES fx 0..10, tier = 1..53) ----------------------
// from = the bobber at the moment of the cast, glow = the rod's glow colour.
export function castBlast(fx, ui, director, level, tier, from, ground, glow, accent) {
  const k = Math.min(1, level / 10)
  if (level >= 1) fx.sparkle(from, glow, 8 + level * 3, { speed: 6, size: 0.35 })
  if (level >= 2) fx.sparkle(from, accent, 6 + level * 2, { speed: 8, size: 0.3, up: 3 })
  if (level >= 3) fx.stars(from, glow, 6 + level * 2, 5 + level)
  if (level >= 4) fx.ring(ground, glow, { r0: 0.6, r1: 6 + level * 0.6, life: 0.55 })
  if (level >= 4) fx.beam(at.set(ground.x, 0.05, ground.z), glow, { radius: 0.5 + level * 0.1, height: 8 + level * 2, life: 0.7 })
  if (level >= 5) {
    fx.ring(ground, accent, { r0: 0.4, r1: 9 + level, life: 0.8 })
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2
      tmp.set(RAINBOW[i % RAINBOW.length])
      fx.particle('glow', { x: from.x, y: from.y, z: from.z, vx: Math.cos(a) * 5, vy: 2 + (i % 3), vz: Math.sin(a) * 5, color: tmp, size: 0.4, size1: 0, life: 0.9, sprite: SPR.sparkle, drag: 1.5, gravity: -2 })
    }
  }
  if (level >= 6) {
    // A spiral of light climbing out of the rod.
    for (let i = 0; i < 30; i++) {
      const a = i * 0.7
      tmp.set(i % 2 ? glow : '#ffffff')
      fx.particle('glow', { x: from.x + Math.cos(a) * 0.3, y: from.y + i * 0.07, z: from.z + Math.sin(a) * 0.3, vx: Math.cos(a) * 1.4, vy: 2.5, vz: Math.sin(a) * 1.4, color: tmp, size: 0.35, size1: 0, life: 0.9, sprite: SPR.star, spin: 4 })
    }
    ui?.flash?.(glow, 0.2 + k * 0.15, 0.3)
  }
  if (level >= 7) {
    for (let i = 0; i < 3; i++) setTimeout(() => fx.ring(ground, i % 2 ? '#ffffff' : glow, { r0: 0.5, r1: 12 + i * 4, life: 0.7 }), i * 110)
    director?.shake?.(0.25)
  }
  if (level >= 8) {
    fx.beam(at.set(ground.x, 0.05, ground.z), '#ffffff', { radius: 1.3, height: 26, life: 1 })
    fx.stars(from, '#ffffff', 22, 9)
    director?.kick?.(8)
  }
  if (level >= 9) {
    fx.confetti(from, 50 + level * 6, 8)
    director?.shake?.(0.35)
  }
  if (level >= 10) {
    fx.confetti(from, 80, 10)
    for (const c of RAINBOW) fx.sparkle(from, c, 10, { speed: 10, up: 4, size: 0.5 })
  }
  // Higher tiers inside a rarity push a little further.
  const bonus = Math.floor((tier / 53) * 14)
  if (bonus > 0) fx.sparkle(from, glow, bonus, { speed: 7, size: 0.4 })
}

// --- Bait effects (level = the bait's rarity fx 0..10) -------------------------------------------------
export function baitBlast(fx, ui, director, bait, level, from, ground, colors) {
  const [a, b, c] = colors
  const n = 6 + level * 4
  fx.sparkle(from, a, n, { speed: 3 + level * 0.5, size: 0.3, up: 1.5 })
  fx.sparkle(from, c ?? '#ffffff', Math.round(n / 2), { speed: 5, size: 0.25, up: 2.5 })
  if (level >= 2) fx.motes(from, b, 6 + level * 2, 0.8, { rise: 1.6, size: 0.25 })
  if (level >= 3) fx.ring(ground, a, { r0: 0.4, r1: 4 + level * 0.7, life: 0.5 })
  if (level >= 4) fx.stars(from, c ?? '#ffffff', 8 + level * 2, 5)
  if (level >= 5) {
    fx.beam(at.set(ground.x, 0.05, ground.z), a, { radius: 0.6, height: 10 + level, life: 0.8 })
    for (let i = 0; i < 14; i++) {
      tmp.set(RAINBOW[i % RAINBOW.length])
      const ang = (i / 14) * Math.PI * 2
      fx.particle('glow', { x: from.x, y: from.y, z: from.z, vx: Math.cos(ang) * 4, vy: 3, vz: Math.sin(ang) * 4, color: tmp, size: 0.38, size1: 0, life: 0.9, sprite: SPR.gem, drag: 1.4, gravity: -3, spin: 3 })
    }
  }
  if (level >= 7) {
    fx.ring(ground, '#ffffff', { r0: 0.5, r1: 11, life: 0.7 })
    ui?.flash?.(a, 0.2, 0.3)
    director?.shake?.(0.2)
  }
  if (level >= 8) fx.confetti(from, 50, 8)
  if (bait?.guarantee) {
    // JACKPOT: gold coins, a tall golden beam, confetti and a text pop.
    fx.beam(at.set(ground.x, 0.05, ground.z), '#ffd23a', { radius: 1.6, height: 30, life: 1.4 })
    fx.confetti(from, 120, 11)
    fx.text?.('JACKPOT!', at.set(from.x, from.y + 1.2, from.z), '#ffd23a', { height: 1.3, life: 1.6, rise: 2 })
    for (let i = 0; i < 4; i++) setTimeout(() => fx.ring(ground, i % 2 ? '#ff4a4a' : '#ffd23a', { r0: 0.5, r1: 8 + i * 4, life: 0.8 }), i * 120)
    ui?.flash?.('#ffe680', 0.5, 0.45)
    director?.shake?.(0.5)
  }
}
