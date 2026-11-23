// Fishing rods and bobbers (the FOODS list in config is the rod list; the engine still calls
// them "foods"), built as voxel sculptures to match the blocky world: painted into a sparse
// voxel grid with a few shape brushes (ellipsoids, tapered cylinders, tori, capsules, boxes,
// free fills), then meshed into one geometry with only the exposed faces, per-vertex ambient
// occlusion, a little per-voxel colour jitter and baked face shading. Voxels painted with a
// leading '*' glow (the bloom pass picks them up). The same Vox + mesher also build the
// animals (game/baddieModel.js).
import { BufferGeometry, Color, Euler, Float32BufferAttribute, Group, Matrix4, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import { BAITS, FOOD_RARITIES, FOODS, ROD_TOPS } from '../config.js'
import { mulberry32 } from '../textures.js'

export const FOOD_BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]))
export const foodRarity = (id) => FOOD_RARITIES[FOOD_BY_ID[id]?.rarity ?? 0]
export const BAIT_DEF = Object.fromEntries(BAITS.map((b) => [b.id, b]))
export const baitRarity = (id) => FOOD_RARITIES[BAIT_DEF[id]?.rarity ?? 0]

const SIZE = 0.82 // m, the longest side of every food
const TAU = Math.PI * 2
const OFF = 64
const SPAN = 128
const KEY = (x, y, z) => ((x + OFF) * SPAN + (y + OFF)) * SPAN + (z + OFF)
const hash = (x, y, z) => {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
  return s - Math.floor(s)
}

// --- Colour helpers (hex strings in, hex strings out) ----------------------------------------
const rgbOf = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const hexOf = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
export function mix(a, b, t) {
  const A = rgbOf(a)
  const B = rgbOf(b)
  return hexOf(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t)
}
export const shade = (h, k) => {
  const [r, g, b] = rgbOf(h)
  return hexOf(r * k, g * k, b * k)
}

