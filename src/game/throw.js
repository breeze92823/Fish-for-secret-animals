// The cast sequence (the engine still calls it "the throw"). Step onto the yellow band at the
// river mouth and the game takes over the camera for a short cinematic loop (THROW_MODE in config):
//   enter   - you glide to the casting spot, rod out, the camera swings in behind your shoulder
//   aim     - a power meter sweeps up and down; tap (click / Space / F / E / touch) to stop it
//   windup  - the grade pops (PERFECT! ... WEAK), the rod swings back over your shoulder
//   flight  - the rod whips forward, a FOV punch and the camera chases the bobber down the
//             river: line paying out, speed lines, wind, streaks; the LUCK counter climbs with
//             every metre and each area slams its name on screen; the last moments in slow-mo
//   impact  - hit-stop, a splash of white cubes, rings on the water, the bobber plunges and bobs
//   meet    - the bite: nibbles dip the bobber, then under the water the hook and bait hang in
//             the light and an animal of that area swims in and bites; back up top the bobber is
//             yanked under, the line snaps taut, and the animal bursts out of the water
//   reveal  - close-up on the water with a rotating sunburst; its name types out, then the card
//   catch   - hearts, a beam, it spins into the hotbar (or swims off if the hotbar is full)
//   return  - a wipe back to the aim shot (Auto) or back to your base
// Exit (or Esc / Q) leaves from the aim phase. Auto plays the loop by itself.
import { AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, CircleGeometry, Color, DoubleSide, DynamicDrawUsage, Group, InstancedMesh, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, PlaneGeometry, Sprite, SpriteMaterial, SRGBColorSpace, Vector3 } from 'three'
import { EVENTS, FOOD_RARITIES, HUB, RARITIES, SEASON, STREAK, THROW, THROW_MODE as TM, VARIANTS } from '../config.js'
import * as events from './events.js'
import { Baddie } from './baddieModel.js'
import { baitColors, baitMesh, bobberMesh, FOOD_BY_ID, foodColors as paletteOf, foodRarity, rodMesh } from './foods.js'
import { baitBlast, castBlast, emitTrail, trailColor } from '../fx/trails.js'
import { zoneAt } from './lane.js'
import * as state from './state.js'

const STREAKS = 56
const RAINBOW_C = ['#ff5ad8', '#ff8a3a', '#ffd23a', '#7dff4a', '#4ae8ff', '#5a8aff', '#c07dff']
const L = HUB.lane
const FY = L.floorY // the river banks sit this far below the hub
const WY = FY + L.water // the water surface
const BED = FY - L.depth // the river bed
const rnd = (a, b) => a + Math.random() * (b - a)
const smooth = (k) => k * k * (3 - 2 * k)
const easeOutBack = (k) => 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2)

// --- Small canvas textures ----------------------------------------------------------------
function canvasTex(size, draw) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d'), size)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}
// Sunburst behind the revealed baddie: soft alternating rays fading out from the centre.
const sunTex = () =>
  canvasTex(256, (x, s) => {
    const c = s / 2
    const rays = 18
    for (let i = 0; i < rays; i++) {
      const a0 = (i / rays) * Math.PI * 2
      const a1 = a0 + (Math.PI / rays) * 0.9
      const g = x.createRadialGradient(c, c, 0, c, c, c)
      g.addColorStop(0, 'rgba(255,255,255,0.9)')
      g.addColorStop(0.5, 'rgba(255,255,255,0.35)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      x.fillStyle = g
      x.beginPath()
      x.moveTo(c, c)
      x.arc(c, c, c, a0, a1)
      x.closePath()
      x.fill()
    }
    const core = x.createRadialGradient(c, c, 0, c, c, c * 0.45)
    core.addColorStop(0, 'rgba(255,255,255,1)')
    core.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = core
    x.fillRect(0, 0, s, s)
  })
// Foam decal on the water where the bobber lands: a lumpy blob with droplets around it.
const splatTex = () =>
  canvasTex(256, (x, s) => {
    const c = s / 2
    x.fillStyle = '#fff'
    x.beginPath()
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2
      const r = c * (0.42 + 0.12 * Math.sin(a * 5 + 1) + 0.06 * Math.sin(a * 11))
      x.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r)
    }
    x.fill()
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2
      const r = c * (0.62 + Math.random() * 0.3)
      x.beginPath()
      x.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 4 + Math.random() * 10, 0, Math.PI * 2)
      x.fill()
    }
  })

// Soft glow disc (the rarity aura around the held / flying food).
const glowTex = () =>
  canvasTex(128, (x, s) => {
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = g
    x.fillRect(0, 0, s, s)
  })
// Ribbon cross-section: bright core, soft edges (u across the strip).
const ribbonTex = () =>
  canvasTex(64, (x, s) => {
    const g = x.createLinearGradient(0, 0, s, 0)
    g.addColorStop(0, '#000')
    g.addColorStop(0.35, '#888')
    g.addColorStop(0.5, '#fff')
    g.addColorStop(0.65, '#888')
    g.addColorStop(1, '#000')
    x.fillStyle = g
    x.fillRect(0, 0, s, s)
  })
const RIB = 20 // ribbon trail points (one per frame: about a third of a second of flight)

