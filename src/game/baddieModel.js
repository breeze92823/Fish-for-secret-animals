// The animals you fish up: blocky voxel critters built with the same Vox painter + mesher as the
// rods (game/foods.js), so they match the brick world. Each look (config.js AREAS / SEASONS:
// k body plan, c / c2 / c3 colours, x extras) picks one of the KINDS below: a builder paints its
// parts (body, head, front limbs, back limbs, tail, optional wings) into separate voxel grids
// around their pivots, so the parts can move: waddles, flaps, tail wags, head nods, hops,
// swimming wiggles. Extras add crowns, halos, horns, angel wings, spots, stripes, spikes, tusks,
// whiskers, a straw hat, a metal sheen or glowing accents.
// The engine still calls an animal a "baddie" (class Baddie, BY_ID, state.js): the owner sets
// a mode (idle / walk / dance / cheer / eat / fly / swim / float) or an appeal move (wave, kiss,
// heart, twirl, pose, shy, curtsy) and reads one-frame cues with takeCue() for hearts, sparkles
// and sounds.
import { AdditiveBlending, Color, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, RingGeometry, Sprite } from 'three'
import { BADDIES, RARITIES, SEASON_GIRLS, SIZES, VARIANTS } from '../config.js'
import { label } from '../propkit.js'
import { meshVox, shade, Vox } from './foods.js'
import { fmt } from './format.js'

export const BY_ID = Object.fromEntries([...BADDIES, ...SEASON_GIRLS].map((b) => [b.id, b]))

const EYE = '#16161e'
const GLINT = '#ffffff'

// Recolour the outermost voxels along an axis into an eye (2 wide x 3 tall, a white glint at
// the top). dir: 'x' (side eyes, sx = -1 / +1) or 'z' (front eyes).
function eye(v, x, y, z, dir, s = 1, size = 1) {
  const w = size > 1 ? 2 : 1 // extra columns
  const h = size > 1 ? 3 : 2 // rows
  for (let dy = 0; dy < h; dy++)
    for (let dw = 0; dw <= w; dw++) {
      const col = dy === h - 1 && dw === 0 ? GLINT : EYE
      if (dir === 'x') {
        for (let k = 14; k >= -2; k--) {
          const xx = x + s * k
          if (v.has(xx, y + dy, z + dw)) {
            v.put(xx, y + dy, z + dw, col)
            break
          }
        }
      } else {
        for (let k = 14; k >= -2; k--) {
          const zz = z + k
          if (v.has(x + dw * s, y + dy, zz)) {
            v.put(x + dw * s, y + dy, zz, col)
            break
          }
        }
      }
    }
}
const eyes = (v, x, y, z, size = 1) => {
  eye(v, -x, y, z, 'x', -1, size)
  eye(v, x, y, z, 'x', 1, size)
}
const frontEyes = (v, x, y, z, size = 1) => {
  eye(v, -x, y, z, 'z', -1, size)
  eye(v, x, y, z, 'z', 1, size)
}