// --- The voxel grid --------------------------------------------------------------------------
// Brush colours: '#hex', '*#hex' (glow), '' (erase) or a function returning one of those
// (null / undefined = leave the voxel alone).
const m4 = new Matrix4()
const ev = new Euler()
const pv = new Vector3()
export class Vox {
  constructor(seed) {
    this.m = new Map()
    this.rand = mulberry32(seed)
  }
  put(x, y, z, c) {
    if (c == null) return
    x = Math.round(x)
    y = Math.round(y)
    z = Math.round(z)
    if (c === '') this.m.delete(KEY(x, y, z))
    else this.m.set(KEY(x, y, z), c)
  }
  has(x, y, z) {
    return this.m.has(KEY(x, y, z))
  }
  get(x, y, z) {
    return this.m.get(KEY(x, y, z))
  }
  // Generic fill over a box of integer coords: fn(x, y, z) -> colour | null.
  fill(x0, x1, y0, y1, z0, z1, fn) {
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++)
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
        for (let z = Math.floor(z0); z <= Math.ceil(z1); z++) this.put(x, y, z, fn(x, y, z))
  }
  // Ellipsoid; col(x, y, z, a, b, c) gets the normalised offsets (-1..1). rot = [rx, ry, rz].
  ell(cx, cy, cz, rx, ry, rz, col, rot = null, bump = 0) {
    let inv = null
    if (rot) {
      ev.set(rot[0], rot[1], rot[2])
      inv = m4.makeRotationFromEuler(ev).clone().invert()
    }
    const R = Math.max(rx, ry, rz) + 1
    this.fill(cx - R, cx + R, cy - R, cy + R, cz - R, cz + R, (x, y, z) => {
      pv.set(x - cx, y - cy, z - cz)
      if (inv) pv.applyMatrix4(inv)
      const a = pv.x / rx
      const b = pv.y / ry
      const c = pv.z / rz
      const d = a * a + b * b + c * c
      if (d > 1 - (bump ? hash(x, y, z) * bump : 0)) return null
      return typeof col === 'function' ? col(x, y, z, a, b, c) : col
    })
  }
  ball(cx, cy, cz, r, col, bump = 0) {
    this.ell(cx, cy, cz, r, r, r, col, null, bump)
  }
  // Tapered cylinder along an axis from a0 to a1 (integer range), radius r0 -> r1.
  // (p, q) is the centre in the other two axes (x/y/z order without the axis).
  // col(x, y, z, t (0..1 along), ang, rr (0..1 out)).
  cyl(axis, p, q, a0, a1, r0, r1, col) {
    const R = Math.max(r0, r1) + 1
    for (let a = a0; a <= a1; a++) {
      const t = a1 === a0 ? 0 : (a - a0) / (a1 - a0)
      const r = r0 + (r1 - r0) * t
      for (let i = Math.floor(p - R); i <= Math.ceil(p + R); i++)
        for (let j = Math.floor(q - R); j <= Math.ceil(q + R); j++) {
          const di = i - p
          const dj = j - q
          const rr = Math.hypot(di, dj)
          if (rr > r) continue
          const [x, y, z] = axis === 'x' ? [a, i, j] : axis === 'y' ? [i, a, j] : [i, j, a]
          // Angle around the axis, measured so 'y' cylinders get the usual atan2(z, x).
          const ang = Math.atan2(dj, di)
          this.put(x, y, z, typeof col === 'function' ? col(x, y, z, t, ang, rr / Math.max(0.001, r)) : col)
        }
    }
  }
  // Torus around an axis (ring radius R, tube radius r). col(x, y, z, ang, tubeAng, up).
  tor(axis, cx, cy, cz, R, r, col) {
    const E = R + r + 1
    this.fill(cx - E, cx + E, cy - E, cy + E, cz - E, cz + E, (x, y, z) => {
      const dx = x - cx
      const dy = y - cy
      const dz = z - cz
      const [a, p, q] = axis === 'x' ? [dx, dy, dz] : axis === 'y' ? [dy, dx, dz] : [dz, dx, dy]
      const ring = Math.hypot(p, q) - R
      if (ring * ring + a * a > r * r) return null
      return typeof col === 'function' ? col(x, y, z, Math.atan2(q, p), Math.atan2(a, ring), a / r) : col
    })
  }
  // Capsule from p0 to p1 with radius r (r1 at the end if given). col(x, y, z, t).
  line(x0, y0, z0, x1, y1, z1, r, col, r1 = r) {
    const dx = x1 - x0
    const dy = y1 - y0
    const dz = z1 - z0
    const L2 = dx * dx + dy * dy + dz * dz || 1
    const R = Math.max(r, r1) + 1
    this.fill(Math.min(x0, x1) - R, Math.max(x0, x1) + R, Math.min(y0, y1) - R, Math.max(y0, y1) + R, Math.min(z0, z1) - R, Math.max(z0, z1) + R, (x, y, z) => {
      const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy + (z - z0) * dz) / L2))
      const d = Math.hypot(x - (x0 + dx * t), y - (y0 + dy * t), z - (z0 + dz * t))
      if (d > r + (r1 - r) * t) return null
      return typeof col === 'function' ? col(x, y, z, t) : col
    })
  }
  box(x0, y0, z0, x1, y1, z1, col) {
    this.fill(x0, x1, y0, y1, z0, z1, (x, y, z) => (typeof col === 'function' ? col(x, y, z) : col))
  }
  each(fn) {
    for (const [k, c] of [...this.m]) {
      const z = (k % SPAN) - OFF
      const y = (Math.floor(k / SPAN) % SPAN) - OFF
      const x = Math.floor(k / (SPAN * SPAN)) - OFF
      fn(x, y, z, c)
    }
  }
  exposed(x, y, z) {
    return !this.has(x + 1, y, z) || !this.has(x - 1, y, z) || !this.has(x, y + 1, z) || !this.has(x, y - 1, z) || !this.has(x, y, z + 1) || !this.has(x, y, z - 1)
  }
  // Recolour existing voxels: fn(x, y, z, colour, exposed) -> new colour | null.
  paint(fn) {
    this.each((x, y, z, c) => {
      const n = fn(x, y, z, c, this.exposed(x, y, z))
      if (n != null) this.put(x, y, z, n)
    })
  }
  // A one-voxel skin around existing voxels where pred(x, y, z) holds (bands, wraps).
  skin(pred, col) {
    const add = []
    this.each((x, y, z) => {
      for (const [dx, dy, dz] of DIRS) {
        const nx = x + dx
        const ny = y + dy
        const nz = z + dz
        if (!this.has(nx, ny, nz) && pred(nx, ny, nz)) add.push([nx, ny, nz])
      }
    })
    for (const [x, y, z] of add) this.put(x, y, z, typeof col === 'function' ? col(x, y, z) : col)
  }
  // Sprinkle: recolour n random exposed voxels that pass pred.
  speckle(n, colors, pred = () => true) {
    const pool = []
    this.each((x, y, z, c) => {
      if (this.exposed(x, y, z) && pred(x, y, z, c)) pool.push([x, y, z])
    })
    for (let i = 0; i < n && pool.length; i++) {
      const [x, y, z] = pool.splice(Math.floor(this.rand() * pool.length), 1)[0]
      this.put(x, y, z, colors[i % colors.length])
    }
  }
}

// --- Mesher ----------------------------------------------------------------------------------
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
const FACE_SHADE = [0.9, 0.9, 1, 0.72, 0.96, 0.94]
const AO = [0.5, 0.68, 0.85, 1]
const linCache = new Map()
const tmpCol = new Color()
function lin(hex) {
  let v = linCache.get(hex)
  if (!v) {
    tmpCol.set(hex)
    v = [tmpCol.r, tmpCol.g, tmpCol.b]
    linCache.set(hex, v)
  }
  return v
}