export function createThrower(scene, { fx, sfx, player, camera, director, ui, onCaught, onThrow, toast, place, freeze, syncYaw, canEnter, income, toBase }) {
  // --- Scene pieces ---
  const sun = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: sunTex(), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, fog: false }))
  sun.renderOrder = 1
  sun.visible = false
  scene.add(sun)
  const splat = new Mesh(new CircleGeometry(1, 24).rotateX(-Math.PI / 2), new MeshBasicMaterial({ map: splatTex(), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }))
  splat.visible = false
  splat.renderOrder = 2
  scene.add(splat)
  // Wind streaks the chase camera rushes past: thin additive bars (black = invisible).
  const streakMesh = new InstancedMesh(new BoxGeometry(0.035, 0.035, 1), new MeshBasicMaterial({ color: '#ffffff', blending: AdditiveBlending, transparent: true, depthWrite: false, fog: false }), STREAKS)
  streakMesh.instanceMatrix.setUsage(DynamicDrawUsage)
  streakMesh.frustumCulled = false
  streakMesh.renderOrder = 4
  scene.add(streakMesh)
  const streaks = Array.from({ length: STREAKS }, () => ({ on: false, p: new Vector3(), len: 1, life: 0, max: 1 }))
  const dummy = new Object3D()
  const black = new Color(0, 0, 0)
  const sc = new Color()
  for (let i = 0; i < STREAKS; i++) {
    dummy.scale.setScalar(0)
    dummy.updateMatrix()
    streakMesh.setMatrixAt(i, dummy.matrix)
    streakMesh.setColorAt(i, black)
  }
  let streakCursor = 0

  // Ribbon trail behind the flying food: a camera-facing strip through its recent positions
  // in the food's rarity glow (a cycling rainbow for Celestial), tapering and fading out.
  const ribPts = Array.from({ length: RIB }, () => new Vector3())
  let ribCount = 0
  let ribFade = 0
  const ribPos = new Float32Array(RIB * 6)
  const ribCol = new Float32Array(RIB * 6)
  const ribUv = new Float32Array(RIB * 4)
  const ribIdx = []
  for (let i = 0; i < RIB; i++) {
    ribUv.set([0, i / (RIB - 1), 1, i / (RIB - 1)], i * 4)
    if (i < RIB - 1) ribIdx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const ribGeo = new BufferGeometry()
  ribGeo.setAttribute('position', new BufferAttribute(ribPos, 3).setUsage(DynamicDrawUsage))
  ribGeo.setAttribute('color', new BufferAttribute(ribCol, 3).setUsage(DynamicDrawUsage))
  ribGeo.setAttribute('uv', new BufferAttribute(ribUv, 2))
  ribGeo.setIndex(ribIdx)
  const ribbon = new Mesh(ribGeo, new MeshBasicMaterial({ map: ribbonTex(), vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, fog: false }))
  ribbon.frustumCulled = false
  ribbon.renderOrder = 3
  ribbon.visible = false
  scene.add(ribbon)
  // Aura: a pulsing additive glow around the food for Rare and up.
  const aura = new Sprite(new SpriteMaterial({ map: glowTex(), color: '#ffffff', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, fog: false }))
  aura.visible = false
  aura.renderOrder = 3
  scene.add(aura)
  const rv1 = new Vector3()
  const rv2 = new Vector3()
  const rv3 = new Vector3()
  const rc = new Color()
  const RC_A = new Color()
  const RC_B = new Color()
  // Trail / aura colour at k (0 head .. 1 tail) for the held food's rarity.
  function rarityColor(k, t, out) {
    const r = heldR
    if (curTrail?.ribbon && trailColor(curTrail, k, t, out)) return out
    if (r.rainbow) return out.setHSL((t * 0.5 + k * 1.3) % 1, 1, 0.62)
    if (r.key === 'exotic') return out.copy(RC_A.set('#ffd84a')).lerp(RC_B.set('#7ffcff'), 0.5 + 0.5 * Math.sin(k * 9 - t * 6))
    if (r.key === 'cosmic') return out.copy(RC_A.set('#b07dff')).lerp(RC_B.set('#4fc8ff'), k)
    if (r.key === 'special') return out.copy(RC_A.set('#ffe060')).lerp(RC_B.set('#c07dff'), k)
    return out.set(r.glow)
  }
  function ribbonStart(p) {
    ribCount = 0
    ribFade = 1
    ribbon.visible = true
    ribbonPush(p)
  }
  function ribbonPush(p) {
    for (let i = Math.min(ribCount, RIB - 1); i > 0; i--) ribPts[i].copy(ribPts[i - 1])
    ribPts[0].copy(p)
    ribCount = Math.min(RIB, ribCount + 1)
  }
  function ribbonUpdate(rdt, t) {
    if (!ribbon.visible) return
    if (phase !== 'flight') {
      ribFade -= rdt * 1.5
      if (ribFade <= 0) {
        ribbon.visible = false
        return
      }
    }
    const width = 0.1 + heldR.fx * 0.016
    const bright = heldR.fx === 0 ? 0.45 : 0.9
    for (let i = 0; i < RIB; i++) {
      const p = ribPts[Math.min(i, ribCount - 1)]
      const q = ribPts[Math.min(i + 1, ribCount - 1)]
      rv1.copy(p).sub(q)
      if (rv1.lengthSq() < 1e-8) rv1.set(0, 0, 1)
      rv2.copy(camera.position).sub(p)
      rv3.crossVectors(rv1, rv2).normalize()
      const k = i / (RIB - 1)
      const w = i < ribCount ? width * (1 - k * 0.85) : 0
      ribPos[i * 6] = p.x + rv3.x * w
      ribPos[i * 6 + 1] = p.y + rv3.y * w
      ribPos[i * 6 + 2] = p.z + rv3.z * w
      ribPos[i * 6 + 3] = p.x - rv3.x * w
      ribPos[i * 6 + 4] = p.y - rv3.y * w
      ribPos[i * 6 + 5] = p.z - rv3.z * w
      // Fade where the strip passes close to the chase camera, so it never fills the screen.
      const near = Math.min(1, Math.max(0, (rv2.length() - 2.5) / 4))
      rarityColor(k, t, rc).multiplyScalar(Math.pow(1 - k, 1.3) * ribFade * bright * near)
      ribCol[i * 6] = ribCol[i * 6 + 3] = rc.r
      ribCol[i * 6 + 1] = ribCol[i * 6 + 4] = rc.g
      ribCol[i * 6 + 2] = ribCol[i * 6 + 5] = rc.b
    }
    ribGeo.attributes.position.needsUpdate = true
    ribGeo.attributes.color.needsUpdate = true
  }
  // The aura and ambient rarity particles around the food while you hold it or it flies.
  function auraUpdate(rdt, t, on) {
    const r = heldR
    aura.visible = on && !!held?.visible && r.fx >= 2
    if (!aura.visible) return
    aura.position.copy(held.position)
    const pulse = 1 + Math.sin(t * 5) * 0.12
    aura.scale.setScalar((0.95 + r.fx * 0.05) * pulse * held.scale.x)
    rarityColor(0, t, aura.material.color)
    aura.material.opacity = (0.14 + r.fx * 0.026) * (phase === 'flight' ? 0.55 : 1)
    if (Math.random() < rdt * (1 + r.fx * 2.2)) fx.sparkle(held.position, '#' + rarityColor(Math.random(), t, rc).getHexString(), 1, { speed: 1.4, up: 0.6, size: 0.22 + r.fx * 0.02, life: 0.6 })
    if (r.key === 'secret' && Math.random() < rdt * 6) fx.puff(held.position, '#20202a', 1, { size: 0.5, spread: 0.5, up: 0.6, life: 0.8, alpha: 0.5 })
    if ((r.key === 'cosmic' || r.key === 'special' || r.key === 'exotic') && Math.random() < rdt * 5) fx.stars(held.position, '#ffffff', 1, 1.5)
  }
  // Squash and stretch on landings: s jumps to amp, then wobbles out.
  let squashT = 9
  let squashAmp = 0
  function squash(amp) {
    squashT = 0
    squashAmp = amp
  }
  function applySquash(base, rdt) {
    squashT += rdt
    const s = squashAmp * Math.exp(-squashT * 7) * Math.cos(squashT * 24)
    held.scale.set(base * (1 + 0.32 * s), base * (1 - 0.42 * s), base * (1 + 0.32 * s))
  }
  function spawnStreak(at) {
    const s = streaks[streakCursor]
    streakCursor = (streakCursor + 1) % STREAKS
    s.on = true
    s.p.copy(at)
    s.len = rnd(3, 9)
    s.life = 0
    s.max = rnd(0.35, 0.6)
  }
  function updateStreaks(dt) {
    for (let i = 0; i < STREAKS; i++) {
      const s = streaks[i]
      if (!s.on) continue
      s.life += dt
      if (s.life >= s.max) {
        s.on = false
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        streakMesh.setMatrixAt(i, dummy.matrix)
        streakMesh.setColorAt(i, black)
        continue
      }
      const k = s.life / s.max
      dummy.position.copy(s.p)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, s.len)
      dummy.updateMatrix()
      streakMesh.setMatrixAt(i, dummy.matrix)
      const a = Math.sin(k * Math.PI) * 0.9
      streakMesh.setColorAt(i, sc.setRGB(a, a, a))
    }
    streakMesh.instanceMatrix.needsUpdate = true
    if (streakMesh.instanceColor) streakMesh.instanceColor.needsUpdate = true
  }

  // --- Rod, line and hook ---
  // The rod in your hand (rodMesh, along its +Y), the fishing line from its tip to the bobber
  // (a sagging polyline), and under the bobber the hook line, the hook and a wriggly bait worm
  // (only seen in the underwater bite shot).
  const UP = new Vector3(0, 1, 0)
  const rodDir = new Vector3()
  const tip = new Vector3()
  let rod = null
  let rodId = ''
  let rodPitch = 0.75 // rad from vertical, + leans the rod forward (down the river)
  let rodPitchT = 0.75
  let armNow = -1.35
  const LINE_N = 28
  const linePos = new Float32Array(LINE_N * 3)
  const lineGeo = new BufferGeometry()
  lineGeo.setAttribute('position', new BufferAttribute(linePos, 3).setUsage(DynamicDrawUsage))
  const line = new Line(lineGeo, new LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, fog: false }))
  line.frustumCulled = false
  line.visible = false
  scene.add(line)
  const hookPos = new Float32Array(6)
  const hookGeo = new BufferGeometry()
  hookGeo.setAttribute('position', new BufferAttribute(hookPos, 3).setUsage(DynamicDrawUsage))
  const hookLine = new Line(hookGeo, new LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 }))
  hookLine.frustumCulled = false
  hookLine.visible = false
  scene.add(hookLine)
  const hook = new Group()
  const wormBits = [] // the default bait worm (hidden while a real bait is on the hook)
  let baitModel = null
  {
    const steel = new MeshLambertMaterial({ color: '#d8dde6' })
    const worm = new MeshLambertMaterial({ color: '#ff7aa0' })
    const box = (w, h, d, m, x, y, z) => {
      const b = new Mesh(new BoxGeometry(w, h, d), m)
      b.position.set(x, y, z)
      hook.add(b)
      return b
    }
    box(0.04, 0.32, 0.04, steel, 0, -0.16, 0)
    box(0.18, 0.04, 0.04, steel, 0.07, -0.32, 0)
    box(0.04, 0.12, 0.04, steel, 0.15, -0.26, 0)
    for (let i = 0; i < 5; i++) wormBits.push(box(0.11, 0.11, 0.11, worm, Math.sin(i * 1.3) * 0.06, -0.36 - i * 0.09, Math.cos(i * 1.1) * 0.04))
  }
  hook.visible = false
  scene.add(hook)
  const lineA = new Vector3()
  const lineB = new Vector3()
  // Line from a to b sagging `sag` metres in the middle (never below the water surface).
  function setLine(a, b, sag) {
    lineA.copy(a)
    lineB.copy(b)
    for (let i = 0; i < LINE_N; i++) {
      const u = i / (LINE_N - 1)
      const y = a.y + (b.y - a.y) * u - sag * 4 * u * (1 - u)
      linePos[i * 3] = a.x + (b.x - a.x) * u
      linePos[i * 3 + 1] = Math.max(y, Math.min(b.y, WY + 0.02))
      linePos[i * 3 + 2] = a.z + (b.z - a.z) * u
    }
    lineGeo.attributes.position.needsUpdate = true
    line.visible = true
  }
  function ensureRod() {
    if (rodId !== state.S.food) {
      rod?.removeFromParent()
      rod = rodMesh(state.S.food, TM.rod.length)
      scene.add(rod)
      rodId = state.S.food
    }
    rod.visible = true
  }
  function rodUpdate(rdt, t) {
    if (!rod?.visible) return
    armNow = armFor(t)
    rodPitch += (rodPitchT - rodPitch) * Math.min(1, rdt * (phase === 'windup' ? 16 : swing > 0 ? 22 : 7))
    const p = player.renderPosition
    rod.position.set(p.x + 0.62, p.y + TM.rod.shoulder - Math.cos(armNow) * 0.78, p.z + Math.sin(armNow) * 0.78)
    rodDir.set(0.14, Math.cos(rodPitch), -Math.sin(rodPitch)).normalize()
    rod.quaternion.setFromUnitVectors(UP, rodDir)
    tip.copy(rod.userData.tip).applyQuaternion(rod.quaternion).add(rod.position)
  }
  // Right arm (radians about X) per phase: rod held out in front, cocked back over the shoulder
  // in the windup, whipped forward on the cast, then held out while the bobber floats.
  function armFor(t) {
    if (phase === 'enter' || phase === 'aim') {
      rodPitchT = 0.7
      return -1.35 + Math.sin(t * 4) * 0.04
    }
    if (phase === 'windup') {
      // Back over the shoulder (further for a better grade), held there with a little tremble
      // while the power builds; a WEAK cast barely lifts it.
      rodPitchT = show.arm > 2.5 ? -0.55 : -0.2
      const k = smooth(Math.min(1, pt / Math.min(0.3, windDur * 0.6)))
      const tremble = show.hero && pt > 0.3 ? Math.sin(t * 46) * 0.035 : 0
      return -1.35 - k * (show.arm - 1.35) + tremble
    }
    if (swing > 0) {
      rodPitchT = show.arm > 2.5 ? 1.2 : 0.9
      return -show.arm + (1 - swing) * (show.arm - 1.15)
    }
    if (phase === 'meet' && bad?.sub === 'tug') {
      rodPitchT = 0.25
      return -1.8
    }
    rodPitchT = 0.95
    return -1.2
  }
  // Left arm (radians about X) for the big casts: it points down the river for balance while the
  // rod is cocked back, then drops as the rod whips through. null = leave the rig's own pose.
  function armLFor() {
    if (!show.hero) return null
    if (phase === 'windup') return -1.55 * smooth(Math.min(1, pt / 0.25))
    if (phase === 'flight' && swing > 0) return -1.55 * swing
    return null
  }

  // --- State ---
  let phase = 'off'
  let pt = 0 // s in this phase (scaled time)
  let armed = true // must step off the band before it can catch you again
  let auto = false
  let lucky = false // the Lucky Cast is armed for the next cast
  let luckyUsed = false
  let curTrail = null // the trail worn for this cast (TRAILS)
  let usedBait = null // the bait on the hook for this cast (BAITS)
  let meetMin = 0 // a Jackpot Bait: the bite is at least this rarity
  const flightDir = new Vector3(0, 0, -1)
  let meter = 0
  let meterDir = 1
  let autoStop = 0.9
  let power = 0
  let grade = TM.grades[2]
  let gradeIdx = 2
  let ts = 1 // time scale (slow motion)
  let hitStop = 0
  let swing = 0 // rod follow-through after the release, 1 -> 0
  let lean = 0
  // The cast show for this grade (TM.castFx): windup length, pose, banner, confetti.
  let show = TM.castFx[2]
  let windDur = show.windup
  let hopY = 0 // m the body is lifted (the PERFECT / GREAT jump into the windup)
  let hopV = 0
  let hopG = 20
  let castSpecial = '' // 'secret' (Jackpot Bait) / 'lucky' (Lucky Cast) / ''
  let wind = null
  let held = null // the bobber (hanging, then flying, then floating): position + squash
  let spin = null // its model inside held (wobbles)
  let heldId = ''
  let heldDef = FOOD_BY_ID[state.S.food]
  let heldR = foodRarity(state.S.food)
  const from = new Vector3()
  const to = new Vector3()
  const vel = new Vector3()
  const prevPos = new Vector3()
  let flightDur = 1
  let peak = 3
  let slowed = false
  let luckBase = 1
  let streak = 0 // PERFECTs in a row (STREAK)
  const streakMult = () => 1 + STREAK.step * Math.min(STREAK.max, streak)
  let throwDist = 0 // metres from the casting spot to where the bobber lands
  let luckNow = 1
  let luckShown = 1
  let zoneIdx = -1
  let settled = false
  let orbit = 0
  let under = false // the camera is under water (main.js tints the fog)
  let enterFrom = { x: 0, z: 0, facing: 0 }
  // Bite / reveal.
  let bad = null // { b, def, v, area, sub, t, isNew, full, hook }
  const flyers = [] // caught animals on their way to the pen
  const leavers = [] // hotbar full: animals sinking back into the river
  let canContinue = false
  let autoT = 0
  let luckyPrice = 0
  let uiT = 0

  const spot = new Vector3(TM.spot.x, 0, TM.spot.z)
  // 0 on landscape screens, up to 1 on tall phone screens: shots back off and centre up.
  const narrow = () => Math.max(0, Math.min(1, (1.25 - camera.aspect) / 0.7))
  const tmpA = new Vector3()
  const tmpB = new Vector3()
  const tmpC = new Vector3()
  const povEye = new Vector3()
  const povLook = new Vector3()
  const waterAt = (z) => {
    const zone = zoneAt(z) ?? HUB.zones[0]
    return [zone.waterLine ?? '#ffffff', zone.water ?? '#2fd0d8']
  }

  function onBand(p) {
    const B = TM.band
    return Math.abs(p.x) < B.halfWidth && p.z < B.south && p.z > B.north && p.y < 2
  }
  function priceNow() {
    const raw = Math.max(TM.lucky.minPrice, income() * TM.lucky.incomeSeconds)
    const step = Math.pow(10, Math.floor(Math.log10(raw)) - 1)
    return Math.ceil(raw / step) * step
  }
  function refreshLucky() {
    luckyPrice = priceNow()
    const free = state.S.luckyCredits > 0 // earned from a rewarded ad
    ui.setLucky({ price: luckyPrice, armed: lucky, afford: free || state.S.money >= luckyPrice, free, mult: TM.lucky.mult })
  }
  function setPhase(name) {
    phase = name
    pt = 0
    ui.setPhase(name)
    ui.canExit(name === 'aim')
  }
  function ensureHeld() {
    if (!held) {
      held = new Group()
      scene.add(held)
    }
    if (heldId !== state.S.food) {
      spin?.removeFromParent()
      spin = bobberMesh(state.S.food, TM.rod.bobber)
      held.add(spin)
      heldId = state.S.food
      heldDef = FOOD_BY_ID[heldId]
      heldR = foodRarity(heldId)
    }
    ensureRod()
    held.visible = true
    held.scale.setScalar(1)
    held.rotation.set(0, 0, 0)
    spin.rotation.set(0, 0, 0)
  }
  // The bobber hanging under the rod tip (swaying a little).
  const hang = (out, t) => out.set(tip.x + Math.sin(t * 2.2) * 0.06, tip.y - TM.rod.hang, tip.z + Math.cos(t * 1.7) * 0.05)
  const hand = (out) => out.copy(tip)
  const foodColors = () => paletteOf(heldId)

  // --- Shots ---
  function aimShot(stiff = 4, push = 0) {
    const c = TM.cam.aim
    const p = player.renderPosition
    const n = narrow()
    tmpA.set(spot.x + c.side * (1 - n * 0.75), p.y + c.up + n * 1.2 - push * 0.3, spot.z + c.back * (1 + n * 0.35) - push)
    tmpB.set(spot.x + c.side * 0.3 * (1 - n), p.y + c.lookUp, spot.z - c.lookAhead)
    director.setShot(tmpA, tmpB, c.fov + n * 8 - push * 4, { stiff })
  }
  // The big-cast windup (k 0..1): in front of you and to the left, looking back at you with the
  // rod raised over your head, pushing in slowly while the power builds.
  function heroShot(k) {
    const c = TM.cam.hero
    const p = player.renderPosition
    const n = narrow()
    const d = (1 + n * 0.7) * (1 - 0.12 * smooth(Math.min(1, k)))
    tmpA.set(spot.x + c.side * d, p.y + c.up + hopY * 0.5, spot.z - c.ahead * d)
    tmpB.set(spot.x + 0.3, p.y + c.lookUp + hopY * 0.8, spot.z)
    director.setShot(tmpA, tmpB, c.fov + n * 10, { stiff: 6, roll: 0.05 })
  }

  // --- Enter / exit ---
  function enter() {
    if (phase !== 'off') return
    const p = player.renderPosition
    enterFrom = { x: p.x, z: p.z, facing: player.facing }
    freeze(true)
    syncYaw()
    document.body.classList.add('throw-mode')
    if (document.pointerLockElement) document.exitPointerLock?.()
    setPhase('enter')
    ui.letterbox(false)
    ui.vignette('#000', 0.35)
    ui.setGain(THROW.strengthPerThrow)
    ui.setPower?.(state.totalStrength())
    ui.setAuto(auto)
    refreshLucky()
    aimShot(3)
    director.engage(true, 1.8)
    sfx.bandEnter()
    fx.ring(new Vector3(spot.x, 0.06, spot.z), '#ffe23a', { r0: 0.5, r1: 4, life: 0.6 })
    fx.motes(new Vector3(spot.x, 0.1, spot.z), '#ffe23a', 18, 1.6, { rise: 2.4 })
    ensureHeld()
    rodPitch = 0.2
    held.scale.setScalar(0.01)
    sfx.foodAppear?.(heldR.fx)
  }
  function exit() {
    if (phase !== 'aim') return
    finishExit()
  }
  function finishExit() {
    phase = 'off'
    under = false
    hopY = hopV = 0
    ui.pov(false)
    ui.hideCast()
    ui.hide()
    ui.vignette('#000', 0)
    director.engage(false, 2.2)
    freeze(false)
    armed = false
    document.body.classList.remove('throw-mode')
    if (held) held.visible = false
    if (rod) rod.visible = false
    line.visible = hookLine.visible = hook.visible = false
    aura.visible = false
    sfx.bandExit()
  }

  // --- Aim -> windup -> cast ---
  function lockIn() {
    power = meter
    gradeIdx = TM.grades.findIndex((g) => power >= g.min)
    grade = TM.grades[gradeIdx]
    sfx.lockIn(gradeIdx)
    director.kick(-4)
    // PERFECT streak: PERFECT adds one, GREAT keeps it, GOOD / WEAK ends it.
    if (gradeIdx === 0) streak++
    else if (gradeIdx >= 2) streak = 0
    state.noteStreak(streak)
    ui.setStreak(streak, streakMult())
    luckyUsed = lucky
    lucky = false
    // The cast show: a Jackpot Bait on the hook or a Lucky Cast makes it at least a GREAT show.
    const jackpot = state.bait()?.guarantee ?? 0
    const special = jackpot ? 'secret' : luckyUsed ? 'lucky' : ''
    show = TM.castFx[Math.min(gradeIdx, special ? 1 : 3)]
    castSpecial = special
    windDur = show.windup
    ui.castShow(castBanner(special, jackpot))
    sfx.castShow(gradeIdx, special)
    const p = player.renderPosition
    const feet = tmpB.set(p.x, p.y + 0.06, p.z)
    if (gradeIdx === 0 || special) {
      fx.sparkle(hand(tmpA), '#bfff6a', 26, { speed: 5 })
      fx.stars(tmpA, '#ffe14a', 8, 4)
      fx.ring(feet, '#ffe14a', { r0: 0.4, r1: 5, life: 0.6 })
      fx.ring(feet, '#ffffff', { r0: 0.3, r1: 3, life: 0.45 })
      ui.flash(special === 'secret' ? '#ffe680' : '#c8ff6a', 0.3, 0.3)
    } else if (gradeIdx === 1) {
      fx.sparkle(hand(tmpA), '#d4ff3a', 16, { speed: 4 })
      fx.ring(feet, '#d4ff3a', { r0: 0.4, r1: 3.5, life: 0.5 })
      ui.flash('#e8ff9a', 0.18, 0.25)
    } else if (gradeIdx === 2) {
      fx.sparkle(hand(tmpA), '#ffd23a', 8, { speed: 3 })
    } else {
      // A WEAK cast: a sad little puff of dust at your feet.
      fx.puff(feet, '#c9a27a', 6, { size: 0.5, spread: 0.8, up: 0.4, life: 0.8, alpha: 0.5 })
    }
    // The big casts jump into the windup and land just before the release.
    if (show.hop > 0) {
      const T = windDur * 0.85
      hopG = (8 * show.hop) / (T * T)
      hopV = (hopG * T) / 2
      hopY = 0.001
    }
    setPhase('windup')
    sfx.windup()
    // Big casts cut straight to the hero angle under the lock-in flash.
    if (show.hero) {
      heroShot(0)
      director.cut()
    }
  }
  // The banner text: the title in its letter style, then "LABEL: item . item" chips.
  function castBanner(special, jackpot) {
    const items = []
    if (grade.luck > 1) items.push({ t: `x${grade.luck} LUCK`, c: '#ffd23a' })
    if (streak >= 2) items.push({ t: `\u{1F525} x${streak} STREAK`, c: '#5ac8ff' })
    if (special === 'secret') {
      const R = RARITIES[Math.min(RARITIES.length - 1, jackpot)]
      return { ...show, title: 'SECRET CAST!', style: 'rainbow', frame: 'gold', label: 'GUARANTEED:', items: [{ t: R.name.toUpperCase(), c: R.color }, ...items].slice(0, 3) }
    }
    if (special === 'lucky') return { ...show, title: 'LUCKY CAST!', style: 'lucky', frame: 'gold', label: 'BONUS:', items: [{ t: `${TM.lucky.mult}X LUCK`, c: '#7dff4a' }, ...items].slice(0, 3) }
    if (gradeIdx === 0) return { ...show, label: 'BONUS:', items: items.length > 1 ? items : [...items, { t: 'MAX POWER', c: '#7dff4a' }] }
    if (gradeIdx === 1) return { ...show, label: 'BONUS:', items: streak === 1 ? [...items, { t: 'STREAK KEPT', c: '#5ac8ff' }] : items }
    if (gradeIdx === 2) return { ...show, label: '', items: [{ t: 'Stop in the green for bonus luck!', c: '#ffffff' }] }
    return { ...show, label: '', items: [{ t: 'Stop the meter near the top!', c: '#ffc49a' }] }
  }
  function launch() {
    const p = player.renderPosition
    from.copy(held.position)
    const want = Math.max(8, state.range() * (TM.minPower + (1 - TM.minPower) * power))
    const z = Math.min(L.throwLine - 5, Math.max(L.end + 3, spot.z - want))
    to.set(Math.max(-L.river + 1.4, Math.min(L.river - 1.4, spot.x + rnd(-1.8, 1.8))), WY, z)
    const dist = Math.abs(to.z - from.z)
    const f = THROW.flightTime
    flightDur = f[0] + (f[1] - f[0]) * Math.min(1, dist / THROW.maxRange)
    peak = 2.5 + Math.min(18, dist * 0.09)
    luckBase = state.luck() * grade.luck * streakMult() * (luckyUsed ? TM.lucky.mult : 1)
    luckNow = luckShown = luckBase
    // The bait goes on the hook (its luck is already in state.luck()); a trail on trial wears down.
    usedBait = state.useBait()
    meetMin = usedBait?.guarantee ?? 0
    curTrail = state.trail()
    state.trailCasted()
    throwDist = Math.abs(spot.z - z)
    zoneIdx = -1
    slowed = false
    settled = false
    ts = 1
    prevPos.copy(from)
    held.scale.setScalar(1.25)
    swing = 1
    lean = -0.25
    state.S.stats.throws++
    state.addStrength(THROW.strengthPerThrow)
    ui.setPower?.(state.totalStrength())
    // The other players replay the flight (remote.js): same arc, bobber, trail and splash.
    onThrow?.({ trail: curTrail?.id ?? '', food: state.S.food, from: { x: from.x, y: from.y, z: from.z }, to: { x: to.x, y: to.y, z: to.z }, dur: flightDur, peak, power, lucky: luckyUsed })
    sfx.launch(power)
    sfx.reel?.(1)
    sfx.foodLaunch?.(heldR.fx)
    ribbonStart(from)
    if (heldR.fx >= 1) fx.sparkle(from, heldR.glow, 8 + heldR.fx * 3, { speed: 6, size: 0.35 })
    if (heldR.fx >= 4) fx.ring(new Vector3(p.x, 0.07, p.z), heldR.glow, { r0: 0.6, r1: 6 + heldR.fx * 0.5, life: 0.55 })
    // Rods get louder and brighter with every tier, and so do baits (fx/trails.js, audio/sfx.js).
    const rodTier = FOOD_BY_ID[state.S.food]?.tier ?? 0
    castBlast(fx, ui, director, heldR.fx, rodTier, from, tmpB.set(p.x, 0.07, p.z), heldR.glow, paletteOf(state.S.food)[0])
    sfx.rodPower?.(heldR.fx, rodTier)
    if (usedBait) {
      const bl = FOOD_RARITIES[usedBait.rarity].fx
      baitBlast(fx, ui, director, usedBait, bl, from, tmpB.set(p.x, 0.07, p.z), baitColors(usedBait.id))
      sfx.baitUse?.(bl, !!usedBait.guarantee)
      toast?.(`${usedBait.name}: ${usedBait.guarantee ? 'a Secret animal is guaranteed!' : `luck x${usedBait.luck}`} (${state.baitCount(usedBait.id)} left)`, 'good')
    }
    wind?.stop()
    wind = sfx.windLoop()
    director.kick(16)
    director.shake(0.32 + power * 0.15)
    ui.flash('#ffffff', 0.32, 0.25)
    ui.vignette('#000', 0.25)
    ui.setLuck(luckNow)
    ui.zone('', '#fff')
    fx.sparkle(from, '#fff6c0', 20, { speed: 6 })
    fx.ring(new Vector3(p.x, 0.06, p.z), '#ffffff', { r0: 0.5, r1: 5, life: 0.45 })
    // The cast show at the release (TM.castFx): the lunge, 3D confetti cubes, the grade's sound.
    lean = show.lunge
    if (show.cubes) {
      const big = gradeIdx === 0 || castSpecial
      const at = tmpA.set(p.x + 0.3, p.y + 1.7, p.z - 0.5)
      fx.chunks(at, big ? RAINBOW_C : ['#d4ff3a', '#7dff4a', '#ffffff', '#ffd23a'], show.cubes, { power: 1.5, floor: p.y + 0.05, size: big ? 0.22 : 0.17, up: 2.6 })
      if (show.screen) fx.confetti(at, Math.round(show.cubes * 0.8), 7)
    }
    if (show.title.startsWith('WEAK')) fx.puff(tmpA.set(p.x, p.y + 0.15, p.z - 0.6), '#c9a27a', 8, { size: 0.6, spread: 1.2, up: 0.5, life: 0.9, alpha: 0.55 })
    if (show.shake) director.shake(show.shake)
    sfx.castRelease(gradeIdx, castSpecial)
    setPhase('flight')
  }

  // --- Splashdown ---
  function impact() {
    const [lc, wc] = waterAt(held.position.z)
    held.position.y = WY
    hitStop = TM.hitStop
    ts = 1
    wind?.stop(0.05)
    wind = null
    sfx.splash?.(0.65 + power * 0.35)
    sfx.foodImpact?.(heldDef.kind, 0.35 + power * 0.25, heldR.fx)
    director.shake(0.45 + power * 0.2)
    director.kick(-8)
    ui.flash('#ffffff', 0.5, 0.35)
    ui.setSpeed(0)
    ui.vignette('#000', 0.3)
    const at = tmpA.set(held.position.x, WY + 0.05, held.position.z)
    fx.ring(at, lc, { r0: 0.5, r1: 8, life: 0.8 })
    fx.ring(at, '#ffffff', { r0: 0.3, r1: 4.5, life: 0.5 })
    fx.puff(at, '#ffffff', 16, { size: 1, spread: 3, up: 2.4, life: 1, alpha: 0.75 })
    fx.chunks(tmpB.set(held.position.x, WY + 0.3, held.position.z), ['#ffffff', '#f2fdff', lc, wc], 30 + heldR.fx * 3, { power: 0.9 + power * 0.4, floor: WY - 0.15, size: 0.16, up: 1.6 })
    impactFx(at)
    squash(1)
    fx.sparkle(at, lc, 24, { speed: 6, up: 3 })
    splat.visible = true
    splat.position.set(held.position.x, WY + 0.03, held.position.z)
    splat.scale.setScalar(0.4)
    splat.material.color.set('#ffffff')
    splat.material.opacity = 0.7
    splat.userData.t = 0
    vel.set(0, -4.5, 0)
    setPhase('impact')
    orbit = 0
  }

  // Rarity extras on splashdown: the rarer the rod, the bigger the show.
  function impactFx(at) {
    const r = heldR
    if (r.fx >= 2) fx.ring(at, r.glow, { r0: 0.6, r1: 6 + r.fx, life: 0.8 })
    // One slim light beam (the landing camera sits close, so wide beams would white out).
    if (r.fx >= 4 && r.key !== 'divine' && r.key !== 'exotic') fx.beam(at, r.glow, { radius: 0.45 + r.fx * 0.035, height: 10 + r.fx * 2, life: 1.3 })
    if (r.fx >= 5) fx.stars(at, r.glow, 6 + r.fx, 6)
    if (r.rainbow) for (const c of ['#ff5a5a', '#ffd84a', '#5aff8a', '#5ac8ff', '#c07dff']) fx.sparkle(at, c, 8, { speed: 8, up: 4 })
    if (r.key === 'cosmic' || r.key === 'special') {
      fx.sparkle(at, '#ffffff', 22, { speed: 9, up: 5, size: 0.5 })
      fx.ring(at, '#4fc8ff', { r0: 1, r1: 12, life: 1 })
    }
    if (r.key === 'divine') {
      fx.beam(at, '#fff6d0', { radius: 0.6, height: 26, life: 1.6 })
      fx.motes(at, '#fff0b0', 30, 2.5, { rise: 3, size: 0.3, life: 1.6 })
      fx.ring(at, '#ffd6f0', { r0: 2, r1: 9, life: 1.2 })
    }
    if (r.key === 'secret') {
      fx.puff(at, '#22222a', 14, { size: 1.2, spread: 3.5, up: 1.5, life: 1.4, alpha: 0.7 })
      fx.sparkle(at, '#ffffff', 30, { speed: 10, up: 4 })
    }
    if (r.key === 'exotic') {
      fx.beam(at, '#ffd84a', { radius: 0.55, height: 26, life: 1.6 })
      fx.ring(at, '#7ffcff', { r0: 1, r1: 14, life: 1.1 })
      fx.stars(at, '#7ffcff', 12, 8)
      fx.confetti(at, 40, 8)
    }
    if (r.fx >= 6) ui.flash(r.glow, 0.3, 0.4)
  }
  // The bobber on the water: a spring toward the surface (plunges, then bobs).
  function bobberPhysics(dt, t) {
    const fp = held.position
    vel.y += (-(fp.y - WY) * 70 - vel.y * 6) * dt
    fp.y += vel.y * dt
    if (!settled && pt > 0.9 && Math.abs(vel.y) < 0.4) settled = true
    if (settled) fp.y += Math.sin(t * 2.4) * 0.002
  }

  // --- The bite: an animal of the zone takes the hook ---
  // Who bites: a season animal (a Season Lure guarantees one, else 1 in SEASON.chance), or an
  // animal of the zone it landed in (the featured area adds luck). Then a variant roll: rarest
  // first, 1 in VARIANTS[v].chance, featured area x EVENTS.featured.variant, luck helps a little.
  function rollMeet(zone) {
    const featured = events.isFeatured(zone.index)
    const L = luckNow * (featured ? EVENTS.featured.luck : 1)
    let def
    const lure = (state.S.lures | 0) > 0
    if (!meetMin && (lure || Math.random() * SEASON.chance < 1)) {
      if (lure) state.S.lures--
      def = state.rollSeason(L)
    }
    const need = meetMin
    meetMin = 0 // a Jackpot Bait only counts once
    def ||= state.rollBaddie(zone.index, L, need)
    const boost = (featured ? EVENTS.featured.variant : 1) * (1 + Math.log10(Math.max(1, L)) * 0.5)
    let v = 0
    for (let i = VARIANTS.length - 1; i > 0; i--) {
      if (Math.random() * VARIANTS[i].chance < boost) {
        v = i
        break
      }
    }
    return { def, v }
  }
  function startBite() {
    const fp = held.position
    const zone = zoneAt(fp.z) ?? HUB.zones[0]
    const { def, v } = rollMeet(zone)
    const area = zone.index
    // Records, milestone cash and Event Tickets for this cast.
    const rec = state.recordThrow(throwDist, area)
    if (rec.record) ui.zone(`NEW RECORD! ${Math.round(throwDist)} m`, '#ffe14a')
    if (rec.paid) toast(`Distance milestone: +$${Math.round(rec.paid).toLocaleString()}!`, 'good')
    state.addTickets(SEASON.ticketsPerThrow + (def.season ? SEASON.ticketsPerGirl : 0))
    const b = new Baddie(def.id, 0, { showLabel: false, variant: v })
    b.ground = false
    b.mode = 'swim'
    b.group.visible = false
    scene.add(b.group)
    const isNew = !state.S.discovered[def.id]
    const full = state.hotbarRoom() <= 0
    const hk = new Vector3(fp.x, Math.max(BED + 1.4, WY - TM.bite.hookDepth), fp.z)
    bad = { b, def, v, area, zone, sub: 'wait', t: 0, isNew, full, hook: hk, nibbles: 0, next: rnd(0.45, 0.8), start: new Vector3() }
    ui.showContinue(false)
    ui.letterbox(true)
    setPhase('meet')
  }
  function startUnder() {
    const b = bad.b
    const hk = bad.hook
    bad.sub = 'under'
    bad.t = 0
    under = true
    // It swims in from upstream, a little deeper, and noses up to the bait.
    const side = Math.random() < 0.5 ? -1 : 1
    bad.start.set(Math.max(-L.river + 1.5, Math.min(L.river - 1.5, hk.x + side * 2.2)), Math.max(BED + 0.6, hk.y - 1.1), hk.z - TM.bite.swimFrom)
    b.group.position.copy(bad.start)
    b.group.visible = false // first person: we see through its eyes, not at it
    b.mode = 'swim'
    bad.u = 0
    bad.noticed = false
    bad.beat = 0.5
    hook.visible = true
    // The bait you cast with hangs on the hook (a glowing lure is seen from far away underwater).
    for (const w of wormBits) w.visible = !usedBait
    if (baitModel) hook.remove(baitModel)
    baitModel = usedBait ? baitMesh(usedBait.id, usedBait.kind === 'lure' || usedBait.kind === 'rainbow' || usedBait.kind === 'jackpot' ? 0.7 : 0.5) : null
    if (baitModel) {
      baitModel.position.set(0.04, -0.66, 0)
      hook.add(baitModel)
    }
    hookLine.visible = true
    line.visible = false
    held.visible = false
    director.cut()
    ui.flash('#bff8ff', 0.7, 0.5)
    ui.vignette('#04384a', 0.7)
    ui.pov(true)
    ui.povLevel(0)
    ui.povThought('Something is in the water...')
    sfx.dive?.()
    director.shake(0.18)
    for (let i = 0; i < 14; i++) fx.themed('bubbles', { x: hk.x + rnd(-1.5, 1.5), y: hk.y + rnd(0, 1.5), z: hk.z + rnd(-2.5, 0.5) }, ['#ffffff', '#bff8ff'], { burst: true })
  }
  // The animal's eyes: from where it starts the search, in to a hand's breadth from the bait.
  // u = seconds on the POV clock, sK = search 0..1, k = approach 0..1, lk = lunge 0..1.
  function povShot(u, sK, k, lk) {
    const P = TM.bite.pov
    const hk = bad.hook
    const st = bad.start
    const eyeY = st.y + bad.b.height * 0.6
    // Bait centre (the worm hangs under the hook).
    const bx = hk.x + 0.07
    const by = hk.y - 0.55
    povEye.set(st.x + (hk.x - st.x) * k, eyeY + (by - eyeY) * k, st.z + (hk.z - 1.3 - st.z) * k)
    if (lk > 0) {
      povEye.x += (hk.x - povEye.x) * lk
      povEye.y += (by - povEye.y) * lk
      povEye.z += (hk.z - 0.45 - povEye.z) * lk
    }
    // Swimming sway.
    povEye.x += Math.sin(u * 1.4) * 0.07 * (1 - lk)
    povEye.y += Math.sin(u * 2.3) * 0.06 * (1 - lk)
    // Searching: the gaze sweeps side to side, then locks onto the bait.
    const sweep = 1 - sK
    povLook.set(bx + Math.cos(u * 3.4) * 3.4 * sweep, by + Math.sin(u * 2.6 + 1) * 0.8 * sweep + 0.2 * sweep, hk.z)
    const fov = P.fov0 + (P.fov1 - P.fov0) * k + (P.fovLunge - P.fov1) * lk
    const roll = Math.sin(u * 1.9) * 0.05 * (1 - lk) + Math.sin(u * 6) * 0.02 * k + lk * 0.14
    director.setShot(povEye, povLook, fov, { stiff: u < 0.05 ? 60 : 16, roll })
  }
  function underShot(stiff) {
    const hk = bad.hook
    const bp = bad.b.group.position
    const n = narrow()
    tmpA.set(hk.x + 2.4, hk.y - 0.4, hk.z + 4.6 * (1 + n * 0.5))
    tmpB.set((hk.x + bp.x) / 2, (hk.y - 0.3 + bp.y + bad.b.height * 0.4) / 2, (hk.z + bp.z) / 2)
    director.setShot(tmpA, tmpB, 64, { stiff })
  }
  function startTug() {
    bad.sub = 'tug'
    bad.t = 0
    under = false
    hook.scale.setScalar(1)
    ui.pov(false)
    hook.visible = false
    hookLine.visible = false
    held.visible = true
    bad.b.group.visible = false
    director.cut()
    ui.flash('#ffffff', 0.6, 0.3)
    ui.vignette(bad.def.rarity >= 3 ? RARITIES[bad.def.rarity].glow : '#000', 0.5)
    sfx.splash?.(0.45)
    sfx.reel?.(1.4)
    sfx.drumroll(1.5, bad.def.rarity)
    director.shake(0.3)
  }
  function startBurst() {
    const b = bad.b
    const fp = held.position
    bad.sub = 'burst'
    bad.t = 0
    bad.landed = false
    held.visible = false
    line.visible = false
    b.group.visible = true
    b.mode = 'cheer'
    b.group.position.set(fp.x, WY - b.height, fp.z)
    b.group.rotation.y = 0
    const [lc, wc] = waterAt(fp.z)
    const at = tmpA.set(fp.x, WY + 0.05, fp.z)
    sfx.splash?.(1)
    director.shake(0.45)
    director.kick(10)
    ui.flash('#ffffff', 0.7, 0.4)
    fx.chunks(tmpB.set(fp.x, WY + 0.5, fp.z), ['#ffffff', '#f2fdff', '#e8fbff', lc], 46, { power: 1.35, floor: WY - 0.2, size: 0.26, up: 2.2 })
    fx.puff(at, '#ffffff', 22, { size: 1.3, spread: 3.2, up: 3, life: 1.2, alpha: 0.8 })
    fx.ring(at, '#ffffff', { r0: 0.5, r1: 7, life: 0.8 })
    fx.ring(at, lc, { r0: 1, r1: 10, life: 1 })
    fx.sparkle(at, wc, 20, { speed: 6, up: 4 })
    splat.visible = true
    splat.position.set(fp.x, WY + 0.03, fp.z)
    splat.scale.setScalar(0.6)
    splat.material.opacity = 0.8
    splat.userData.t = 0
  }
  // How deep it sits when floating (swimmers half under, the rest bob with their belly wet).
  const sinkOf = (b) => b.height * (b.swimmer ? 0.22 : 0.14)
  function startReveal() {
    const b = bad.b
    const r = bad.def.rarity
    const bp = b.group.position
    held.visible = false
    line.visible = false
    bad.sub = 'reveal'
    bad.t = 0
    b.mode = 'float'
    b.speed = 0
    bp.y = WY - sinkOf(b)
    canContinue = false
    // Close-up from the south at the water line, the animal turned to camera, a sunburst in its rarity colour.
    const c = TM.cam.reveal
    const n = narrow()
    tmpA.set(bp.x, WY + c.up * 0.7 + b.height * 0.3, bp.z + (c.dist * 0.5 + b.span * 1.35) * (1 + n * 0.45))
    tmpB.set(bp.x, WY + b.height * (0.4 - n * 0.25), bp.z)
    director.setShot(tmpA, tmpB, c.fov, { stiff: 14 })
    director.cut()
    ui.flash(RARITIES[r].glow, 0.75, 0.5)
    ui.vignette(r >= 3 ? RARITIES[r].glow : '#000', r >= 3 ? 0.55 : 0.4)
    sun.visible = true
    sun.material.color.set(RARITIES[r].glow)
    sun.material.opacity = 0
    sun.position.set(bp.x, WY + b.height * 0.6, bp.z - 1.4)
    sun.scale.setScalar(0.1)
    fx.beam(new Vector3(bp.x, WY, bp.z), RARITIES[r].glow, { radius: 1.3, height: 14, life: 1.6 })
    fx.ring(new Vector3(bp.x, WY + 0.08, bp.z), RARITIES[r].glow, { r1: 4, life: 0.6 })
    setPhase('reveal')
    ui.letterbox(false)
    ui.typeName(bad.def.name, TM.typeEvery, (i) => {
      sfx.typeKey(i)
      director.shake(0.04)
    }, showCard)
  }
  function showCard() {
    if (!bad || bad.sub !== 'reveal') return
    const r = bad.def.rarity
    const b = bad.b
    const bp = b.group.position
    const inc = state.baddieIncome({ id: bad.def.id, size: 0, v: bad.v, a: bad.area })
    ui.card({ rarity: r, name: bad.def.name, income: inc, isNew: bad.isNew, full: bad.full, variant: bad.v, season: bad.def.season ? events.season().season.name : '' })
    if (bad.v) {
      ui.flash(VARIANTS[bad.v].glow, 0.6, 0.6)
      fx.sparkle(tmpA.set(bp.x, WY + b.height * 0.6, bp.z), VARIANTS[bad.v].color, 60, { speed: 8, up: 3 })
    }
    sfx.reveal(r)
    if (bad.isNew) setTimeout(() => sfx.newStamp(), 450)
    if (bad.full) setTimeout(() => sfx.deny(), 450)
    director.shake(0.22 + Math.min(r, 7) * 0.07) // the top rarities shake no harder than Divine
    director.kick(7 + Math.min(r, 7))
    ui.flash(RARITIES[r].glow, 0.45 + r * 0.05, 0.5)
    const head = tmpA.set(bp.x, WY + b.height * 0.8, bp.z)
    fx.sparkle(head, RARITIES[r].glow, 30 + r * 10, { speed: 6 })
    fx.stars(head, '#ffe14a', 10 + r * 3, 6)
    if (r >= 1) fx.confetti(tmpB.set(bp.x, WY + b.height + 0.5, bp.z + 1), 40 + Math.min(r, 7) * 25, 7)
    b.hop()
    fx.ring(tmpC.set(bp.x, WY + 0.05, bp.z), '#ffffff', { r0: 0.4, r1: 3, life: 0.6 })
    b.mode = bad.full ? 'float' : 'cheer'
    bad.sub = 'card'
    bad.t = 0
  }
  function startCatch() {
    const b = bad.b
    const def = bad.def
    const bp = b.group.position
    ui.hideReveal()
    ui.showContinue(false)
    ui.letterbox(true)
    setPhase('catch')
    const entry = bad.full ? null : state.catchToHotbar(def, { catchOdds: def.odds, v: bad.v, a: bad.area })
    if (entry) {
      state.recordCatch(def)
      const head = tmpA.set(bp.x, WY + b.height, bp.z)
      fx.hearts(head, 10)
      fx.beam(new Vector3(bp.x, WY, bp.z), RARITIES[def.rarity].glow, { radius: 1.7, height: 20, life: 1.5 })
      fx.ring(new Vector3(bp.x, WY + 0.08, bp.z), RARITIES[def.rarity].glow, { r1: 6 })
      sfx.caught(def.rarity)
      b.mode = 'cheer'
      bad.sub = 'liftoff'
      bad.entry = entry
    } else {
      fx.text('Hotbar full!', new Vector3(bp.x, WY + b.height + 1, bp.z), '#ff6a6a', { height: 1, life: 1.6 })
      toast('Hotbar full! Place animals in your pen, sell some or fuse them to free a slot.', 'warn')
      b.mode = 'float'
      bad.sub = 'shrug'
    }
    bad.t = 0
  }
  function backToAim() {
    sfx.wipe()
    ui.wipe(() => {
      under = false
      ui.letterbox(false)
      ui.hideReveal()
      ui.showContinue(false)
      ui.vignette('#000', 0.35)
      sun.visible = false
      hook.visible = hookLine.visible = false
      ensureHeld()
      aimShot(20)
      director.cut()
      meter = 0
      meterDir = 1
      autoStop = rnd(TM.auto.stopAt[0], TM.auto.stopAt[1])
      refreshLucky()
      setPhase('aim')
    }, RARITIES[bad?.def.rarity ?? 0].color)
    setPhase('return')
  }
  // An animal just landed in the hotbar: end the cast and put the player back on their own base
  // (to place it), instead of returning to the power meter. Auto mode keeps looping.
  function leaveToBase() {
    sfx.wipe()
    ui.wipe(() => {
      ui.letterbox(false)
      ui.hideReveal()
      ui.showContinue(false)
      sun.visible = false
      finishExit()
      director.cut()
      toBase?.()
    }, RARITIES[bad?.def.rarity ?? 0].color)
    setPhase('return')
  }
  function proceed() {
    if (!canContinue) return
    canContinue = false
    sfx.proceed()
    ui.showContinue(false)
    if (phase === 'landed') startBite()
    else if (phase === 'reveal') startCatch()
  }

  // --- Input ---
  function tap() {
    if (phase === 'aim') lockIn()
    else if (phase === 'landed' || phase === 'reveal') proceed()
    else if (phase === 'meet' && bad && (bad.sub === 'wait' || bad.sub === 'under')) bad.skip = true // impatient: hurry the bite
  }
  function toggleAuto() {
    auto = !auto
    ui.setAuto(auto)
    if (auto && phase === 'aim') autoStop = rnd(TM.auto.stopAt[0], TM.auto.stopAt[1])
  }
  function buyLucky() {
    if (phase !== 'aim' || lucky) return
    const price = priceNow()
    if (state.S.luckyCredits > 0) {
      state.S.luckyCredits--
      state.save()
    } else if (!state.spend(price)) {
      sfx.deny()
      toast(`Lucky Cast costs $${Math.round(price).toLocaleString()}. Keep fishing!`, 'warn')
      return
    }
    lucky = true
    sfx.luckyArm()
    ui.flash('#ffe14a', 0.35, 0.4)
    fx.sparkle(hand(tmpA), '#ffe14a', 40, { speed: 6 })
    fx.stars(tmpA, '#7dff4a', 14, 5)
    director.kick(5)
    refreshLucky()
  }

  // --- Per-frame ---
  function updateFlyers(dt) {
    for (let i = flyers.length - 1; i >= 0; i--) {
      const f = flyers[i]
      const b = f.b
      const p = b.group.position
      f.t += dt
      const k = Math.min(1, f.t / 2.1)
      const e = smooth(k)
      p.x = f.from.x + (f.to.x - f.from.x) * e
      p.z = f.from.z + (f.to.z - f.from.z) * e
      p.y = f.from.y + Math.sin(k * Math.PI) * (26 + f.from.distanceTo(f.to) * 0.08) + (f.to.y - f.from.y) * e
      b.group.rotation.y += dt * 9
      if (Math.random() < 0.9) fx.trail(tmpA.set(p.x, p.y + 1, p.z), RARITIES[b.def.rarity].glow)
      b.update(dt)
      if (k >= 1) {
        onCaught.arrive(f.entry, b.def)
        b.dispose()
        flyers.splice(i, 1)
      }
    }
    // Let go: it waves, dives and sinks out of sight.
    for (let i = leavers.length - 1; i >= 0; i--) {
      const a = leavers[i]
      const b = a.b
      const p = b.group.position
      a.t += dt
      b.mode = 'swim'
      p.y -= dt * (0.6 + a.t * 2.5)
      b.update(dt)
      if (a.t < dt * 1.5) fx.chunks(tmpA.set(p.x, WY + 0.3, p.z), ['#ffffff', '#e8fbff'], 14, { power: 0.6, floor: WY - 0.15, size: 0.14 })
      if (p.y < WY - b.height - 1.5) {
        fx.ring(tmpA.set(p.x, WY + 0.05, p.z), '#ffffff', { r0: 0.3, r1: 3, life: 0.8 })
        b.dispose()
        leavers.splice(i, 1)
      }
    }
  }

  function update(rdt, t) {
    // Hit-stop freezes the world for a beat; slow motion scales it.
    let dt = rdt * ts
    if (hitStop > 0) {
      hitStop -= rdt
      dt = rdt * 0.02
    }
    pt += dt
    ribbonUpdate(rdt, t)
    auraUpdate(rdt, t, phase === 'enter' || phase === 'aim' || phase === 'windup' || phase === 'flight')
    swing = Math.max(0, swing - rdt * 3)
    if (phase !== 'windup') lean += (0 - lean) * Math.min(1, rdt * 4)
    if (hopY > 0) {
      hopV -= hopG * rdt
      hopY += hopV * rdt
      if (hopY <= 0) {
        // Landing from the windup jump: a dust ring at your feet.
        hopY = hopV = 0
        const fp = player.renderPosition
        fx.ring(tmpC.set(fp.x, fp.y + 0.06, fp.z), '#ffffff', { r0: 0.3, r1: 2.6, life: 0.4 })
        fx.puff(tmpC, '#efe6d6', 6, { size: 0.5, spread: 1, up: 0.5, life: 0.6, alpha: 0.5 })
        sfx.land?.(0.7)
      }
    }
    updateFlyers(rdt)
    updateStreaks(rdt)
    if (splat.visible) {
      splat.userData.t += rdt
      const k = splat.userData.t
      splat.scale.setScalar(Math.min(2.6, 0.4 + k * 14))
      splat.material.opacity = Math.max(0, 0.7 - k * 0.35)
      if (splat.material.opacity <= 0) splat.visible = false
    }
    const p = player.renderPosition
    if (phase !== 'off') rodUpdate(rdt, t)

    if (phase === 'off') {
      const on = onBand(p)
      if (!on) armed = true
      else if (armed && canEnter()) enter()
      return
    }

    if (phase === 'enter') {
      const k = smooth(Math.min(1, pt / 0.6))
      const x = enterFrom.x + (spot.x - enterFrom.x) * k
      const z = enterFrom.z + (spot.z - enterFrom.z) * k
      const df = Math.atan2(Math.sin(Math.PI - enterFrom.facing), Math.cos(Math.PI - enterFrom.facing))
      place(x, z, enterFrom.facing + df * k)
      ensureHeld()
      hang(held.position, t)
      held.scale.setScalar(Math.max(0.01, easeOutBack(Math.min(1, pt / 0.5))))
      setLine(tip, held.position, 0)
      aimShot(3.5)
      if (pt > 0.75) {
        meter = 0
        meterDir = 1
        autoStop = rnd(TM.auto.stopAt[0], TM.auto.stopAt[1])
        setPhase('aim')
      }
      return
    }

    if (phase === 'aim') {
      const prev = meter
      meter += meterDir * rdt * TM.meterSpeed * 2
      if (meter >= 1) {
        meter = 2 - meter
        meterDir = -1
        sfx.meterTick(true)
      } else if (meter <= 0) {
        meter = -meter
        meterDir = 1
        sfx.meterTick(false)
      }
      ui.setMeter(meter)
      hang(held.position, t)
      setLine(tip, held.position, 0)
      spin.rotation.y += rdt * 1.5
      if (Math.random() < rdt * (lucky ? 30 : 6)) fx.motes(held.position, lucky ? '#ffe14a' : '#ffffff', 1, 0.5, { rise: 0.8, size: lucky ? 0.3 : 0.18 })
      aimShot(5)
      uiT += rdt
      if (uiT > 0.3) {
        uiT = 0
        refreshLucky()
      }
      if (auto && meterDir > 0 && prev < autoStop && meter >= autoStop) lockIn()
      return
    }

    if (phase === 'windup') {
      const k = Math.min(1, pt / Math.min(0.3, windDur))
      lean = show.lean * smooth(k)
      // The bobber trails behind the rod tip as it swings back.
      held.position.lerp(tmpA.set(tip.x, tip.y - TM.rod.hang * (1 - k * 0.6), tip.z + 0.4 * k), Math.min(1, rdt * 18))
      setLine(tip, held.position, 0)
      if (show.hero) {
        heroShot(pt / windDur)
        // Power gathering round you: sparks rising in a ring, the rod tip glinting.
        const c = gradeIdx === 0 || luckyUsed ? RAINBOW_C[((t * 12) | 0) % RAINBOW_C.length] : '#d4ff3a'
        if (Math.random() < rdt * 40) {
          const a = Math.random() * Math.PI * 2
          fx.motes(tmpA.set(p.x + Math.cos(a) * 1.4, p.y + hopY + rnd(0.2, 2.4), p.z + Math.sin(a) * 1.4), c, 1, 0.3, { rise: 1.6, size: 0.26 })
        }
        if (Math.random() < rdt * 14) fx.sparkle(tip, c, 1, { speed: 1.5, up: 0.5, size: 0.35, life: 0.4 })
      } else aimShot(5, 0.9 * smooth(k))
      if (pt >= windDur) launch()
      return
    }

    if (phase === 'flight') {
      const u = Math.min(1, pt / flightDur)
      prevPos.copy(held.position)
      held.position.set(from.x + (to.x - from.x) * u, from.y + (to.y - from.y) * u + 4 * peak * u * (1 - u), from.z + (to.z - from.z) * u)
      spin.rotation.z = Math.sin(t * 9) * 0.3
      spin.rotation.x = Math.sin(t * 7) * 0.3
      const fp = held.position
      setLine(tip, fp, Math.min(2.5, 0.4 + u * 2))
      if (dt > 0) vel.copy(fp).sub(prevPos).divideScalar(dt)
      const speed = Math.hypot(vel.x, vel.z)
      const sk = Math.min(1, speed / 110)
      // Trail and sparkles.
      const zone = zoneAt(fp.z)
      const zc = zone?.color ?? '#ffffff'
      ribbonPush(fp)
      flightDir.copy(vel).multiplyScalar(0.03)
      if (curTrail) emitTrail(fx, curTrail, fp, flightDir, rdt, t, 1)
      else {
        fx.trail(fp, foodColors()[0])
        fx.trail(tmpA.copy(prevPos).lerp(fp, 0.5), '#ffffff')
      }
      // Power: higher rods shed more light; a bait in use sparkles in its own colours.
      if (heldR.fx >= 2 && Math.random() < rdt * heldR.fx * 5) fx.sparkle(fp, heldR.glow, 1 + (heldR.fx >> 2), { speed: 2.5, up: 0.8, size: 0.3 + heldR.fx * 0.03, life: 0.7 })
      if (usedBait && Math.random() < rdt * (6 + FOOD_RARITIES[usedBait.rarity].fx * 5)) fx.sparkle(fp, baitColors(usedBait.id)[(Math.random() * 3) | 0], 1, { speed: 2, up: 0.6, size: 0.3, life: 0.6 })
      if (Math.random() < rdt * 30) fx.sparkle(fp, luckyUsed ? '#ffe14a' : zc, 2, { speed: 1.5, up: 0.5, size: 0.3, life: 0.5 })
      if (!slowed && Math.random() < rdt * (20 + sk * 50)) spawnStreak(tmpA.set(fp.x + rnd(-7, 7), Math.max(FY + 0.5, fp.y + rnd(-3, 4)), fp.z - rnd(18, 45)))
      // Luck climbs with distance.
      luckNow = luckBase * (1 + Math.abs(fp.z - from.z) / TM.luckPerMeters)
      const bump = Math.floor(luckNow) > Math.floor(luckShown)
      luckShown = luckNow
      ui.setLuck(luckNow, bump)
      if (bump && phase === 'flight') director.kick(1.5)
      // Zone banner.
      const zi = zone ? HUB.zones.indexOf(zone) : -1
      if (zi !== zoneIdx && zi >= 0) {
        zoneIdx = zi
        ui.zone(zone.name, zone.banner[0])
        sfx.zoneCross(zi)
        if (zi > 0) {
          ui.flash(zone.color, 0.28, 0.35)
          director.kick(5)
          director.shake(0.12)
          fx.ring(tmpA.set(fp.x, WY + 0.1, fp.z), zone.waterLine ?? zone.color, { r0: 1, r1: 10, life: 0.6 })
        }
      }
      // Slow motion for the last moments.
      const left = (flightDur - pt) / ts
      if (!slowed && flightDur > 1.3 && left < TM.slowMo.last) {
        slowed = true
        ts = TM.slowMo.scale
        sfx.slowmo()
        ui.vignette('#000', 0.55)
        director.kick(-6)
      }
      wind?.set(slowed ? 0.2 : sk)
      ui.setSpeed(slowed ? 0 : Math.min(1, sk * 1.3 - 0.1))
      // Chase camera: behind and above the bobber, looking down the line of flight.
      const c = TM.cam.chase
      const vy = vel.y / Math.max(1, speed)
      const back = (slowed ? c.back * 0.7 : c.back) * (1 + narrow() * 0.4)
      tmpA.set(fp.x * 0.7, Math.max(WY + 1.0, fp.y + c.up - vy * 0.8), fp.z + back)
      tmpB.set(fp.x, fp.y + vy * 2.5, fp.z - 6)
      director.setShot(tmpA, tmpB, slowed ? c.fov - 22 : c.fov, { stiff: pt < 0.25 ? 3 + pt * 30 : Math.min(70, 10 + pt * 120), roll: Math.sin(t * 1.4) * 0.04 })
      if (u >= 1) impact()
      return
    }

    if (phase === 'impact' || phase === 'landed') {
      const fp = held.position
      bobberPhysics(dt, t)
      applySquash(1.25, rdt)
      spin.rotation.z *= 0.9
      spin.rotation.x *= 0.9
      setLine(tip, fp, Math.min(3, throwDist * 0.02))
      // Slow low orbit around the bobber, just above the water.
      orbit += rdt * TM.cam.landed.orbit
      const c = TM.cam.landed
      const a = orbit - 0.35
      tmpA.set(Math.max(-L.river + 0.5, Math.min(L.river - 0.5, fp.x + Math.sin(a) * c.radius)), WY + c.up, fp.z + Math.cos(a) * c.radius)
      tmpB.set(fp.x, WY + 0.35, fp.z)
      director.setShot(tmpA, tmpB, c.fov, { stiff: phase === 'impact' && pt < 0.4 ? 3 : 4 })
      if (Math.random() < rdt * 1.4) fx.ring(tmpC.set(fp.x, WY + 0.04, fp.z), '#ffffff', { r0: 0.25, r1: 1.8, life: 1.1 })
      // Once it has settled, a bite comes straight away (no "continue" prompt here).
      if (phase === 'impact' && settled && pt > 1.0) startBite()
      return
    }

    if (phase === 'meet' && bad) {
      const b = bad.b
      const fp = held.position
      bad.t += dt
      const B = TM.bite
      if (bad.sub === 'wait') {
        // Nibbles: the bobber dips, ripples spread; then it is under.
        bobberPhysics(dt, t)
        applySquash(1.25, rdt)
        setLine(tip, fp, Math.min(3, throwDist * 0.02))
        orbit += rdt * TM.cam.landed.orbit
        const c = TM.cam.landed
        const a = orbit - 0.35
        tmpA.set(Math.max(-L.river + 0.5, Math.min(L.river - 0.5, fp.x + Math.sin(a) * c.radius * 0.8)), WY + c.up * 0.8, fp.z + Math.cos(a) * c.radius * 0.8)
        tmpB.set(fp.x, WY + 0.25, fp.z)
        director.setShot(tmpA, tmpB, c.fov - 4, { stiff: 4 })
        if (bad.t > bad.next && bad.nibbles < B.nibbles) {
          bad.nibbles++
          bad.next = bad.t + rnd(0.45, 0.75)
          vel.y = -2.6
          squash(0.6)
          sfx.plop?.(0.6)
          director.shake(0.06)
          fx.ring(tmpC.set(fp.x, WY + 0.04, fp.z), '#ffffff', { r0: 0.3, r1: 2.6, life: 0.7 })
          fx.chunks(tmpB.set(fp.x, WY + 0.2, fp.z), ['#ffffff', '#e8fbff'], 6, { power: 0.35, floor: WY - 0.15, size: 0.1 })
        }
        if ((bad.nibbles >= B.nibbles && bad.t > bad.next) || bad.skip) {
          bad.skip = false
          startUnder()
        }
        return
      }
      if (bad.sub === 'under') {
        // Under the water, in the animal's eyes: it searches, spots the bait (sonar ping, "!"),
        // swims in with a pounding heart, lunges, and only then do we cut out to see it bite.
        const hk = bad.hook
        const P = B.pov
        if (!bad.bit) bad.u += bad.skip ? dt * 3 : dt // an impatient tap hurries the approach
        const u = bad.u
        const sK = smooth(Math.min(1, u / P.search))
        const ak = Math.min(1, Math.max(0, (u - P.search) / B.swim))
        const k = smooth(ak)
        const lk = Math.min(1, Math.max(0, (u - P.search - B.swim) / P.lunge))
        hook.position.set(hk.x + Math.sin(t * 1.6) * 0.05, hk.y, hk.z)
        hook.rotation.y = Math.sin(t * 0.8) * 0.5
        hookPos.set([fp.x, WY - 0.1, fp.z, hook.position.x, hk.y, hk.z])
        hookGeo.attributes.position.needsUpdate = true
        // Mouth to bait: the head end of the animal arrives just behind the hook (hidden until the bite).
        const reach = b.built.fit * 6
        const tx = hk.x
        const ty = hk.y - 0.4 - b.height * 0.35
        const tz = hk.z - reach
        const bp = b.group.position
        bp.set(bad.start.x + (tx - bad.start.x) * k, bad.start.y + (ty - bad.start.y) * k + Math.sin(bad.t * 3) * 0.08, bad.start.z + (tz - bad.start.z) * k)
        b.group.rotation.y = Math.atan2(tx - bad.start.x, tz - bad.start.z) * (1 - k)
        b.update(dt)

        if (!bad.bit) {
          // The bait swells and glints so it reads from afar, then settles as the animal closes in.
          const pulse = bad.noticed ? 1 + Math.sin(t * 11) * 0.1 : 1
          hook.scale.setScalar((1 + (1 - k) * 1.5) * pulse)
          if (Math.random() < rdt * (bad.noticed ? 9 : 3)) fx.sparkle(tmpC.set(hk.x + rnd(-0.2, 0.3), hk.y - 0.5 + rnd(-0.2, 0.2), hk.z), '#ffffff', 1, { speed: 0.8, up: 0.4, size: 0.28, life: 0.6 })
          // Bubbles streaming past the eyes, plankton drifting in the light.
          const eyeX = bad.start.x + (hk.x - bad.start.x) * k
          const eyeY = bad.start.y + b.height * 0.6 + (hk.y - 0.55 - bad.start.y - b.height * 0.6) * k
          const eyeZ = bad.start.z + (hk.z - 1.3 - bad.start.z) * k
          if (Math.random() < rdt * (10 + k * 22)) fx.themed('bubbles', { x: eyeX + rnd(-1.2, 1.2), y: eyeY + rnd(-0.8, 0.8), z: eyeZ + rnd(0.6, 2.4) }, ['#ffffff', '#bff8ff'], { burst: true })
          if (Math.random() < rdt * 5) fx.motes(tmpC.set(eyeX + rnd(-1.5, 1.5), eyeY + rnd(-1, 1), eyeZ + rnd(1, 4)), '#bff8ff', 1, 1.2, { rise: 0.3 })

          // It notices the bait.
          if (!bad.noticed && u >= P.search) {
            bad.noticed = true
            ui.povSpot()
            ui.povThought('FOOD!')
            sfx.sonar?.()
            director.kick(-9)
            director.shake(0.12)
            ui.flash('#e8ffff', 0.25, 0.3)
            fx.sparkle(tmpC.set(hk.x + 0.07, hk.y - 0.5, hk.z), '#ffffff', 14, { speed: 2.4, up: 0.8, size: 0.34, life: 0.7 })
          }
          // Heart pounding faster as the bait gets close.
          if (bad.noticed) {
            bad.beat -= dt
            if (bad.beat <= 0) {
              bad.beat = P.beatFrom + (P.beatTo - P.beatFrom) * ak
              sfx.heartbeat?.(ak)
              ui.povBeat()
              director.kick(-1.4 - ak * 1.6)
              director.shake(0.03 + ak * 0.05)
            }
            ui.povLevel(Math.min(1, ak * 0.85 + lk * 0.15))
          }
          // The lunge starts.
          if (lk > 0 && !bad.lunged) {
            bad.lunged = true
            ui.povLunge()
            ui.povThought('CHOMP!')
            sfx.lunge?.()
            director.kick(10)
            director.shake(0.3)
            fx.puff(tmpC.set(eyeX, eyeY, eyeZ + 1), '#bff8ff', 6, { size: 0.35, spread: 1 })
          }
          povShot(u, sK, k, lk)
          if (lk >= 1) {
            // The bite: cut out to see it, mouth full of bait.
            bad.bit = true
            bad.bitT = bad.t
            hook.scale.setScalar(1)
            b.group.visible = true
            b.mode = 'feed'
            b.chomp = 1
            ui.pov(false)
            director.cut()
            sfx.chomp?.()
            sfx.notice(0)
            director.shake(0.35)
            director.kick(-6)
            ui.flash('#ffffff', 0.7, 0.3)
            fx.themed('bubbles', { x: hk.x, y: hk.y, z: hk.z }, ['#ffffff'], { burst: true, count: 10 })
            fx.sparkle(tmpC.set(hk.x, hk.y - 0.3, hk.z), '#ffffff', 22, { speed: 3.4, up: 1, size: 0.34, life: 0.55 })
            underShot(60)
          }
        } else {
          if (Math.random() < rdt * 6) fx.themed('bubbles', { x: bp.x + rnd(-0.4, 0.4), y: bp.y + b.height * 0.6, z: bp.z + rnd(-0.4, 0.4) }, ['#ffffff', '#bff8ff'], { burst: true })
          underShot(6)
          b.chomp = Math.max(0, b.chomp - dt * 4)
          if (bad.t - bad.bitT > 0.45) startTug()
        }
        return
      }
      if (bad.sub === 'tug') {
        // Above water again: the bobber is yanked under, the line snaps taut, the water churns.
        const k = Math.min(1, bad.t / B.tug)
        fp.y = WY - 0.15 - k * 0.5 + Math.sin(bad.t * 40) * 0.05
        fp.x += Math.sin(bad.t * 13) * 0.01
        setLine(tip, fp, 0)
        if (Math.random() < rdt * 10) fx.ring(tmpC.set(fp.x, WY + 0.04, fp.z), '#ffffff', { r0: 0.3, r1: 2.4, life: 0.6 })
        if (Math.random() < rdt * 14) fx.chunks(tmpB.set(fp.x + rnd(-0.4, 0.4), WY + 0.15, fp.z + rnd(-0.4, 0.4)), ['#ffffff', '#e8fbff'], 2, { power: 0.4, floor: WY - 0.15, size: 0.1 })
        director.shake(0.04)
        const n = narrow()
        tmpA.set(fp.x + 1.6, WY + 1.4 + n, fp.z + 5.2 * (1 + n * 0.4))
        tmpB.set(fp.x, WY + 0.5, fp.z)
        director.setShot(tmpA, tmpB, 56, { stiff: bad.t < 0.05 ? 60 : 8 })
        if (bad.t > B.tug) startBurst()
        return
      }
      if (bad.sub === 'burst') {
        // It leaps out of the water in a burst of white cubes, then splashes down and floats.
        const bp = b.group.position
        const k = Math.min(1, bad.t / B.burst)
        const sink = sinkOf(b)
        const y0 = WY - b.height
        const top = WY + B.leap
        const rest = WY - sink
        bp.y = k < 0.45 ? y0 + (top - y0) * easeOutBack(k / 0.45) * 0.97 : top + (rest - top) * smooth((k - 0.45) / 0.55)
        b.group.rotation.y = Math.sin(k * Math.PI) * 0.6
        if (k >= 0.95 && !bad.landed) {
          bad.landed = true
          b.mode = 'float'
          sfx.splash?.(0.6)
          director.shake(0.2)
          fx.chunks(tmpB.set(bp.x, WY + 0.3, bp.z), ['#ffffff', '#f2fdff'], 22, { power: 0.8, floor: WY - 0.15, size: 0.18 })
          fx.ring(tmpC.set(bp.x, WY + 0.05, bp.z), '#ffffff', { r0: 0.4, r1: 5, life: 0.7 })
        }
        b.update(dt)
        const n = narrow()
        tmpA.set(bp.x + 0.8, WY + 1.1 + n, bp.z + (3.6 + b.span * 1.2) * (1 + n * 0.45))
        tmpB.set(bp.x, Math.max(WY + 0.6, bp.y + b.height * 0.5), bp.z)
        director.setShot(tmpA, tmpB, 60, { stiff: bad.t < 0.05 ? 60 : 9 })
        if (bad.t > B.burst + 0.3) startReveal()
        return
      }
      return
    }

    if (phase === 'reveal' && bad) {
      const b = bad.b
      bad.t += rdt
      // Turn three-quarters to the camera (+Z), sunburst grows and spins.
      const face = TM.cam.reveal.yaw
      b.group.rotation.y += Math.atan2(Math.sin(face - b.group.rotation.y), Math.cos(face - b.group.rotation.y)) * Math.min(1, rdt * 8)
      const r = bad.def.rarity
      const grow = Math.min(1, bad.t / 0.5)
      sun.scale.setScalar((5 + r * 1.2) * easeOutBack(grow) + Math.sin(t * 3) * 0.2)
      sun.material.opacity = Math.min(0.55 + r * 0.06, grow)
      sun.lookAt(camera.position)
      sun.rotateZ(t * (0.4 + r * 0.08))
      if (Math.random() < rdt * (6 + r * 4)) fx.motes(tmpA.set(b.group.position.x, WY + 0.2, b.group.position.z), RARITIES[r].glow, 1, 1.2, { rise: 2.2 })
      if (Math.random() < rdt * 1.2) fx.ring(tmpC.set(b.group.position.x, WY + 0.04, b.group.position.z), '#ffffff', { r0: 0.5, r1: 2.5, life: 1 })
      if (bad.sub === 'card') {
        if (!canContinue && bad.t > 0.7) {
          canContinue = true
          autoT = 0
          ui.showContinue(true)
        }
        if (canContinue && auto) {
          autoT += rdt
          if (autoT > TM.auto.revealHold) proceed()
        }
      }
      b.update(rdt)
      return
    }

    if (phase === 'catch' && bad) {
      const b = bad.b
      const bp = b.group.position
      bad.t += rdt
      sun.material.opacity = Math.max(0, sun.material.opacity - rdt * 2)
      if (bad.sub === 'liftoff') {
        // A little cheer, then it spins up into a burst of sparkles and its card flies into the
        // hotbar (select it there to carry it and place it in your pen).
        if (bad.t > 0.6 && !bad.launched) {
          bad.launched = true
          bad.y0 = bp.y
          sfx.whoosh()
          director.shake(0.15)
          director.kick(-5)
        }
        if (bad.launched) {
          const k = Math.min(1, (bad.t - 0.6) / 0.35)
          b.group.scale.setScalar(Math.max(0.001, 1 - k * k))
          b.group.rotation.y += rdt * 18
          bp.y = bad.y0 + k * 1.2
          if (k >= 1 && !bad.stored) {
            bad.stored = true
            b.group.visible = false
            const c = tmpA.set(bp.x, WY + 1.4, bp.z)
            fx.sparkle(c, RARITIES[bad.def.rarity].glow, 40, { speed: 6 })
            fx.stars(c, '#ffe14a', 12, 5)
            fx.puff(c, '#ffffff', 10, { size: 0.7, spread: 2 })
            sfx.pop(true)
            onCaught.toHotbar(bad.def)
          }
        }
        tmpA.set(bp.x, WY + 2.2, bp.z + 6.5)
        tmpB.set(bp.x, WY + 1.2, bp.z)
        director.setShot(tmpA, tmpB, 58, { stiff: 4 })
        b.update(rdt)
        if (bad.t > 1.45) {
          b.dispose()
          bad = { ...bad, b: null }
          if (auto) backToAim()
          else leaveToBase()
        }
      } else if (bad.sub === 'shrug') {
        b.update(rdt)
        if (bad.t > 1.1) {
          leavers.push({ b, t: 0 })
          bad = { ...bad, b: null }
          backToAim()
        }
      }
      return
    }
  }

  return {
    update,
    tap,
    exit,
    toggleAuto,
    buyLucky,
    get phase() {
      return phase
    },
    get active() {
      return phase !== 'off'
    },
    get timeScale() {
      return hitStop > 0 ? 0.02 : ts
    },
    // True while the camera is under the water (main.js tints the fog after the sky update).
    get underwater() {
      return under
    },
    onBand,
    // Right arm pose for the avatar: the rod held out in front, cocked back over the shoulder in
    // the windup, whipped forward on the cast, held out while the bobber floats.
    armAngle(t) {
      if (phase === 'off' || phase === 'return') return null
      return armFor(t)
    },
    // Left arm for the big casts (pointing down the river in the windup), null = the rig's own pose.
    armLAngle() {
      if (phase === 'off' || phase === 'return') return null
      return armLFor()
    },
    // Whole-body lean (radians about X; + leans back).
    lean: () => lean,
    // m the body is lifted off the ground (the windup jump of a PERFECT / GREAT cast).
    hop: () => hopY,
  }
}