// --- Body plans --------------------------------------------------------------------------------
// Each builder gets P(name, [px, py, pz]) -> a Vox whose coordinates are WORLD voxel coords (the
// pivot is subtracted when meshed), L = the look. Front = +z, up = +y. It returns anchors for the
// extras: top (crown / halo spot, on the head), front (horn root, on the head), back (angel
// wings root, on the body) and swim = true for animals that hover in the air and wiggle.
const KINDS = {
  duck(P, L) {
    const B = P('body', [0, 6, 0])
    B.ell(0, 6, 0, 5, 4.5, 6.5, (x, y, z, a, b, c) => (c > 0.55 && b > -0.2 ? shade(L.main, 1.08) : b < -0.6 ? shade(L.main, 0.85) : L.main))
    B.ell(0, 9, 4.2, 3, 1.2, 2, '#f4f4ee') // white collar
    const H = P('head', [0, 10, 3])
    H.ell(0, 14, 4, 3.6, 4, 3.6, L.second)
    H.box(-2, 12, 7, 2, 13, 10, L.accent) // beak
    H.box(-1.5, 11, 7, 1.5, 11, 9, shade(L.accent, 0.82))
    eyes(H, 3, 14, 4, 1)
    for (const s of [-1, 1]) {
      const W = P(s < 0 ? 'fl' : 'fr', [s * 4.5, 8, 1])
      W.ell(s * 5, 6.5, -1, 1.3, 3, 4.6, (x, y, z, a, b, c) => (c < -0.5 ? shade(L.main, 0.7) : shade(L.main, 0.88)))
      const F = P(s < 0 ? 'bl' : 'br', [s * 2, 2.5, 0])
      F.line(s * 2, 2.5, 0, s * 2, 0.5, 0.5, 0.6, '#ff8a1a')
      F.box(s * 2 - 1, 0, 0, s * 2 + 1, 0, 3, '#ff8a1a')
    }
    const T = P('tail', [0, 7, -6])
    T.ell(0, 8, -7.5, 2.2, 1.4, 2, shade(L.main, 0.6), [0.5, 0, 0])
    return { top: [0, 18, 4], front: [0, 16, 7], back: [0, 10, -1] }
  },
  frog(P, L) {
    const B = P('body', [0, 4, 0])
    B.ell(0, 4, 0, 5, 3.6, 5, (x, y, z, a, b, c) => (c > 0.5 && b < 0.2 ? L.second : L.main))
    const H = P('head', [0, 5, 2])
    H.ell(0, 6.5, 3.5, 5.2, 2.8, 4, (x, y, z, a, b) => (b < -0.5 ? L.second : L.main))
    for (const s of [-1, 1]) H.ball(s * 3, 9, 3.5, 2, L.main)
    H.box(-3, 5, 7, 3, 5, 7, shade(L.accent, 0.8)) // smile
    frontEyes(H, 3, 8.5, 4, 1)
    for (const s of [-1, 1]) {
      const F = P(s < 0 ? 'fl' : 'fr', [s * 3, 3, 3])
      F.line(s * 3, 3, 3, s * 4, 0.5, 4.5, 0.8, L.main)
      F.box(s * 4 - 1, 0, 4, s * 4 + 1, 0, 6, L.accent)
      const K = P(s < 0 ? 'bl' : 'br', [s * 4, 3, -2])
      K.ell(s * 5, 2.2, -1, 1.7, 2.2, 3.4, L.main)
      K.box(s * 5 - 1, 0, 1, s * 5 + 1, 0, 4, L.accent)
    }
    return { top: [0, 11, 3], front: [0, 9, 6], back: [0, 7, -1] }
  },
  fish(P, L) {
    const round = L.extras.has('round')
    const [rx, ry, rz] = round ? [5, 5, 6] : [3, 4.5, 7]
    const B = P('body', [0, 0, 0])
    B.ell(0, 0, -1, rx, ry, rz, (x, y, z, a, b) => (b < -0.35 ? L.second : L.main))
    B.ell(0, ry, -2, 0.6, 2.2, 3.2, L.accent) // dorsal fin
    const H = P('head', [0, 0, 4])
    H.ell(0, 0, 3, rx - 0.3, ry - 0.6, 3.4, (x, y, z, a, b) => (b < -0.35 ? L.second : L.main))
    H.box(-1, -1, 6 + (round ? 0 : 0), 1, -1, 7, shade(L.accent, 0.75))
    eyes(H, rx - 1, 1, 3, 1)
    for (const s of [-1, 1]) {
      const F = P(s < 0 ? 'fl' : 'fr', [s * rx, -1, 1])
      F.ell(s * (rx + 1), -1.5, -0.5, 0.6, 1.4, 2.6, L.accent)
    }
    const T = P('tail', [0, 0, -1 - rz])
    T.ell(0, 0, -rz - 3.2, 0.7, 4, 2.6, L.accent)
    T.ell(0, 0, -rz - 1.2, 1.2, 1.6, 1.6, L.main)
    return { top: [0, ry + 2.5, 3], front: [0, 1, 6.5], back: [0, ry, -2], swim: true }
  },
  turtle(P, L) {
    const B = P('body', [0, 3, 0])
    B.ell(0, 3.5, 0, 6, 3.6, 7, (x, y, z) => ((Math.abs(x) + Math.abs(z)) % 5 === 0 || (Math.abs(x - z) % 6 === 0 && y > 4) ? shade(L.main, 0.72) : L.main))
    B.box(-5, 1, -5, 5, 1.5, 5, L.accent)
    const H = P('head', [0, 3, 6.5])
    H.ell(0, 4, 8.5, 2.3, 2.1, 2.6, L.second)
    eyes(H, 2, 4, 8.5, 1)
    for (const s of [-1, 1]) {
      const F = P(s < 0 ? 'fl' : 'fr', [s * 5, 2, 4])
      F.ell(s * 6.5, 1.2, 4.5, 2.2, 1, 1.6, L.second)
      const K = P(s < 0 ? 'bl' : 'br', [s * 4.5, 2, -4])
      K.ell(s * 5.5, 1.2, -5, 1.8, 1, 1.5, L.second)
    }
    const T = P('tail', [0, 2, -7])
    T.line(0, 2, -7, 0, 1.5, -9, 0.7, L.second)
    return { top: [0, 7.5, 0], front: [0, 5.5, 10.5], back: [0, 7, -1] }
  },
  crab(P, L) {
    const B = P('body', [0, 4, 0])
    B.ell(0, 4, 0, 6, 2.8, 4.5, (x, y, z, a, b) => (b < -0.4 ? L.second : L.main))
    const H = P('head', [0, 6, 2])
    for (const s of [-1, 1]) {
      H.line(s * 1.5, 6, 2, s * 1.8, 9, 2.5, 0.5, L.main)
      H.ball(s * 1.8, 10, 2.5, 1.2, EYE)
      H.put(s * 1.8, 11, 3, GLINT)
    }
    H.box(-1, 4, 4, 1, 4, 4, shade(L.accent, 0.7))
    for (const s of [-1, 1]) {
      const F = P(s < 0 ? 'fl' : 'fr', [s * 5, 4, 3])
      F.line(s * 5, 4, 3, s * 7, 4.5, 6, 0.8, L.main)
      F.ell(s * 7.5, 5, 8, 2.2, 1.9, 2.6, (x, y, z, a, b, c) => (c > 0.4 && Math.abs(b) < 0.25 ? '' : L.accent))
      const K = P(s < 0 ? 'bl' : 'br', [s * 5, 3, -1])
      for (const dz of [-3, -1, 1]) K.line(s * 5, 3, dz, s * 8.5, 0.3, dz - 0.5, 0.5, shade(L.main, 0.85))
    }
    return { top: [0, 12, 2], front: [0, 7, 4], back: [0, 6.5, -1] }
  },
  penguin(P, L) {
    const B = P('body', [0, 6, 0])
    B.ell(0, 7, 0, 4.6, 7, 4, (x, y, z, a, b, c) => (c > 0.35 && b < 0.75 ? L.second : L.main))
    const H = P('head', [0, 12.5, 0])
    H.ell(0, 15, 0.3, 3.8, 3.4, 3.5, (x, y, z, a, b, c) => (c > 0.55 && b < 0.2 ? L.second : L.main))
    H.box(-1, 14, 3, 1, 15, 5, L.accent)
    frontEyes(H, 2, 15, 2, 1)
    for (const s of [-1, 1]) {
      const W = P(s < 0 ? 'fl' : 'fr', [s * 4.2, 10, 0])
      W.ell(s * 4.8, 7, 0, 0.9, 4.2, 2.2, L.main)
      const F = P(s < 0 ? 'bl' : 'br', [s * 1.8, 1, 1])
      F.box(s * 1.8 - 1, 0, 0, s * 1.8 + 1, 0, 3, L.accent)
    }
    return { top: [0, 18.5, 0.3], front: [0, 16, 3.5], back: [0, 10, -3] }
  },
  seal(P, L) {
    const B = P('body', [0, 4, 0])
    B.ell(0, 4, -1, 4.5, 4, 8, (x, y, z, a, b) => (b < -0.35 ? L.second : L.main), [-0.25, 0, 0])
    const H = P('head', [0, 7, 5])
    H.ell(0, 9, 6.5, 3.6, 3.4, 3.5, L.main)
    H.ell(0, 8, 9.2, 2.2, 1.6, 1.4, L.second)
    H.box(0, 9, 10, 0, 9, 10, EYE)
    eyes(H, 2, 9.5, 7, 1)
    if (L.extras.has('tusks')) for (const s of [-1, 1]) H.line(s * 1, 7, 9.5, s * 1.2, 3.5, 9.8, 0.5, '#fff8e8')
    for (const s of [-1, 1]) {
      const F = P(s < 0 ? 'fl' : 'fr', [s * 4, 2, 3])
      F.ell(s * 5.5, 1, 4, 2.6, 0.8, 1.6, shade(L.main, 0.85))
    }
    const T = P('tail', [0, 2, -8])
    T.ell(0, 1, -10, 3.6, 0.8, 2, shade(L.main, 0.85))
    return { top: [0, 12.5, 6.5], front: [0, 10, 10], back: [0, 7, -1] }
  },
  otter(P, L) {
    const B = P('body', [0, 6, 0])
    B.ell(0, 6, 0, 4, 6, 3.8, (x, y, z, a, b, c) => (c > 0.4 && b > -0.5 && b < 0.7 ? L.second : L.main))
    const H = P('head', [0, 11.5, 0.5])
    H.ell(0, 14, 0.8, 3.6, 3.1, 3.2, L.main)
    H.ell(0, 13, 3.5, 2, 1.4, 1.2, L.second)
    H.box(0, 14, 4.5, 0, 14, 4.5, L.accent)
    for (const s of [-1, 1]) H.ball(s * 3, 16.5, 0, 0.9, shade(L.main, 0.8))
    frontEyes(H, 2, 14.5, 2, 1)
    for (const s of [-1, 1]) {
      const F = P(s < 0 ? 'fl' : 'fr', [s * 3.4, 8.5, 1.5])
      F.line(s * 3.4, 8.5, 1.5, s * 2, 5.5, 4, 1.1, shade(L.main, 0.85))
      const K = P(s < 0 ? 'bl' : 'br', [s * 2.2, 2, 0])
      K.ell(s * 2.4, 1.2, 0.5, 1.4, 1.6, 2, shade(L.main, 0.85))
    }
    const T = P('tail', [0, 2.5, -3])
    T.ell(0, 1.5, -7, 1.6, 1, 4.6, shade(L.main, 0.75))
    if (L.extras.has('straw')) {
      H.cyl('y', 0, 0.8, 17, 17, 5, 5, '#f2d27a')
      H.cyl('y', 0, 0.8, 18, 19, 2.6, 2.4, '#f2d27a')
      H.cyl('y', 0, 0.8, 18, 18, 2.7, 2.7, '#e83a3a')
    }
    return { top: [0, 17.5, 0.8], front: [0, 15, 3.5], back: [0, 9, -3] }
  },
  octopus(P, L) {
    const B = P('body', [0, 4, 0])
    B.ell(0, 9, -0.5, 5, 6, 5, L.main)
    B.ell(0, 4.5, 0, 4.4, 1.8, 4.4, shade(L.main, 0.9))
    frontEyes(B, 2, 8, 3, 2)
    B.box(-1, 5, 4, 1, 5, 4, shade(L.main, 0.6))
    for (const s of [-1, 1]) {
      const T = P(s < 0 ? 'fl' : 'fr', [s * 2, 3.5, 0])
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI + (s < 0 ? Math.PI / 2 : -Math.PI / 2) + 0.4
        const cx = Math.sin(a) * 6.5
        const cz = Math.cos(a) * 6.5
        T.line(Math.sin(a) * 2.5, 3.5, Math.cos(a) * 2.5, cx, 0.8, cz, 1.3, (x, y, z, t) => (t > 0.5 ? L.second : L.main), 0.7)
        T.line(cx, 0.8, cz, cx * 1.25, 1.8, cz * 1.25, 0.7, L.second)
      }
    }
    return { top: [0, 15.5, -0.5], front: [0, 13, 3], back: [0, 10, -4] }
  },
  jelly(P, L) {
    const B = P('body', [0, 9, 0])
    B.ell(0, 10, 0, 5.5, 4.5, 5.5, (x, y, z, a, b) => (y < 9 ? '' : b > 0.6 ? shade(L.main, 1.1) : L.main))
    B.ell(0, 9, 0, 5.8, 0.6, 5.8, L.second)
    frontEyes(B, 2, 10, 3, 1)
    const T = P('tail', [0, 8, 0])
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      const x0 = Math.sin(a) * 3.4
      const z0 = Math.cos(a) * 3.4
      T.line(x0, 8, z0, x0 * 1.1, 4, z0 * 1.1, 0.6, L.accent)
      T.line(x0 * 1.1, 4, z0 * 1.1, x0 * 0.8, 1, z0 * 0.8, 0.5, (L.glow ? '*' : '') + L.accent)
    }
    return { top: [0, 15, 0], front: [0, 12, 5], back: [0, 11, -5], swim: true }
  },
  shark(P, L) {
    const B = P('body', [0, 0, 0])
    B.ell(0, 0, -1, 3.6, 3.6, 8.5, (x, y, z, a, b) => (b < -0.3 ? L.second : L.main))
    B.line(0, 3, 0, 0, 8, -2.5, 1.6, L.main, 0.4)
    const H = P('head', [0, 0, 5])
    H.ell(0, 0, 6.5, 3.2, 3, 4, (x, y, z, a, b) => (b < -0.3 ? L.second : L.main))
    for (let x = -2; x <= 2; x++) H.put(x, -1, 9, x % 2 ? '#ffffff' : '#d8dde6')
    eyes(H, 2.5, 1, 7, 1)
    for (const s of [-1, 1]) {
      const F = P(s < 0 ? 'fl' : 'fr', [s * 3, -1, 2])
      F.line(s * 3, -1, 2, s * 7, -3.5, -1, 1.1, L.main, 0.4)
    }
    const T = P('tail', [0, 0, -9])
    T.line(0, 0, -9, 0, 5, -13, 1.2, L.main, 0.5)
    T.line(0, 0, -9, 0, -3.5, -12, 1, L.main, 0.5)
    return { top: [0, 4, 6], front: [0, 1, 10], back: [0, 3.5, -2], swim: true }
  },
  dolphin(P, L) {
    const B = P('body', [0, 0, 0])
    B.ell(0, 0, -1, 3.5, 3.6, 8, (x, y, z, a, b) => (b < -0.35 ? L.second : L.main))
    B.line(0, 3, 0, 0, 6.5, -2.5, 1.4, L.main, 0.4)
    const H = P('head', [0, 0, 5])
    H.ell(0, 0.5, 6.5, 3, 3, 3.5, (x, y, z, a, b) => (b < -0.35 ? L.second : L.main))
    H.ell(0, -0.5, 10, 1.3, 1, 2, L.second)
    eyes(H, 2.4, 1, 7.5, 1)
    for (const s of [-1, 1]) {
      const F = P(s < 0 ? 'fl' : 'fr', [s * 3, -1.5, 2])
      F.line(s * 3, -1.5, 2, s * 6, -3.5, 0, 1, L.main, 0.4)
    }
    const T = P('tail', [0, 0, -8.5])
    T.ell(0, 0, -11, 4, 0.8, 1.8, L.main)
    return { top: [0, 4.5, 6], front: [0, 1.5, 11], back: [0, 3.5, -2], swim: true }
  },
  whale(P, L) {
    const B = P('body', [0, 0, 0])
    B.ell(0, 0, -1, 6, 5, 10, (x, y, z, a, b) => (b < -0.45 ? (y % 2 === 0 ? shade(L.second, 0.9) : L.second) : L.main))
    const H = P('head', [0, 0, 6])
    H.ell(0, 0.3, 8, 5.6, 4.6, 4, (x, y, z, a, b) => (b < -0.45 ? L.second : L.main))
    eyes(H, 5, 0, 8, 1)
    H.box(-3, -1, 11, 3, -1, 11, shade(L.main, 0.6))
    for (const s of [-1, 1]) {
      const F = P(s < 0 ? 'fl' : 'fr', [s * 5.5, -2, 3])
      F.ell(s * 8, -3, 2, 3, 0.8, 1.6, L.main, [0, 0, s * -0.4])
    }
    const T = P('tail', [0, 0, -10])
    T.line(0, 0, -10, 0, 1, -14, 1.6, L.main)
    T.ell(0, 1.5, -15.5, 6, 0.8, 2.2, L.main)
    return { top: [0, 5.5, 6], front: [0, 1, 11.5], back: [0, 5, -1], swim: true }
  },
  axolotl(P, L) {
    const B = P('body', [0, 3, 0])
    B.ell(0, 3, -1, 3.6, 2.8, 6, (x, y, z, a, b) => (b < -0.4 ? L.second : L.main))
    const H = P('head', [0, 4, 4.5])
    H.ell(0, 4.5, 6.5, 4.2, 3, 3, L.main)
    H.box(-2, 3, 9, 2, 3, 9, shade(L.main, 0.6))
    frontEyes(H, 2.5, 5, 7, 1)
    for (const s of [-1, 1])
      for (let i = 0; i < 3; i++) {
        H.line(s * 4, 4 + i * 1.4, 5.5, s * 6.5, 5 + i * 2.2, 4.5 - i * 0.6, 0.6, (L.glow ? '*' : '') + L.accent)
        H.put(s * 7, 5 + i * 2.2, 4, (L.glow ? '*' : '') + shade(L.accent, 1.1))
      }
    for (const s of [-1, 1]) {
      const F = P(s < 0 ? 'fl' : 'fr', [s * 3, 2, 2.5])
      F.line(s * 3, 2, 2.5, s * 5, 0, 3.5, 0.7, L.main)
      const K = P(s < 0 ? 'bl' : 'br', [s * 3, 2, -4])
      K.line(s * 3, 2, -4, s * 5, 0, -4.5, 0.7, L.main)
    }
    const T = P('tail', [0, 3, -6.5])
    T.ell(0, 3, -10, 0.8, 2.4, 4, (x, y, z, a, b) => (Math.abs(b) > 0.6 ? L.second : L.main))
    return { top: [0, 8, 6.5], front: [0, 6, 9], back: [0, 6, -1] }
  },
  swan(P, L) {
    const B = P('body', [0, 6, 0])
    B.ell(0, 6, -0.5, 4.6, 4, 6.5, L.main)
    const H = P('head', [0, 8, 4])
    H.line(0, 8, 4, 0, 14, 4.5, 1.4, L.main)
    H.line(0, 14, 4.5, 0, 16, 3.5, 1.3, L.main)
    H.ell(0, 17, 4.5, 1.9, 1.9, 2.4, L.main)
    H.line(0, 17, 6.5, 0, 16, 8.5, 0.9, L.accent)
    H.put(0, 17, 6.5, EYE)
    eyes(H, 1, 17, 4.5, 1)
    for (const s of [-1, 1]) {
      const W = P(s < 0 ? 'fl' : 'fr', [s * 4, 8, 1])
      W.ell(s * 4.6, 8, -1.5, 1.2, 3, 5.2, (x, y, z, a, b, c) => (c < -0.6 ? shade(L.second, 0.92) : L.second), [0.25, 0, 0])
      const F = P(s < 0 ? 'bl' : 'br', [s * 2, 2.5, 0])
      F.line(s * 2, 2.5, 0, s * 2, 0.5, 0.5, 0.6, '#3a3a3a')
      F.box(s * 2 - 1, 0, 0, s * 2 + 1, 0, 2.5, '#3a3a3a')
    }
    const T = P('tail', [0, 7, -6.5])
    T.ell(0, 8, -8, 2.2, 1.2, 1.8, L.main, [0.6, 0, 0])
    return { top: [0, 19.5, 4.5], front: [0, 18, 6], back: [0, 9.5, -1] }
  },
  croc(P, L) {
    const B = P('body', [0, 3, 0])
    B.ell(0, 3, -1.5, 4.5, 2.6, 8.5, (x, y, z, a, b) => (b < -0.4 ? L.second : b > 0.7 && z % 2 === 0 ? shade(L.main, 0.75) : L.main))
    const H = P('head', [0, 3, 6.5])
    H.ell(0, 3, 10, 3, 1.7, 6, L.main)
    for (const s of [-1, 1]) H.ball(s * 2, 5, 7.5, 1.3, L.main)
    eyes(H, 2.5, 4.5, 7, 1)
    for (let z = 9; z <= 14; z += 2) for (const s of [-1, 1]) H.put(s * 2, 2, z, '#ffffff')
    for (const s of [-1, 1]) {
      const F = P(s < 0 ? 'fl' : 'fr', [s * 4, 2, 4])
      F.line(s * 4, 2, 4, s * 6, 0, 5, 1, L.main)
      const K = P(s < 0 ? 'bl' : 'br', [s * 4, 2, -5])
      K.line(s * 4, 2, -5, s * 6, 0, -6, 1, L.main)
    }
    const T = P('tail', [0, 3, -10])
    T.line(0, 3, -10, 0, 2, -19, 2.2, (x, y, z, t) => (y >= 4 && z % 2 === 0 ? shade(L.main, 0.75) : L.main), 0.6)
    return { top: [0, 6.5, 8], front: [0, 5, 15], back: [0, 5.5, -1] }
  },
  seahorse(P, L) {
    const B = P('body', [0, 7, 0])
    B.ell(0, 8, 0, 3.2, 5, 3.4, (x, y, z, a, b, c) => (c > 0.55 ? L.second : y % 2 === 0 ? shade(L.main, 0.88) : L.main), [0.25, 0, 0])
    B.ell(0, 8.5, -3.4, 0.7, 2.6, 1.6, L.accent)
    const H = P('head', [0, 12, 1])
    H.ell(0, 14, 1.5, 2.6, 2.6, 2.8, L.main)
    H.line(0, 13.5, 3.5, 0, 12.5, 7.5, 1, L.main)
    H.put(0, 12, 8, shade(L.main, 0.6))
    for (let i = 0; i < 3; i++) H.put(0, 17 + i, 1 - i, L.accent)
    eyes(H, 2, 14, 2, 1)
    const T = P('tail', [0, 4, -0.5])
    for (let i = 0; i < 13; i++) {
      const ang = i * 0.55
      const R = 2.6 * (1 - i / 16)
      T.ball(0, 1.8 + R * Math.cos(ang), -0.8 - R * Math.sin(ang), 1.5 * (1 - i / 18), i % 2 ? shade(L.main, 0.9) : L.main)
    }
    return { top: [0, 18, 1.5], front: [0, 13, 7], back: [0, 10, -3], swim: true }
  },
}