export function meshVox(v) {
  const pos = []
  const nor = []
  const col = []
  const glw = []
  const idx = []
  const counts = new Map()
  const occ = (x, y, z) => (v.has(x, y, z) ? 1 : 0)
  v.each((x, y, z, c) => {
    const glow = c[0] === '*'
    const hex = glow ? c.slice(1) : c
    const rgb = lin(hex)
    const j = 0.94 + hash(x, y, z) * 0.12
    let faces = 0
    for (let d = 0; d < 6; d++) {
      const n = DIRS[d]
      if (v.has(x + n[0], y + n[1], z + n[2])) continue
      faces++
      const a = d >> 1
      const s = n[0] + n[1] + n[2]
      const u = (a + 1) % 3
      const w = (a + 2) % 3
      const q = [x, y, z]
      q[a] += s
      const b = pos.length / 3
      const aos = []
      const corners = s > 0 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 0], [0, 1], [1, 1], [1, 0]]
      for (const [cu, cw] of corners) {
        const s1p = q.slice()
        s1p[u] += cu ? 1 : -1
        const s2p = q.slice()
        s2p[w] += cw ? 1 : -1
        const cp = s1p.slice()
        cp[w] += cw ? 1 : -1
        const s1 = occ(...s1p)
        const s2 = occ(...s2p)
        const cc = occ(...cp)
        const ao = s1 && s2 ? 0 : 3 - (s1 + s2 + cc)
        const vp = [x - 0.5, y - 0.5, z - 0.5]
        vp[a] += s > 0 ? 1 : 0
        vp[u] += cu
        vp[w] += cw
        pos.push(vp[0], vp[1], vp[2])
        nor.push(n[0], n[1], n[2])
        const k = FACE_SHADE[d] * (glow ? 1 : AO[ao]) * j
        col.push(rgb[0] * k, rgb[1] * k, rgb[2] * k)
        glw.push(glow ? 1 : 0)
        aos.push(ao)
      }
      if (aos[0] + aos[2] < aos[1] + aos[3]) idx.push(b + 1, b + 2, b + 3, b + 1, b + 3, b)
      else idx.push(b, b + 1, b + 2, b, b + 2, b + 3)
    }
    if (faces) counts.set(hex, (counts.get(hex) ?? 0) + faces)
  })
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3))
  g.setAttribute('color', new Float32BufferAttribute(col, 3))
  g.setAttribute('glow', new Float32BufferAttribute(glw, 1))
  g.setIndex(idx)
  // Palette: the most visible colours first (crumbs, chunks, splats, trails).
  const palette = [...counts.entries()].sort((p, q) => q[1] - p[1]).slice(0, 5).map((e) => e[0])
  return { geo: g, palette }
}

// --- Materials -------------------------------------------------------------------------------
// Standard PBR with vertex colours; emissive = vertex colour x (rarity glow + glow voxels),
// so glowing voxels go HDR and bloom while the rest only lifts a touch.
const mats = new Map()
export function foodMaterial(finish, base) {
  // Metal has no environment to reflect in the open meadow, so it lights itself a bit.
  if (finish === 'metal') base = Math.max(base, 0.22)
  const key = `${finish}|${base}`
  if (mats.has(key)) return mats.get(key)
  const m = new MeshStandardMaterial({
    vertexColors: true,
    roughness: finish === 'gloss' ? 0.28 : finish === 'metal' ? 0.3 : 0.62,
    metalness: finish === 'metal' ? 0.55 : 0,
    emissive: '#ffffff',
  })
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float glow;\nvarying float vGlow;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance = vColor.rgb * (${base.toFixed(3)} + vGlow * 3.2);`)
  }
  m.customProgramCacheKey = () => `food-${key}`
  mats.set(key, m)
  return m
}

// --- The models ------------------------------------------------------------------------------
// Rods: one procedural voxel rod per tier, coloured from its FOODS entry (colors: [blank, grip,
// accent]). Built standing up (y = along the rod, handle at the bottom, reel under it at -z).
// The rarer the rod, the more it gets: metal wraps, a gem on the reel, glowing guides and tip,
// little wings by the grip, a spiral of glow up the blank.
export const ROD_LEN = 60 // voxels from the butt to the tip
export const ROD_GRIP = 7 // voxel y where the hand holds it
function buildRod(v, def) {
  const r = def.rarity
  const [blank, grip, accent] = def.colors ?? ['#c8874a', '#3a2a1e', '#e03a3a']
  const glow = r >= 6
  const g = (c) => (glow ? '*' + c : c)
  // Butt cap and grip (stripes of wrap).
  v.cyl('y', 0, 0, 0, 1, 1.9, 1.9, shade(grip, 0.7))
  v.cyl('y', 0, 0, 2, 12, 1.6, 1.4, (x, y) => (y % 3 === 0 ? shade(grip, 0.78) : grip))
  // Reel seat + reel (a fat disc under the rod with a crank knob).
  v.cyl('y', 0, 0, 13, 16, 1.3, 1.3, r >= 4 ? '#ffd23a' : '#9aa2ae')
  v.cyl('x', 14.5, -3.6, -1, 1, 2.8, 2.8, (x, y, z, t, ang, rr) => (rr > 0.75 ? shade(accent, 0.8) : rr < 0.3 ? '#e8ecf2' : accent))
  v.line(0, 14.5, -1.4, 0, 14.5, -2.2, 0.6, '#9aa2ae')
  v.line(2, 14.5, -3.6, 3, 13, -3.6, 0.5, '#9aa2ae')
  v.put(3, 12, -3.6, '#f4f4f4')
  if (r >= 4) v.put(-2, 14, -4, '*' + accent)
  // The blank, tapering to the tip, with wraps every few voxels.
  v.cyl('y', 0, 0, 17, ROD_LEN - 2, 1.25, 0.55, (x, y) => {
    if (r >= 2 && y % 9 === 0) return r >= 5 ? '#ffd23a' : shade(accent, 1.1)
    return blank
  })
  // Guides along the underside (-z), getting smaller toward the tip.
  for (const [y, s] of [[24, 1.2], [34, 1], [44, 0.8], [52, 0.6]]) {
    v.put(0, y, -2, g('#d8dde6'))
    if (s > 0.9) v.put(0, y, -3, g('#d8dde6'))
  }
  v.cyl('y', 0, 0, ROD_LEN - 1, ROD_LEN, 0.6, 0.6, g(accent))
  // Rare and up: a gem at the top of the grip; Legendary+: little wings; Cosmic+: a glow spiral.
  if (r >= 3) v.ball(0, 17, 1.8, 1.2, (r >= 5 ? '*' : '') + accent)
  if (r >= 4) {
    for (const s of [-1, 1]) v.ell(s * 3.4, 11, 0, 2.6, 1.2, 0.6, (x, y, z, a) => (Math.abs(a) > 0.6 ? '#ffffff' : shade(accent, 1.15)), [0, 0, s * 0.5])
  }
  if (r >= 7) {
    for (let i = 0; i < 26; i++) {
      const y = 18 + i * 1.5
      const a = i * 0.9
      v.put(Math.round(Math.cos(a) * 2), Math.round(y), Math.round(Math.sin(a) * 2), '*' + (i % 2 ? accent : '#ffffff'))
    }
  }
  if (ROD_TOPS[def.id]) buildTop(v, ROD_TOPS[def.id], def)
  return { finish: r >= 4 ? 'metal' : r >= 2 ? 'gloss' : 'matte' }
}
// The bobber that flies on the line: a classic two-tone float in the rod's accent colour.
function buildBobber(v, def) {
  const r = def.rarity
  const accent = def.colors?.[2] ?? '#e8222c'
  const glow = r >= 6
  v.ball(0, 0, 0, 5.2, (x, y) => (y > 0 ? (glow && y > 3 ? '*' + accent : accent) : y === 0 ? '#2a2a2a' : '#ffffff'))
  v.cyl('y', 0, 0, 5, 10, 1, 0.8, glow ? '*' + accent : accent)
  v.cyl('y', 0, 0, -8, -5, 0.6, 0.6, '#ffffff')
  if (r >= 4) v.tor('y', 0, 0, 0, 5.8, 0.8, '*#ffd23a')
  return { finish: 'gloss' }
}

// --- Rod head pieces ---------------------------------------------------------------------------
// ROD_TOPS (config): a piece on the tip of the rod. Built above the blank (y > ROD_LEN).
function buildTop(v, kind, def) {
  const [, , accent] = def.colors ?? ['#fff', '#fff', '#ffd23a']
  const gold = '#ffd23a'
  const r = def.rarity
  const gl = (c) => (r >= 5 ? '*' + c : c)
  const y0 = ROD_LEN
  if (kind === 'trident') {
    v.cyl('y', 0, 0, y0 - 2, y0 + 5, 0.7, 0.7, gold)
    v.line(-4, y0 + 4, 0, 4, y0 + 4, 0, 0.6, gold)
    for (const dx of [-4, 0, 4]) {
      v.line(dx, y0 + 4, 0, dx, y0 + (dx === 0 ? 13 : 11), 0, 0.55, gl(dx === 0 ? accent : gold), 0.3)
    }
    for (const dx of [-4, 4]) v.put(dx + Math.sign(dx), y0 + 9, 0, gl(accent))
  } else if (kind === 'bolt') {
    const pts = [[0, 0], [2, 3], [-1, 4], [2, 8], [-2, 9], [1, 13]]
    for (let i = 0; i < pts.length - 1; i++) v.line(pts[i][0], y0 + pts[i][1], 0, pts[i + 1][0], y0 + pts[i + 1][1], 0, 0.7, '*#ffe14a')
    v.ball(0, y0 + 13, 0, 1.2, '*#ffffff')
  } else if (kind === 'flame') {
    v.ell(0, y0 + 5, 0, 3, 5.5, 3, (x, y, z, a, b) => (b > 0.35 ? '*#ffd23a' : b > -0.2 ? '*#ff9a2a' : '*#ff4a1a'))
    v.ell(0, y0 + 3, 0, 1.6, 3, 1.6, '*#ffffff')
    for (const s of [-1, 1]) v.ell(s * 2.6, y0 + 2, 0, 1.2, 3, 1.2, '*#ff6a1a', [0, 0, s * 0.35])
  } else if (kind === 'crown') {
    v.tor('y', 0, y0 - 1, 0, 3, 0.9, gold)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      v.line(Math.cos(a) * 3, y0, Math.sin(a) * 3, Math.cos(a) * 3.4, y0 + 6 + (i % 2) * 2, Math.sin(a) * 3.4, 0.55, gold, 0.25)
      v.put(Math.cos(a) * 3.4, y0 + 8 + (i % 2) * 2, Math.sin(a) * 3.4, gl(accent))
    }
    v.ball(0, y0 + 1, 0, 1.4, gl(accent))
  } else if (kind === 'cube') {
    v.box(-3, y0 + 1, -3, 3, y0 + 7, 3, (x, y, z) => {
      const edge = [Math.abs(x) === 3, y === y0 + 1 || y === y0 + 7, Math.abs(z) === 3].filter(Boolean).length >= 2
      return edge ? '*' + accent : '#1a1020'
    })
    v.ball(0, y0 + 4, 0, 1.6, '*#ffffff')
  } else if (kind === 'eye') {
    v.ball(0, y0 + 4, 0, 4, (x, y, z, a, b, c) => (c > 0.55 ? (Math.hypot(a, b) < 0.28 ? '#0a0014' : Math.hypot(a, b) < 0.55 ? '*' + accent : '#ffffff') : '#e8e4f4'))
    v.tor('z', 0, y0 + 4, -1, 4.3, 0.7, '#3a1a6a')
  } else if (kind === 'star') {
    for (const [dx, dy] of [[0, 6], [0, -6], [6, 0], [-6, 0]]) v.line(0, y0 + 6, 0, dx * 0.9, y0 + 6 + dy * 0.9, 0, 0.9, '*' + accent, 0.2)
    v.ball(0, y0 + 6, 0, 2, '*#ffffff')
  } else if (kind === 'wing') {
    for (const s of [-1, 1]) {
      v.ell(s * 4, y0 + 1, 0, 4.2, 1.4, 0.7, (x, y, z, a) => (Math.abs(a) > 0.55 ? '#ffffff' : '#ffeebb'), [0, 0, s * 0.5])
      v.ell(s * 4.6, y0 + 4, 0, 3.4, 1.1, 0.6, '#ffffff', [0, 0, s * 0.8])
    }
    v.ball(0, y0 + 1, 0, 1.4, '*#fff0b0')
  } else if (kind === 'halo') {
    v.tor('y', 0, y0 + 4, 0, 3.6, 0.8, '*#fff0b0')
    v.ball(0, y0, 0, 1.3, '*#ffffff')
  } else if (kind === 'fin') {
    v.ell(1.5, y0 - 3, 0, 1, 6, 3.2, (x, y, z, a, b) => (b > 0.2 ? shade(accent, 1.2) : accent), [0, 0, -0.35])
  }
}

// --- Baits ---------------------------------------------------------------------------------------
// One voxel sculpture per BAITS entry (def.kind): worms and bugs for the cheap packs, lures with
// a head piece (def.top) for the rare ones, the rainbow arc and the Jackpot cube with its red 7.
function buildBait(v, def) {
  const [a, b, c] = def.colors
  const gl = def.glow ? (col) => '*' + col : (col) => col
  const k = def.kind
  if (k === 'worm') {
    for (let i = 0; i <= 15; i++) {
      const t = i / 15
      const x = -10 + t * 20
      const y = Math.sin(t * Math.PI * 2.4) * 3.2
      v.ball(x, y, 0, 2.1 - Math.abs(t - 0.5) * 0.5, i % 2 ? gl(a) : gl(b))
    }
    v.ball(10.4, Math.sin(Math.PI * 2.4) * 3.2, 0, 2.2, gl(c))
    v.put(11.5, Math.sin(Math.PI * 2.4) * 3.2 + 1, 1.8, '#101010')
  } else if (k === 'minnow') {
    v.ell(0, 0, 0, 9, 3.4, 2.6, (x, y, z, aa, bb) => (bb < -0.2 ? c : bb > 0.35 ? b : a))
    v.ell(-10, 0, 0, 3, 2.8, 0.7, (x, y, z, aa) => (aa < -0.3 ? shade(b, 0.8) : b), [0, 0, 0.2])
    v.ell(-1, 3.4, 0, 2.2, 1.6, 0.6, shade(b, 0.9))
    v.ell(0, -3, 1.6, 1.8, 1, 0.6, shade(a, 1.1), [0, 0, -0.4])
    for (const s of [-1, 1]) {
      v.put(6, 1, s * 2.7, '#ffffff')
      v.put(6, 1, s * 3.1, '#101010')
    }
  } else if (k === 'grub') {
    for (let i = 0; i <= 9; i++) {
      const ang = -0.6 + i * 0.5
      const x = Math.cos(ang) * 7
      const y = Math.sin(ang) * 7 - 2
      v.ball(x, y, 0, 3 - i * 0.12, i % 2 ? a : shade(a, 0.88))
    }
    v.ball(Math.cos(-0.9) * 7, Math.sin(-0.9) * 7 - 2, 0, 2.6, b)
    v.put(Math.cos(-1) * 7, Math.sin(-1) * 7 - 1, 2.6, '#101010')
  } else if (k === 'cricket') {
    v.ell(0, 0, 0, 6.5, 3, 2.8, a)
    v.ell(-1, 2.2, 0, 4.5, 1.6, 2.2, shade(a, 0.8))
    v.ball(7, 1.5, 0, 2.8, shade(a, 1.15))
    for (const s of [-1, 1]) {
      v.put(8.5, 2.5, s * 2.6, '#ffffff')
      v.line(8, 3, s * 1, 14, 7, s * 4, 0.35, b)
      v.line(0, -2, s * 2.4, -3, -6, s * 4, 0.5, a)
      v.line(-3, -6, s * 4, -9, -2, s * 5, 0.5, a)
      v.line(3, -2, s * 2.4, 5, -6, s * 3, 0.45, a)
    }
    v.ell(-4, 3, 0, 5, 0.7, 2.6, shade(c, 0.9), [0, 0, 0.12])
  } else if (k === 'shrimp') {
    for (let i = 0; i <= 8; i++) {
      const ang = -0.2 + i * 0.42
      v.ball(Math.cos(ang) * 6, Math.sin(ang) * 6 - 1, 0, 2.6 - i * 0.15, i % 2 ? a : b)
    }
    v.ell(-6, -4, 0, 2.6, 0.8, 2.6, c, [0, 0, 0.8])
    v.ball(6.3, 3, 0, 2.2, a)
    v.line(8, 4, 1, 14, 9, 3, 0.3, c)
    v.line(8, 4, -1, 14, 9, -3, 0.3, c)
    for (const s of [-1, 1]) v.put(7.5, 4.4, s * 2, '#101010')
  } else if (k === 'firefly') {
    v.ell(0, 0, 0, 5, 2.6, 2.2, a)
    v.ball(6, 0.6, 0, 2.2, shade(a, 1.2))
    v.ball(-6.5, -0.4, 0, 3.2, '*' + b)
    v.ball(-6.5, -0.4, 0, 1.6, '*' + c)
    for (const s of [-1, 1]) {
      v.ell(-1, 3.2, s * 3.8, 5, 0.7, 2.6, '#cfe4ee', [s * 0.5, 0, 0])
      v.line(7, 2, s * 0.8, 11, 6, s * 1.6, 0.3, '#2a2a2a')
    }
  } else if (k === 'crystal') {
    const spikes = [[0, 0, 10, 1.7], [-4, 0, 7, 1.3], [4, 1, 7.5, 1.4], [0, -3, 6, 1.1], [1, 3, 6.5, 1.1]]
    for (const [x, z, h, rr] of spikes) {
      v.cyl('y', x, z, 0, h, rr, 0.2, (xx, yy) => (yy > h * 0.6 ? '*' + c : yy > h * 0.3 ? '*' + a : '*' + b))
    }
    v.ell(0, 0, 0, 5, 1.4, 4.2, shade(b, 0.7))
  } else if (k === 'lure') {
    v.ell(0, 0, 0, 10, 4.3, 3.6, (x, y, z, aa, bb) => {
      if (bb < -0.35) return c
      if (Math.abs(((aa + 1) * 5) % 2.6) < 0.5) return gl(b)
      return gl(a)
    })
    v.ell(-11, 0, 0, 3.4, 3.6, 0.8, (x, y, z, aa) => (aa < -0.2 ? gl(shade(a, 0.85)) : gl(b)), [0, 0, 0.15])
    v.ell(-1, 4.2, 0, 3, 1.8, 0.7, gl(b))
    for (const s of [-1, 1]) {
      v.ball(6, 1.2, s * 3.1, 1.5, '#ffffff')
      v.put(6.5, 1.2, s * 4.4, '#101010')
      v.ell(1, -2.5, s * 2.4, 2.4, 0.8, 1.2, gl(b), [0, 0, -0.5])
    }
    v.tor('z', 11.5, 0.5, 0, 1.5, 0.45, '#cfd6e2')
    for (const [x, y] of [[1, -4], [-8, -2]]) {
      v.line(x, y, 0, x, y - 4, 0, 0.4, '#aeb6c4')
      for (const s of [-1, 1]) v.line(x, y - 4, 0, x + s * 2.6, y - 6, 0, 0.35, '#aeb6c4')
    }
    if (def.top) buildLureTop(v, def.top, c, b)
  } else if (k === 'rainbow') {
    const bands = ['#ff3a3a', '#ff9a2a', '#ffe14a', '#5ae84a', '#3fa6ff', '#5a4aff', '#b04aff']
    v.fill(-13, 13, -1, 13, -1, 1, (x, y) => {
      const d = Math.hypot(x, y)
      if (d < 6 || d >= 13 || y < -0.5) return null
      return '*' + bands[Math.min(6, Math.floor(((d - 6) / 7) * 7))]
    })
    for (const s of [-1, 1]) {
      v.ball(s * 9.5, 0.5, 0, 3, '#ffffff', 0.25)
      v.ball(s * 11.5, 1.5, 0.5, 2.4, '#e8f0ff', 0.25)
      v.ball(s * 7.5, 1, 0.6, 2, '#ffffff', 0.25)
    }
    v.ball(0, 6, 0, 2, '*#ffffff')
  } else if (k === 'jackpot') {
    v.box(-6, -6, -6, 6, 6, 6, (x, y, z) => {
      const edge = [Math.abs(x) === 6, Math.abs(y) === 6, Math.abs(z) === 6].filter(Boolean).length >= 2
      return edge ? shade(a, 0.62) : (x + y + z) % 2 ? a : shade(a, 1.06)
    })
    v.box(-5, -5, 7, 5, 5, 7, (x, y) => (Math.abs(x) === 5 || Math.abs(y) === 5 ? shade(a, 0.8) : '#fff3c0'))
    // the red 7 on the front face
    const red = '*' + b
    v.box(-3, 2, 8, 3, 3, 8, red)
    for (let i = 0; i <= 7; i++) {
      const x = 3 - Math.round(i * 0.62)
      v.box(x - 1, 2 - i, 8, x, 2 - i, 8, red)
    }
    v.box(-5, -5, 8, 5, -5, 8, shade(a, 0.7))
    v.cyl('y', 0, 0, 7, 9, 3.2, 3.2, '#c8ccd6')
    v.tor('z', 0, 11, 0, 2.4, 0.6, '#aeb6c4')
    for (const [x, y, z] of [[-6, 6, 6], [6, -6, 6], [6, 6, -6]]) v.ball(x, y, z, 1.2, '*' + c)
  }
  return { finish: k === 'jackpot' || k === 'lure' || k === 'crystal' ? 'metal' : 'gloss' }
}
function buildLureTop(v, top, c, b) {
  const y0 = 5
  if (top === 'bolt') {
    const pts = [[-2, 0], [1, 3], [-1, 4], [2, 8]]
    for (let i = 0; i < pts.length - 1; i++) v.line(pts[i][0], y0 + pts[i][1], 0, pts[i + 1][0], y0 + pts[i + 1][1], 0, 0.7, '*#ffe14a')
  } else if (top === 'flame') {
    v.ell(0, y0 + 3, 0, 2.6, 4, 2.2, (x, y, z, aa, bb) => (bb > 0.3 ? '*#ffd23a' : bb > -0.3 ? '*#ff9a2a' : '*#ff4a1a'))
  } else if (top === 'star') {
    for (const [dx, dy] of [[0, 5], [5, 0], [-5, 0]]) v.line(0, y0 + 4, 0, dx, y0 + 4 + dy * 0.8, 0, 0.8, '*' + b, 0.2)
    v.ball(0, y0 + 4, 0, 1.6, '*#ffffff')
  } else if (top === 'halo') {
    v.tor('y', 0, y0 + 4, 0, 3.4, 0.7, '*#fff0b0')
  } else if (top === 'eye') {
    v.ball(0, y0 + 3, 0, 3, (x, y, z, aa, bb, cc) => (cc > 0.5 ? (Math.hypot(aa, bb) < 0.4 ? '#0a0014' : '*' + c) : '#2a2a3a'))
  }
}

// --- Build + cache -----------------------------------------------------------------------------
const cache = new Map()
// kind: 'rod' (raw, standing up, 1 unit = 1 voxel) | 'bob' (bobber).
function raw(id, kind) {
  const key = `${kind}|${id}`
  if (cache.has(key)) return cache.get(key)
  const def = FOOD_BY_ID[id] ?? FOODS[1]
  const v = new Vox(id.length * 131 + id.charCodeAt(0) * 7 + (kind === 'bob' ? 5 : 0))
  const opts = (kind === 'rod' ? buildRod(v, def) : buildBobber(v, def)) ?? {}
  const { geo, palette } = meshVox(v)
  const r = foodRarity(id)
  const out = { geo, palette, mat: foodMaterial(opts.finish ?? 'gloss', r.emissive ?? 0) }
  cache.set(key, out)
  return out
}
// A copy normalised to `size` on its longest side, posed by rot and centred.
const posed = new Map()
function normalised(id, kind, size, rot) {
  const key = `${kind}|${id}|${size}`
  if (posed.has(key)) return posed.get(key)
  const geo = raw(id, kind).geo.clone()
  geo.applyMatrix4(m4.makeRotationFromEuler(ev.set(rot[0], rot[1], rot[2])))
  geo.computeBoundingBox()
  const bb = geo.boundingBox
  const s = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z)
  geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2)
  geo.scale(size / s, size / s, size / s)
  geo.computeBoundingSphere()
  posed.set(key, geo)
  return geo
}

// Main colours of a rod's bobber + rod (most visible first): trails, splashes, sparkles.
export const foodColors = (id) => {
  const def = FOOD_BY_ID[id]
  return def?.colors ? [def.colors[2], '#ffffff', def.colors[0], def.colors[1]] : raw(id, 'rod').palette
}

// The rod as a display piece (shop cards, stall racks, portraits): diagonal, 0.82 m long.
export function foodMesh(id) {
  const mesh = new Mesh(normalised(id, 'rod', SIZE, [0.25, 0.6, -0.78]), raw(id, 'rod').mat)
  mesh.castShadow = true
  const g = new Group()
  g.add(mesh)
  return g
}

// The rod at full size for the hand: `len` metres, origin at the grip, the rod along +Y.
// userData.tip = the tip's local position (where the line starts).
const handGeos = new Map()
export function rodMesh(id, len = 2.6) {
  const key = `${id}|${len}`
  if (!handGeos.has(key)) {
    const geo = raw(id, 'rod').geo.clone()
    const k = len / ROD_LEN
    geo.translate(0, -ROD_GRIP, 0)
    geo.scale(k, k, k)
    geo.computeBoundingSphere()
    handGeos.set(key, geo)
  }
  const mesh = new Mesh(handGeos.get(key), raw(id, 'rod').mat)
  mesh.castShadow = true
  const g = new Group()
  g.add(mesh)
  g.userData.tip = new Vector3(0, (ROD_LEN - ROD_GRIP) * (len / ROD_LEN), 0)
  return g
}

// The bobber (what flies down the river and floats), `size` metres across.
export function bobberMesh(id, size = 0.42) {
  const mesh = new Mesh(normalised(id, 'bob', size, [0, 0, 0]), raw(id, 'bob').mat)
  mesh.castShadow = true
  const g = new Group()
  g.add(mesh)
  return g
}

// --- Baits (BAITS in config) ---------------------------------------------------------------------
function rawBait(id) {
  const key = `bait|${id}`
  if (cache.has(key)) return cache.get(key)
  const def = BAIT_DEF[id] ?? BAITS[0]
  const v = new Vox(id.length * 197 + id.charCodeAt(0) * 11)
  const opts = buildBait(v, def) ?? {}
  const { geo, palette } = meshVox(v)
  const out = { geo, palette, mat: foodMaterial(opts.finish ?? 'gloss', baitRarity(id).emissive ?? 0) }
  cache.set(key, out)
  return out
}
const BAIT_POSE = { lure: [0.2, 0.55, -0.05], jackpot: [0.2, 0.42, 0.02], rainbow: [0.05, 0.35, 0], crystal: [0.15, 0.5, 0] }
// A bait as a display piece (shop cards, portraits, the stall shelf), `size` metres on its longest side.
export function baitMesh(id, size = SIZE) {
  const def = BAIT_DEF[id] ?? BAITS[0]
  const key = `bait|${id}|${size}`
  if (!posed.has(key)) {
    const geo = rawBait(id).geo.clone()
    geo.applyMatrix4(m4.makeRotationFromEuler(ev.set(...(BAIT_POSE[def.kind] ?? [0.3, 0.5, 0]))))
    geo.computeBoundingBox()
    const bb = geo.boundingBox
    const sz = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z)
    geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2)
    geo.scale(size / sz, size / sz, size / sz)
    geo.computeBoundingSphere()
    posed.set(key, geo)
  }
  const mesh = new Mesh(posed.get(key), rawBait(id).mat)
  mesh.castShadow = true
  const g = new Group()
  g.add(mesh)
  return g
}
// Palette of a bait for splashes and sparkles.
export const baitColors = (id) => [...(BAIT_DEF[id]?.colors ?? ['#ffffff']), '#ffffff']