// --- Extras --------------------------------------------------------------------------------
function extras(P, L, A, parts) {
  const X = L.extras
  const H = parts.head ?? parts.body
  const [tx, ty, tz] = A.top
  if (X.has('crown')) {
    H.cyl('y', tx, tz, ty, ty + 1, 2.4, 2.4, '#ffd23a')
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      H.put(Math.round(tx + Math.sin(a) * 2), ty + 2, Math.round(tz + Math.cos(a) * 2), '#ffd23a')
    }
    H.put(tx, ty + 1, tz + 2, '*#ff3a5a')
  }
  if (X.has('straw') && !parts.head) H.cyl('y', tx, tz, ty, ty, 4, 4, '#f2d27a')
  if (X.has('halo')) H.tor('y', tx, ty + 3, tz, 3, 0.55, '*#fff2a0')
  if (X.has('horn')) {
    const [fx, fy, fz] = A.front
    H.line(fx, fy, fz, fx, fy + 4, fz + 5, 0.9, (x, y, z, t) => (Math.round(t * 8) % 2 ? '#fff6e0' : (L.glow ? '*' : '') + L.accent), 0.3)
  }
  if (X.has('whiskers')) {
    const [fx, fy, fz] = A.front
    for (const s of [-1, 1]) H.line(fx + s, fy - 1, fz, fx + s * 4, fy - 2, fz + 1, 0.4, shade(L.main, 0.6))
  }
  const B = parts.body
  if (X.has('spots')) B.speckle(26, [L.second, shade(L.second, 0.9)], (x, y) => y > 1)
  if (X.has('stripes')) B.paint((x, y, z, c, out) => (out && ((z + 40) % 4 === 0) ? L.second : null))
  if (X.has('spikes')) {
    const [bx, by, bz] = A.back
    for (let i = -2; i <= 2; i++) B.line(bx, by, bz + i * 2.2, bx, by + 2.4, bz + i * 2.2 - 0.6, 0.6, L.glow ? '*' + L.accent : shade(L.second, 0.95), 0.2)
  }
  if (X.has('wings')) {
    const [bx, by, bz] = A.back
    for (const s of [-1, 1]) {
      const W = P(s < 0 ? 'wl' : 'wr', [bx + s * 1.5, by, bz])
      W.ell(bx + s * 5.5, by + 3, bz - 1.5, 4.4, 2.2, 0.8, (x, y, z, a, b) => (a * s > 0.6 ? '#ffffff' : b > 0.3 ? '#ffffff' : (L.glow ? '*' : '') + '#f4f8ff'), [0, 0, s * 0.35])
    }
  }
  // Glow: accent voxels shine (bloom); a few sparkle specks.
  if (L.glow) {
    for (const v of Object.values(parts)) v.paint((x, y, z, c) => (c === L.accent ? '*' + c : null))
    B.speckle(6, ['*#ffffff'])
  }
}

// --- Build + cache ---------------------------------------------------------------------------------
const TARGET = 1.75 // m: the longest side of a normal-size animal
const built = new Map()
function build(def) {
  if (built.has(def.id)) return built.get(def.id)
  const L = def.look
  const kind = KINDS[L.kind] ? L.kind : 'duck'
  const parts = {}
  const pivots = {}
  let seed = 1
  for (let i = 0; i < def.id.length; i++) seed = (seed * 31 + def.id.charCodeAt(i)) >>> 0
  const P = (name, pivot) => {
    if (!parts[name]) {
      parts[name] = new Vox(seed + name.length)
      pivots[name] = pivot
    }
    return parts[name]
  }
  const A = KINDS[kind](P, L)
  extras(P, L, A, parts)
  // Mesh every part, find the union bounds (voxel units) to stand it on the ground.
  const out = {}
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (const [name, v] of Object.entries(parts)) {
    if (!v.m.size) continue
    const { geo, palette } = meshVox(v)
    geo.computeBoundingBox()
    const bb = geo.boundingBox
    minX = Math.min(minX, bb.min.x)
    minY = Math.min(minY, bb.min.y)
    minZ = Math.min(minZ, bb.min.z)
    maxX = Math.max(maxX, bb.max.x)
    maxY = Math.max(maxY, bb.max.y)
    maxZ = Math.max(maxZ, bb.max.z)
    const [px, py, pz] = pivots[name]
    geo.translate(-px, -py, -pz)
    geo.computeBoundingSphere()
    out[name] = { geo, pivot: pivots[name], palette }
  }
  // Size by height, but long animals (crocs, whales, sharks) count most of their length too.
  const longest = Math.max(maxY - minY, (maxX - minX) * 0.75, (maxZ - minZ) * 0.75)
  const res = {
    parts: out,
    fit: TARGET / longest, // m per voxel
    lift: -minY, // voxels to stand it on y = 0
    centreZ: (minZ + maxZ) / 2,
    heightVox: maxY - minY,
    lenVox: Math.max(maxZ - minZ, maxX - minX),
    swim: !!A.swim,
    palette: out.body?.palette ?? [L.main],
  }
  built.set(def.id, res)
  return res
}

// Main colours of an animal (particles, splashes).
export const animalColors = (id) => {
  const d = BY_ID[id]
  return d ? [d.look.main, d.look.second, d.look.accent] : ['#ffffff']
}

// --- Materials -----------------------------------------------------------------------------------
// Vertex colours + a `glow` attribute (from the mesher): glow voxels go HDR and bloom.
// Each part is its own voxel grid and they overlap at rest, so where two parts have a surface
// voxel in the same cell their faces are exactly coplanar in different colours and z-fight.
// A part's layer (LAYER) sets a polygon offset so the higher one wins those ties: the head (its
// eyes) over the wings over the front limbs over the back limbs and tail over the body. The
// offsets are a few depth units, far too small to show anything that is really behind.
const LAYER = { body: 0, bl: 1, br: 1, tail: 1, fl: 2, fr: 2, wl: 3, wr: 3, head: 4 }
const mats = new Map()
function animalMat(variant, shiny, layer = 0) {
  const key = `${variant}|${shiny}|${layer}`
  if (mats.has(key)) return mats.get(key)
  const V = variant ? VARIANTS[variant] : null
  const m = new MeshStandardMaterial({
    vertexColors: true,
    color: V ? V.color : '#ffffff',
    roughness: V || shiny ? 0.3 : 0.62,
    metalness: V ? (variant === 1 ? 0.55 : 0.25) : shiny ? 0.45 : 0,
    emissive: '#ffffff',
    polygonOffset: layer > 0,
    polygonOffsetFactor: layer > 0 ? -1 : 0,
    polygonOffsetUnits: -layer,
  })
  const base = V ? 0.16 : shiny ? 0.12 : 0
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float glow;\nvarying float vGlow;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance = vColor.rgb * diffuse * (${base.toFixed(3)} + vGlow * 3.0);`)
  }
  m.customProgramCacheKey = () => `animal-${variant}|${shiny}` // the layers share one program
  mats.set(key, m)
  return m
}

const auraGeo = new RingGeometry(0.7, 1.15, 40)
auraGeo.rotateX(-Math.PI / 2)
const raysGeo = new RingGeometry(1.15, 1.6, 12, 1, 0, Math.PI * 2)
raysGeo.rotateX(-Math.PI / 2)
const auraMats = new Map()
function auraMat(rarity) {
  if (!auraMats.has(rarity)) auraMats.set(rarity, new MeshBasicMaterial({ color: RARITIES[rarity].glow, transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }))
  return auraMats.get(rarity)
}
const variantRings = new Map()
function variantRingMat(v) {
  if (!variantRings.has(v)) variantRings.set(v, new MeshBasicMaterial({ color: VARIANTS[v].glow, transparent: true, opacity: 0.65, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }))
  return variantRings.get(v)
}
// The rainbow variant's colour cycles (one shared material, stepped at most 30 times a second).
let rainbowFrame = -1
const rainbowColor = new Color()
const RAINBOW = VARIANTS.findIndex((x) => x.rainbow)
function tickRainbow(t) {
  const f = Math.floor(t * 30)
  if (f === rainbowFrame) return
  rainbowFrame = f
  rainbowColor.setHSL((t * 0.25) % 1, 0.85, 0.72)
  for (const shiny of [false, true])
    for (let layer = 0; layer <= 4; layer++) {
      const m = mats.get(`${RAINBOW}|${shiny}|${layer}`)
      if (m) m.color.copy(rainbowColor)
    }
  variantRings.get(RAINBOW)?.color.copy(rainbowColor)
}

const labelCache = new Map()
function labelFor(def, size, v = 0, income = null) {
  const key = `${def.id}|${size}|${v}|${income ?? ''}`
  if (!labelCache.has(key)) labelCache.set(key, makeLabel(def, size, v, income))
  const base = labelCache.get(key)
  const s = new Sprite(base.material)
  s.userData.base = base
  s.scale.copy(base.scale)
  return s
}
function makeLabel(def, size, v = 0, income = null) {
  const sz = SIZES[size]
  const lines = []
  const colors = []
  const top = [VARIANTS[v]?.name, sz.name].filter(Boolean).join(' ')
  if (top) {
    lines.push(top)
    colors.push(VARIANTS[v]?.name ? VARIANTS[v].color : '#ffffff')
  }
  lines.push(def.name)
  colors.push(RARITIES[def.rarity].color)
  lines.push(`$${fmt(income ?? def.income * sz.mult * (VARIANTS[v]?.mult ?? 1))}/s`)
  colors.push('#7dff4a')
  return label(lines.join('\n'), 0.42 * lines.length, { colors, outline: '#10131f', outlineWidth: 16, font: '700 80px Fredoka, "Arial Black", sans-serif' })
}

// Appeal moves and how long each runs (s). Same names as ever (pens.js plays their sounds).
export const APPEAL = { wave: 1.8, kiss: 1.7, heart: 2.2, twirl: 1.2, pose: 2.0, shy: 2.4, curtsy: 1.6 }

let uid = 0
const HOVER = 0.55 // m a swimmer floats above the ground on land
export class Baddie {
  // variant: VARIANTS index; income: the $/s printed on the label (defaults to the def's figure).
  constructor(id, size = 0, { showLabel = true, variant = 0, income = null } = {}) {
    this.uid = ++uid
    this.def = BY_ID[id]
    this.size = size
    this.variant = variant | 0
    this.group = new Group()
    this.body = new Group() // scaled by the size step; bob / hop / spin live here
    this.group.add(this.body)
    const B = build(this.def)
    this.built = B
    this.swimmer = B.swim
    const shiny = this.def.look.extras.has('shiny')
    // root: voxel space (scaled to metres), lifted to stand on y = 0, centred front-to-back.
    this.root = new Group()
    this.root.scale.setScalar(B.fit)
    this.root.position.set(0, B.lift * B.fit, -B.centreZ * B.fit)
    this.body.add(this.root)
    const mk = (name) => {
      const p = B.parts[name]
      const g = new Group()
      if (!p) return g
      g.position.set(p.pivot[0], p.pivot[1], p.pivot[2])
      const m = new Mesh(p.geo, animalMat(this.variant, shiny, LAYER[name] ?? 0))
      m.castShadow = true
      m.receiveShadow = true
      g.add(m)
      this.root.add(g)
      return g
    }
    this.torso = mk('body')
    this.head = B.parts.head ? mk('head') : this.torso
    this.fl = mk('fl')
    this.fr = mk('fr')
    this.bl = mk('bl')
    this.br = mk('br')
    this.tail = mk('tail')
    this.wl = mk('wl')
    this.wr = mk('wr')
    this.hasWings = !!B.parts.wl
    const sc = SIZES[size].scale
    this.body.scale.setScalar(sc)
    if (this.def.rarity >= 3 || this.def.look.glow) {
      this.aura = new Mesh(auraGeo, auraMat(this.def.rarity))
      this.aura.position.y = 0.06
      this.aura.scale.setScalar(sc * 0.85)
      this.group.add(this.aura)
      if (this.def.rarity >= 6 || this.def.look.glow) {
        this.rays = new Mesh(raysGeo, auraMat(this.def.rarity))
        this.rays.position.y = 0.05
        this.rays.scale.setScalar(sc * 0.85)
        this.group.add(this.rays)
      }
    }
    if (this.variant && VARIANTS[this.variant]) {
      this.vring = new Mesh(auraGeo, variantRingMat(this.variant))
      this.vring.position.y = 0.08
      this.vring.scale.setScalar(sc * 1.05)
      this.group.add(this.vring)
    }
    if (showLabel) {
      this.label = labelFor(this.def, size, this.variant, income)
      this.label.position.y = this.height + 0.6
      this.label.renderOrder = 5
      this.group.add(this.label)
    }
    // Animation state (owners set these).
    this.speed = 0 // m/s it is moving now (drives the walk cycle)
    this.mode = 'idle' // idle | walk | dance | cheer | eat | feed | fly | swim | float | an APPEAL move
    this.phase = Math.random() * 10
    this.t = Math.random() * 10
    this.jumpT = 0
    this.actT = 0
    this.cue = null
    this.spin = 0
    this.chomp = 0
    this.ground = true // false: no swimmer hover (in the water, carried)
  }

  get height() {
    const B = this.built
    return (B.heightVox * B.fit + (this.swimmer && this.ground ? HOVER : 0)) * SIZES[this.size].scale
  }

  // Its biggest extent (m): height or length, whichever is more (cameras frame by this).
  get span() {
    const B = this.built
    return Math.max(B.heightVox, B.lenVox) * B.fit * SIZES[this.size].scale
  }

  hop() {
    this.jumpT = 0.0001
  }
  appeal(move) {
    this.mode = move
    this.actT = 0
    this.cued = 0
    this.spin = 0
  }
  busy() {
    return APPEAL[this.mode] != null && this.actT < APPEAL[this.mode]
  }
  takeCue() {
    const c = this.cue
    this.cue = null
    return c
  }
  setMood() {}

  update(dt) {
    this.t += dt
    const t = this.t
    if (this.variant) {
      tickRainbow(performance.now() / 1000)
      if (this.vring) this.vring.rotation.y += dt * 0.8
    }
    const k = Math.min(1, dt * 12)
    const lerp = (o, key, v) => (o[key] += (v - o[key]) * k)
    let legL = 0
    let legR = 0
    let flap = 0 // front limbs / wings out (rad)
    let flapAlt = 0
    let bob = 0
    let roll = 0
    let pitch = 0
    let headNod = 0
    let headYaw = 0
    let headTilt = 0
    let tailYaw = Math.sin(t * 2.4) * 0.25
    let wing = 0.15 + Math.sin(t * 2.2) * 0.1
    const m = this.mode
    const a = this.actT
    if (APPEAL[m] != null) this.actT += dt
    const cueOnce = (at, name) => {
      if (a >= at && (this.cued ?? 0) < at + 0.0001) {
        this.cued = at + 0.0002
        this.cue = name
      }
    }
    const sw = this.swimmer
    if (m === 'walk' || this.speed > 0.3) {
      this.phase += dt * (3 + this.speed * 1.6)
      const s = Math.sin(this.phase)
      if (sw) {
        tailYaw = s * 0.6
        roll = s * 0.08
        bob = Math.sin(this.phase * 0.5) * 0.06
        flap = 0.3 + s * 0.25
      } else {
        legL = s * 0.7
        legR = -s * 0.7
        roll = s * 0.12 // waddle
        bob = Math.abs(Math.cos(this.phase)) * 0.06
        flap = 0.1 + Math.abs(s) * 0.15
        tailYaw = s * 0.4
      }
    } else if (m === 'dance') {
      const s = Math.sin(t * 6)
      roll = s * 0.18
      bob = Math.abs(s) * 0.12
      flap = 0.5 + s * 0.4
      flapAlt = -s * 0.4
      headTilt = s * 0.25
      tailYaw = s * 0.7
      wing = 0.5 + s * 0.4
    } else if (m === 'cheer') {
      const s = Math.sin(t * 14)
      flap = 0.9 + s * 0.5
      bob = Math.abs(Math.sin(t * 7)) * 0.14
      headNod = -0.2
      tailYaw = s * 0.6
      wing = 0.6 + s * 0.5
    } else if (m === 'eat' || m === 'feed') {
      const c = m === 'feed' ? this.chomp : Math.max(0, Math.sin(t * 12))
      headNod = 0.15 + c * 0.35
      pitch = 0.08
      tailYaw = Math.sin(t * 8) * 0.4
    } else if (m === 'fly') {
      flap = 0.6 + Math.sin(t * 18) * 0.6
      legL = legR = 0.5
      tailYaw = Math.sin(t * 9) * 0.5
      wing = 0.3 + Math.sin(t * 18) * 0.7
    } else if (m === 'swim') {
      // In the water: a fast tail and fins, the body snaking a little.
      const s = Math.sin(t * 10)
      tailYaw = s * 0.7
      flap = 0.4 + s * 0.3
      roll = s * 0.05
      legL = s * 0.6
      legR = -s * 0.6
    } else if (m === 'float') {
      // Bobbing on the surface: slow rock, paddling feet.
      const s = Math.sin(t * 2.6)
      roll = s * 0.06
      pitch = Math.sin(t * 1.9) * 0.05
      legL = Math.sin(t * 7) * 0.5
      legR = -legL
      flap = 0.15
      headYaw = Math.sin(t * 0.9) * 0.25
    } else if (m === 'wave') {
      flap = 1.1 + Math.sin(a * 12) * 0.5
      headTilt = 0.2
      bob = Math.abs(Math.sin(a * 6)) * 0.04
      wing = 0.8 + Math.sin(a * 12) * 0.4
      cueOnce(0.2, 'wave')
    } else if (m === 'kiss') {
      const send = a > 0.75
      headNod = send ? -0.25 : 0.2
      pitch = send ? -0.1 : 0.08
      headTilt = 0.18
      cueOnce(0.78, 'kiss')
    } else if (m === 'heart') {
      flap = 1.2
      roll = Math.sin(a * 4) * 0.12
      headTilt = Math.sin(a * 4) * 0.2
      bob = Math.abs(Math.sin(a * 4)) * 0.08
      cueOnce(0.35, 'heart')
      cueOnce(1.3, 'heart')
    } else if (m === 'twirl') {
      const k2 = Math.min(1, a / 0.9)
      this.spin = k2 * k2 * (3 - 2 * k2) * Math.PI * 2
      bob = Math.sin(k2 * Math.PI) * 0.18
      flap = 0.8
      cueOnce(0.05, 'twirl')
    } else if (m === 'pose') {
      headTilt = -0.3
      roll = 0.12
      flapAlt = 0.9
      tailYaw = 0.5
      cueOnce(0.3, 'pose')
    } else if (m === 'shy') {
      roll = Math.sin(a * 3.2) * 0.1
      headNod = 0.3
      headYaw = -0.4
      tailYaw = Math.sin(a * 5) * 0.5
      cueOnce(0.6, 'shy')
    } else if (m === 'curtsy') {
      const d = Math.sin(Math.min(1, a / 1.2) * Math.PI)
      pitch = 0.3 * d
      headNod = 0.3 * d
      flap = 0.5 * d
      bob = -0.06 * d
      cueOnce(0.5, 'curtsy')
    } else {
      // Idle: breathing, a slow look round, a lazy tail.
      bob = Math.sin(t * 2.1) * 0.015
      headYaw = Math.sin(t * 0.7) * 0.3
      headTilt = Math.sin(t * 0.5) * 0.08
      if (sw) {
        tailYaw = Math.sin(t * 3) * 0.35
        roll = Math.sin(t * 1.3) * 0.05
        flap = 0.25 + Math.sin(t * 3) * 0.15
      }
    }
    // Limbs: legs swing about X, front limbs flap out about Z (mirrored), tail yaws.
    lerp(this.bl.rotation, 'x', legL)
    lerp(this.br.rotation, 'x', legR)
    lerp(this.fl.rotation, 'z', -(flap + flapAlt))
    lerp(this.fr.rotation, 'z', flap - flapAlt * 0)
    lerp(this.fl.rotation, 'x', -legR * 0.4)
    lerp(this.fr.rotation, 'x', -legL * 0.4)
    lerp(this.tail.rotation, 'y', tailYaw)
    if (this.head !== this.torso) {
      lerp(this.head.rotation, 'x', headNod)
      lerp(this.head.rotation, 'y', headYaw)
      lerp(this.head.rotation, 'z', headTilt)
    }
    lerp(this.root.rotation, 'z', roll)
    lerp(this.root.rotation, 'x', pitch)
    if (this.hasWings) {
      this.wl.rotation.z = wing
      this.wr.rotation.z = -wing
    }
    this.body.rotation.y = this.spin
    // Hop: up and down with a little squash.
    let jy = 0
    if (this.jumpT > 0) {
      this.jumpT += dt
      const jt = this.jumpT / 0.5
      if (jt >= 1) this.jumpT = 0
      else jy = Math.sin(jt * Math.PI) * 0.9
    }
    const hover = sw && this.ground ? HOVER + Math.sin(t * 2) * 0.08 : 0
    this.body.position.y = bob + jy + hover
    if (this.label) this.label.scale.copy(this.label.userData.base.scale) // the base repaints once the font loads
    if (this.aura) {
      this.aura.rotation.y += dt * 0.8
      this.aura.material.opacity = 0.35 + Math.sin(t * 3) * 0.15
    }
    if (this.rays) this.rays.rotation.y -= dt * 0.5
  }

  dispose() {
    this.group.removeFromParent()
  }
}

// A portrait-ready copy (no label, no aura) for UI snapshots.
export function portraitModel(id, size = 0, variant = 0) {
  const b = new Baddie(id, size, { showLabel: false, variant })
  if (b.aura) b.group.remove(b.aura)
  if (b.rays) b.group.remove(b.rays)
  if (b.vring) b.group.remove(b.vring)
  b.ground = false
  b.t = 0
  b.update(0.016)
  return b
}
