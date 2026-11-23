// Every tunable constant lives here; the rest of src/ holds no theme values.

// --- Identity -------------------------------------------------------------
export const GAME_SLUG = 'fish-for-secret-animals' // slug registered on bloxity.io
export const GAME_TITLE = 'Fish for Secret Animals'

// Forces the Bloxity SDK and avatar CDN to be treated as unavailable (see .env.example).
export const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

// --- World (metres: +X east, +Z south, +Y up) -------------------------------
export const GROUND_Y = 0
export const SPAWN = { x: 0, y: 0.05, z: -3 } // in the meadow in front of your own pen, facing the lane
export const SPAWN_FACING = Math.PI // yaw the character faces on spawn (PI = toward -Z = north)

// --- Player modes (modes.js) -------------------------------------------------
// 'character' = third-person chase cam with the avatar on screen.
// 'player' = first-person, the camera is the player's eyes and the avatar is hidden.
export const MODES = ['character', 'player']
export const START_MODE = 'character'

// --- Physics (physics.js, player.js) ------------------------------------------
export const PHYSICS = {
  gravity: -22, // m/s^2 for dynamic bodies and the player
  fixedStep: 1 / 60, // s per physics tick; rendering interpolates between ticks
  maxSubSteps: 5, // a long frame never runs more ticks than this
  walkSpeed: 8, // m/s
  sprintSpeed: 14, // m/s with Shift held
  accel: 70, // m/s^2 toward the target velocity on the ground
  airAccel: 22, // m/s^2 steering while airborne
  decel: 60, // m/s^2 when no key is held
  turnSpeed: 12, // rad/s the body turns toward its heading
  jumpSpeed: 8.5, // m/s
  coyoteTime: 0.1, // s after leaving a ledge a jump still counts
  jumpBuffer: 0.12, // s a jump pressed before landing is remembered
  stepHeight: 0.45, // m autostep
  maxSlope: 50, // degrees the player can walk up
  snapToGround: 0.4, // m the controller stays glued to downward steps and slopes
  pushMass: 80, // kg the character weighs when shoving crates
  killY: -6, // sank this far: respawn
}
export const PLAYER_DIMS = { radius: 0.75, height: 1.8 } // capsule the character controller moves

// --- Look ------------------------------------------------------------------
export const RENDER = { exposure: 1.0 }
export const FOG = { near: 160, far: 600 }
// The two lighting moods lighting.js blends between (key N toggles). The default ("day") is the
// reference look: a twilight sky (deep indigo zenith, violet middle, a red-orange sunset glow and a
// low sun at the far end of the river, orange-lit cloud streaks, stars and sparkle stars), with a
// warm key light and a lavender / peach fill so the bricks, grass and water stay bright and
// saturated. N switches to a deep blue moonlit night.
//   zenith / mid / horizon: sky gradient; glowColor: the horizon sunset glow; sunColor: the disc;
//   disc*: where the disc + glow sit; sun*: where the key light comes from; lightColor: its colour;
//   fog: distance fog colour; cloudLit / cloudDark / clouds: sky cloud streaks; nebula: band
//   strength; puff / puffGlow / puffGlowK: the 3D puff clouds; stars: star opacity.
export const TIME_OF_DAY = {
  transition: 2.5, // s to blend day <-> night
  day: {
    zenith: '#141c7c',
    mid: '#4a3296',
    horizon: '#d8506a',
    glowColor: '#ff6a24',
    sunColor: '#ffb45a',
    discElevation: 4,
    discAzimuth: 180, // the far (north) end of the river
    lightColor: '#ffd9bc',
    sunIntensity: 2.3,
    sunElevation: 48, // degrees above the horizon
    sunAzimuth: 30, // degrees, 0 = from +Z (behind the hub camera, so faces stay lit)
    hemiSky: '#b7b0ff',
    hemiGround: '#e89a78',
    hemiIntensity: 1.05,
    envIntensity: 0.5,
    fog: '#a8507e',
    cloudLit: '#ff8a46',
    cloudDark: '#3b2a72',
    clouds: 1,
    nebula: 0.35,
    puff: '#ffb79a',
    puffGlow: '#ff8a6a',
    puffGlowK: 0.45,
    lampIntensity: 0,
    stars: 0.95,
    exposure: 1.0,
  },
  night: {
    zenith: '#040822',
    mid: '#0d1648',
    horizon: '#24345e',
    glowColor: '#28407e',
    sunColor: '#dfe8ff', // the moon
    discElevation: 32,
    discAzimuth: 160,
    lightColor: '#9fb4ff',
    sunIntensity: 0.6,
    sunElevation: 38,
    sunAzimuth: -60,
    hemiSky: '#4a5c96',
    hemiGround: '#1e1a2e',
    hemiIntensity: 0.5,
    envIntensity: 0.3,
    fog: '#1c2850',
    cloudLit: '#5a6aa8',
    cloudDark: '#141a3a',
    clouds: 0.6,
    nebula: 1,
    puff: '#7a86b8',
    puffGlow: '#3a4a8a',
    puffGlowK: 0.3,
    lampIntensity: 30,
    stars: 1,
    exposure: 1.15,
  },
}
export const LIGHT = {
  shadowRange: 40, // half-width of the sun's shadow box around the player
  lampColor: '#ffb35c',
  lampDistance: 22,
}

// Default (fallback) character look, used only when player.glb cannot load.
export const CHARACTER_COLORS = { skin: '#f2c79a', suit: '#2f6fd0', hair: '#4a2f1c' }

export const MATERIAL_PBR = {
  PLAYER: { roughness: 0.7, metalness: 0 },
  GROUND: { roughness: 0.95, metalness: 0 },
}

// --- Graphics presets, picked by the Bloxity graphics_quality setting ----------
export const GRAPHICS_PRESETS = {
  Low: { shadows: false, shadowMap: 512, antialias: false, dpr: 1, bloom: false, particles: 0.35 },
  Medium: { shadows: true, shadowMap: 1024, antialias: false, dpr: 1.25, bloom: false, particles: 0.6 },
  High: { shadows: true, shadowMap: 2048, antialias: true, dpr: 2, bloom: true, particles: 1 },
  Ultra: { shadows: true, shadowMap: 4096, antialias: true, dpr: 2, bloom: true, particles: 1 },
}

// Bloom (postfx.js): only HDR-bright pixels (above threshold, linear, before
// tone mapping) glow: neon rails, waterfall, VIP gate, particles. Sunlit sand
// stays under the threshold.
export const BLOOM = { strength: 0.6, radius: 0.35, threshold: 2.0 }
// Neon materials (propkit.js): k = HDR colour multiplier with bloom on; with
// bloom off they are capped at plainMax so they stay coloured, not white.
export const NEON = { k: 3.5, plainMax: 1.2 }

// Phones and tablets default to a lighter preset when the portal sends no value,
// and any preset is capped there (a phone at DPR 3 renders 9x the pixels; bloom
// is a full-screen multi-pass blur, so it stays off on phones).
export const COARSE_POINTER = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
export const DEFAULT_GRAPHICS = COARSE_POINTER ? 'Medium' : 'High'
export const MOBILE_GRAPHICS_CAP = { dpr: 1.5, shadowMap: 1024, particles: 0.6 }

// The preset to render with on this device.
export function graphicsPreset(name) {
  const p = GRAPHICS_PRESETS[name] ?? GRAPHICS_PRESETS[DEFAULT_GRAPHICS]
  if (!COARSE_POINTER) return p
  const cap = MOBILE_GRAPHICS_CAP
  return { ...p, dpr: Math.min(p.dpr, cap.dpr), shadowMap: Math.min(p.shadowMap, cap.shadowMap), bloom: false, particles: Math.min(p.particles, cap.particles) }
}

// --- Touch controls (touch.js) --------------------------------------------------
export const TOUCH = {
  deadZone: 0.12, // fraction of the joystick radius that does nothing
  lookScale: 1.5, // touch drag pixels -> look, relative to a mouse pixel
  pinchPixelsPerNotch: 30, // finger spread change that equals one wheel notch
}

// --- Camera (camera.js) -------------------------------------------------------
export const CAMERA = {
  fov: 70,
  near: 0.3, // depth precision scales with near: 0.1 made faces a few cm apart flicker (z-fight) at range
  far: 1200,
  startPitch: 0.32, // radians above the horizon (low chase cam)
  minPitch: -0.35,
  maxPitch: 1.25,
  firstPersonPitch: 1.45, // |pitch| limit looking up/down in player mode
  eyeHeight: 0.92, // eye height as a fraction of player height (player mode)
  distance: 12.4, // resting boom length, m
  minDistance: 2.5, // wheel in past this enters player mode
  maxDistance: 26,
  followLerp: 14, // 1/s: the one smoothing stage, on the point the camera follows
  targetHeight: 1.2, // look-at point as a fraction of player height
  lookSensitivity: 0.0026, // rad per pixel of mouse movement
  zoomStep: 0.9, // m per wheel notch
  zoomEase: 12, // 1/s the zoom glides to its target
  speedFov: 6, // degrees the FOV widens at sprint speed
  speedEase: 3, // 1/s the speed framing eases in and out
  clearEase: 6, // 1/s the boom eases back out once a wall stops blocking it
}

// --- Bloxity (bloxity.js, avatar/) -------------------------------------------------
// SDK setting keys this game listens for; registering a listener makes the control
// appear in the portal's settings menu.
export const SETTINGS = {
  graphics_quality: { def: DEFAULT_GRAPHICS, type: 'enum', values: ['Low', 'Medium', 'High', 'Ultra'] },
  camera_sensitivity: { def: '1', type: 'number', min: 0.1, max: 5 },
  show_fps: { def: 'false', type: 'bool' },
  master_volume: { def: '100', type: 'number', min: 0, max: 100 },
  music_volume: { def: '100', type: 'number', min: 0, max: 100 },
}

// Rewarded ads (ads.js, bloxity.js showRewarded): a button on the HUD offers these; the reward is
// granted only after Bloxity's ad completed AND the server verified the reward token. Rewards are
// Wins / money only (see the root CLAUDE.md). Placements: lowercase letters, digits and hyphens.
export const ADS = {
  cooldownMs: 20000, // the portal also refuses ads that come too soon / past a daily cap ('denied')
  maxBoostMinutes: 60,
  rewards: [
    { id: 'double-income', placement: 'double-income', name: '2x Income', desc: 'Double money for 10 minutes', icon: '💰', minutes: 10 },
    { id: 'cash-boost', placement: 'cash-boost', name: 'Cash Boost', desc: '10 minutes of income, right now', icon: '💵', seconds: 600, min: 500 },
    { id: 'lucky-throw', placement: 'lucky-throw', name: 'Free Lucky Cast', desc: '100x luck on your next cast', icon: '🍀' },
  ],
}

// Remote players (remote.js): how far away they are drawn / animated at full rate (metres).
export const REMOTE = {
  follow: 12, // pose smoothing, 1/s
  farDist: 70, // beyond this the animator ticks at a third of the rate
  labelDist: 60, // name tags
  fxDist: 160, // trails and landing bursts of their throws
  hideDist: 260, // beyond this they are not drawn at all
  poseHz: 10, // how often the local pose is sent
}

// Bloxity leaderboards (bloxity.js, declared once, max 10): the plaza boards read them when the SDK
// answers and fall back to the offline stand-ins (BOARD_BOTS) otherwise.
// Same ids and settings as the backend's LEADERBOARDS (constants.ts): the first declaration is
// permanent, and the server reports the scores of verified players. `stat` is the field of the save the
// plaza board ranks (the server sends the top lists as boards[stat]).
export const LEADERBOARDS = [
  { id: 'best-pull', label: 'Best pull (1 in N)', stat: 'bestOdds', order: 'desc', mode: 'best', format: 'compact', reset: 'none' },
  { id: 'baddies-caught', label: 'Animals caught', stat: 'catches', order: 'desc', mode: 'best', format: 'number', reset: 'none' },
  { id: 'money-per-second', label: 'Money per second', stat: 'income', order: 'desc', mode: 'best', format: 'compact', reset: 'none' },
]

// The base rig, measured from player.glb: origin at the feet, 6.4 units tall at bind pose.
export const RIG_HEIGHT = 6.4
// Bind-pose values of the rig nodes the SDK proportions drive.
export const RIG = { armOffsetX: 2, legOffsetX: 0.6, neckOffsetY: 0.6 }
// getProportions() ranges, straight from the SDK spec; clamped before they reach the scene graph.
export const PROPORTIONS = {
  height: { def: 1, min: 0.5, max: 1.6 },
  shoulderWidth: { def: 1, min: 0.5, max: 1.5 },
  armLength: { def: 1, min: 0.05, max: 3 },
  legOffsetX: { def: 1, min: -0.7, max: 5 },
  torsoScaleX: { def: 1, min: 0.3, max: 2 },
  neckHeight: { def: 1, min: 0.94, max: 1.2 },
  headScale: { def: 1, min: 0.3, max: 2.6 },
}

// Procedural animation (avatar/animator.js), ported from Clean Leaves for Loot.
// Rotations are radians in CHARACTER space: +X swings a limb backward, +Y yaws, +Z rolls.
const deg = (d) => (d * Math.PI) / 180
export const ANIM = {
  airborneDelay: 0.07, // s off the ground before the air pose (ignores a step down a ledge)
  // Walk -> run is one cycle at two depths; phase advances with distance travelled.
  locomotion: {
    minFrequency: 0.7,
    maxFrequency: 3.6,
    strideDistance: 3.8, // m per cycle
    idleSpeed: 0.6,
    walkSpeed: 2.5,
    runSpeed: 8,
    sprintSpeed: 13,
    hipSwing: { walk: deg(22), run: deg(42), sprint: deg(56) },
    kneeBend: { walk: deg(30), run: deg(58), sprint: deg(72) },
    armSwing: { walk: deg(18), run: deg(36), sprint: deg(52) },
    elbowBend: { walk: deg(14), run: deg(44), sprint: deg(70) },
    torsoTwist: { walk: deg(4), run: deg(7), sprint: deg(9) },
    torsoLean: { walk: deg(3), run: deg(10), sprint: deg(18) },
    headCounterTwist: { walk: deg(2), run: deg(4), sprint: deg(5) },
    torsoRoll: { walk: deg(2), run: deg(3), sprint: deg(3) },
    bob: { walk: 0.03, run: 0.07, sprint: 0.09 }, // m, on the avatar root
    bankAngle: deg(9),
    bankRate: 8,
  },
  idle: {
    breathFrequency: 0.35,
    breathAmount: deg(1.8),
    breathBob: 0.007,
    basePose: {
      ArmL1: { x: deg(-4), z: deg(8) },
      ArmL2: { x: deg(12) },
      ArmR1: { x: deg(-4), z: deg(-8) },
      ArmR2: { x: deg(12) },
      LegL1: { x: deg(-4) },
      LegR1: { x: deg(4) },
    },
  },
  airborne: {
    rise: {
      LegL1: { x: deg(-38) }, LegR1: { x: deg(8) }, LegL2: { x: deg(62) }, LegR2: { x: deg(40) },
      ArmL1: { x: deg(-40), z: deg(34) }, ArmR1: { x: deg(-30), z: deg(-34) },
      ArmL2: { x: deg(30) }, ArmR2: { x: deg(30) }, Spine1: { x: deg(6) },
    },
    fall: {
      LegL1: { x: deg(-14) }, LegR1: { x: deg(10) }, LegL2: { x: deg(22) }, LegR2: { x: deg(18) },
      ArmL1: { x: deg(-70), z: deg(40) }, ArmR1: { x: deg(-60), z: deg(-40) },
      ArmL2: { x: deg(20) }, ArmR2: { x: deg(20) }, Spine1: { x: deg(-4) },
    },
    velocityReference: 8, // m/s vertical speed that reads as fully rising / falling
  },
  landing: {
    duration: 0.16,
    pose: {
      LegL1: { x: deg(-34) }, LegR1: { x: deg(-34) }, LegL2: { x: deg(58) }, LegR2: { x: deg(58) },
      ArmL1: { x: deg(-18), z: deg(20) }, ArmR1: { x: deg(-18), z: deg(-20) }, Spine1: { x: deg(14) },
    },
    bobY: -0.2,
  },
  transitions: { toLocomotion: 0.14, toAirborne: 0.12, toLanding: 0.06 }, // s to blend a pose change
}

export const FONT_FAMILY = 'Fredoka'

export function clamp(n, min, max) {
  return n < min ? min : n > max ? max : n
}

// Coerce one raw SDK string against its SETTINGS entry.
export function coerceSetting(key, raw) {
  const spec = SETTINGS[key]
  if (!spec) return raw
  const value = raw === '' || raw == null ? spec.def : raw
  if (spec.type === 'bool') return value === 'true' || value === true
  if (spec.type === 'enum') return spec.values.includes(value) ? value : spec.def
  const n = Number(value)
  return clamp(Number.isFinite(n) ? n : Number(spec.def), spec.min, spec.max)
}

// =====================================================================================
// Throw Food for Baddies: the hub, the lane and the economy
// =====================================================================================
// Metres, +X east, +Z south, north = -Z. The hub is a sunken lego meadow walled in by
// two tiers of grass-topped dirt cliffs. Five fenced pens line the south side (the
// middle one is the player's), the yellow road runs east-west across the north half,
// and the lane opens north between the leaderboards (west) and the sell stall, fuse
// machine and free chest (east).
export const HUB = {
  minX: -58,
  maxX: 58,
  minZ: -30, // north wall (the lane cuts through it)
  maxZ: 34, // south wall
  tierHeight: 7, // m per cliff tier
  tierDepth: [12, 18], // m deep each terrace is, inner to outer
  studTile: 4, // m per ground stud tile (2 x 2 checker cells of 4 x 4 studs)
  road: { z: -16, halfWidth: 2.4, minX: -54, maxX: 54 },
  // The lane is a sunken river canyon: past the casting line its banks drop floorY metres below
  // the hub (a sheer dirt face under the casting band), so you cast down into it. The river
  // channel runs `river` m either side of the centre line, `depth` m deep; its water surface sits
  // `water` m below the banks.
  lane: { halfWidth: 18, start: -30, end: -412, throwLine: -31.5, floorY: -10, river: 12.4, depth: 4.5, water: -0.35 },
  // The themed areas down the lane: filled from AREAS (below) once it exists.
  zones: [],
}

// The five pens ("bases"), west to east. Online, the server assigns each player one (net.js; the
// room holds exactly xs.length players, the backend's BASE_COUNT / ROOM_MAX_CLIENTS: keep them in
// step). playerIndex is the base used offline; the rest are then neighbour plots.
export const PENS = {
  xs: [-42, -21, 0, 21, 42],
  z: 21, // centre
  halfW: 8,
  halfD: 7,
  playerIndex: 2,
  floorHeight: 0.25,
}

// The game server (net.js). Built games reach it through the Bloxity matchmaker
// (Legion.SDK.net.resolveEndpoint, see bloxity.js). Set VITE_SERVER_URL (e.g. ws://localhost:2567)
// to play against a local backend without the SDK; unset and no SDK means offline play.
export const NET = {
  room: 'world', // the backend's room name (WorldRoom)
  serverUrl: import.meta.env.VITE_SERVER_URL || '',
  joinTimeoutMs: 60000, // matchmaker cold starts take up to ~45 s (hosting docs: give up after ~60 s)
  localJoinTimeoutMs: 6000, // a local backend either answers at once or is not running
  rejoinTimeoutMs: 60000,
  retryMs: 500, // first retry delay, doubled up to retryMaxMs
  retryMaxMs: 5000,
  gameLoadMs: 20000, // how long boot waits for the stored progress before playing without saving
  baseWaitMs: 8000, // how long to wait for the server to tell the player their base after joining
}

// Points of interest (walk into a ring to open its window).
export const POI = {
  // The shops everyone shares: a market row on the meadow side of the road, one stall opposite each
  // leaderboard (x = POI.boards), facing south into the meadow; z = the ring in front of each stall.
  foodShop: { x: -16.4, z: -9.2, r: 2.6 }, // Rods & Bait (RODS tab), nearest the river
  baitShop: { x: -25.2, z: -9.2, r: 2.6 }, // Rods & Bait on the BAIT tab
  trailShop: { x: -34, z: -9.2, r: 2.6 },
  padOffset: { x: 5.4, z: -5.2 }, // the Training Bench's upgrade pad, relative to the pen front centre
  gateOffset: { x: 0, z: 0 },
  signOffset: { x: 3.4, z: 0.4 },
  sell: { x: 20, z: -24, r: 2.8 },
  fuse: { x: 29, z: -24.6, r: 2.8 },
  chest: { x: 38.6, z: -25.4, r: 2.6 },
  boards: { x: -34, z: -29.5, gap: 8.8 }, // west-most board, then east by gap
  friendWall: { x: -48, z: -29.6 },
}

// Every player owns one unit: their base (pen) + Training Place. TRAINING.spot is written for the
// middle base (PENS.playerIndex); main.js calls placeUnit() once the server has assigned this
// player a base, which moves it beside that base. Only the local player's own training station is
// built. The Rod / Bait / Trail shops are shared (fixed, by the leaderboards) and never move.
export function placeUnit(baseIndex) {
  const dx = PENS.xs[baseIndex] - PENS.xs[PENS.playerIndex]
  // The ring must stay on the meadow (the east-most base would push it into the cliff).
  const maxX = HUB.maxX - TRAINING.ringR - 1.2
  TRAINING.spot.x = Math.min(TRAINING.spot.x + dx, maxX)
}

export const RARITIES = [
  { name: 'Common', color: '#e4e7ec', glow: '#ffffff', card: ['#c9ced8', '#5d6474'] },
  { name: 'Uncommon', color: '#69e05a', glow: '#7dff6a', card: ['#7fe060', '#245a1c'] },
  { name: 'Rare', color: '#3fa6ff', glow: '#4fb8ff', card: ['#4fb4ff', '#123a6a'] },
  { name: 'Epic', color: '#c27dff', glow: '#c27dff', card: ['#b46aff', '#3a1466'] },
  { name: 'Legendary', color: '#ffc21f', glow: '#ffd34f', card: ['#ffc23a', '#6a3a08'] },
  { name: 'Mythic', color: '#ff4f5e', glow: '#ff6a7a', card: ['#ff5a4a', '#5a0a14'] },
  { name: 'Secret', color: '#2ef2d0', glow: '#7ffce0', card: ['#2ed8c0', '#0a3a3a'] },
  { name: 'Divine', color: '#fff3c4', glow: '#fff6d8', card: ['#fff6e0', '#a8b8d8'], shimmer: true },
  { name: 'Celestial', color: '#8a7aff', glow: '#a99cff', card: ['#7a5cff', '#1a0f4a'], shimmer: true },
  { name: 'Eternal', color: '#ff7af2', glow: '#ffffff', card: ['#3a3450', '#08070e'], shimmer: true },
]

// --- Areas and their girls --------------------------------------------------------------------
// The lane is split into twelve themed areas, near to far. Each has its floor colours, the
// props along its walls (`cover`: the girls step out from behind them), a gate banner, the
// particles that drift through it (`fx`, also around its girls in your pen) and ten girls.
// A girl's slot (0..9, her place in the area's list) sets her rarity (RARITY_SLOTS + one step
// every three areas), her catch odds (SLOT_ODDS, a little longer each area) and her income
// (AREA_INCOME(area) x SLOT_INCOME). Short keys: n name, hs hair style, hc / h2 hair colour /
// highlight, sk skin, e eyes, o outfit, t top, b bottom, a accent, sh shoes, hat, ew eyewear,
// nk neckwear, w wings, tl tail, hd held item (each with a ...C colour), glow = shining aura.
export const RARITY_SLOTS = [0, 0, 1, 1, 2, 2, 3, 4, 5, 6]
export const SLOT_ODDS = [2, 3, 5, 9, 16, 28, 60, 150, 500, 2000]
export const SLOT_INCOME = [1, 1.5, 2.2, 3.2, 5, 8, 13, 22, 40, 80]
export const AREA_INCOME = (a) => 2 * Math.pow(2.2, a)
export const INDEX_BONUS = 0.05 // +5% income for every area whose Index page is complete

export const AREAS = [
  {
    id: 'meadow', name: 'Lily Pond', color: '#6fdc3c', alt: '#63d132', banner: ['#7be04a', '#2f8f2a'], water: '#1fc0c8', waterLine: '#a8fbf4', text: '#ffffff',
    cover: ['tree', 'bush', 'flowerBush'], fx: 'petals', fxColors: ['#ffffff', '#ffd6e8', '#fff27a', '#ffb3d9'], dust: '#cfeeb8',
    girls: [
      { n: 'Duck', k: 'duck', c: '#b8461e', c2: '#2f9a3a', c3: '#ffc21f' },
      { n: 'Pond Frog', k: 'frog', c: '#5fc23a', c2: '#e8f7a0', c3: '#2f7a2a' },
      { n: 'Goldfish', k: 'fish', c: '#ff8a1a', c2: '#ffd23a', c3: '#ff5a1a' },
      { n: 'Mud Turtle', k: 'turtle', c: '#6a8a3a', c2: '#9acd5a', c3: '#4a5a2a' },
      { n: 'Duckling', k: 'duck', c: '#ffe14a', c2: '#ffe14a', c3: '#ff8a1a' },
      { n: 'Koi', k: 'fish', c: '#ffffff', c2: '#ff5a1a', c3: '#ff8a5a', x: 'spots' },
      { n: 'Lily Toad', k: 'frog', c: '#ff9ad8', c2: '#fff0f8', c3: '#ff5fa8', x: 'spots' },
      { n: 'Swan', k: 'swan', c: '#ffffff', c2: '#f4f4f8', c3: '#ff8a1a' },
      { n: 'Golden Carp', k: 'fish', c: '#ffc21f', c2: '#fff2a0', c3: '#ff8a1a', x: 'crown' },
      { n: 'Pond Spirit', k: 'axolotl', c: '#c8f0ff', c2: '#ffffff', c3: '#ff9ad8', x: 'halo glow' },
    ],
  },
  {
    id: 'farm', name: 'Farm Creek', color: '#e8cf6a', alt: '#dcc25c', banner: ['#ff8a3a', '#a83a1a'], water: '#38c8c0', waterLine: '#c8fff0', text: '#fff6d8',
    cover: ['hay', 'crate', 'corn'], fx: 'wheat', fxColors: ['#ffd85a', '#f0c040', '#fff2a0'], dust: '#f2e0a0',
    girls: [
      { n: 'Brown Duck', k: 'duck', c: '#8b5a33', c2: '#6b4226', c3: '#ffb02a' },
      { n: 'Bullfrog', k: 'frog', c: '#6a8a2a', c2: '#e8e0a0', c3: '#3a4a1a' },
      { n: 'Catfish', k: 'fish', c: '#7a6a5a', c2: '#c8b8a0', c3: '#4a3a2a', x: 'whiskers' },
      { n: 'Snapper', k: 'turtle', c: '#5a4a2a', c2: '#8a7a4a', c3: '#3a2a1a', x: 'spikes' },
      { n: 'Goose', k: 'swan', c: '#c8ccd4', c2: '#ffffff', c3: '#ff8a1a' },
      { n: 'Trout', k: 'fish', c: '#8ab06a', c2: '#ff9a9a', c3: '#5a7a3a', x: 'spots' },
      { n: 'Hay Otter', k: 'otter', c: '#b8743a', c2: '#f0d8a8', c3: '#5a3a1a', x: 'straw' },
      { n: 'Sunny Duck', k: 'duck', c: '#ffb02a', c2: '#ffd23a', c3: '#ff5a1a' },
      { n: 'Harvest Toad', k: 'frog', c: '#e8a83a', c2: '#fff2a0', c3: '#8a5a1a', x: 'crown' },
      { n: 'Golden Goose', k: 'swan', c: '#ffd23a', c2: '#fff2a0', c3: '#ff8a1a', x: 'crown glow' },
    ],
  },
  {
    id: 'lake', name: 'Willow Lake', color: '#8fe0c0', alt: '#80d4b2', banner: ['#4fc8ff', '#1a6aa0'], water: '#24b8e0', waterLine: '#c8f4ff', text: '#ffffff',
    cover: ['willow', 'reeds', 'lilyRock'], fx: 'fireflies', fxColors: ['#e8ff7a', '#b8ff6a', '#fff6a0'], dust: '#c8f0e0',
    girls: [
      { n: 'Lake Otter', k: 'otter', c: '#7a4a2a', c2: '#d8b890', c3: '#3a2414' },
      { n: 'Pike', k: 'fish', c: '#5a8a3a', c2: '#e8f0c0', c3: '#3a5a2a', x: 'stripes' },
      { n: 'Spotted Frog', k: 'frog', c: '#3ab06a', c2: '#e8ffd8', c3: '#1a5a3a', x: 'spots' },
      { n: 'Blue Duck', k: 'duck', c: '#3a6ad0', c2: '#2a3a8a', c3: '#ffc21f' },
      { n: 'Lake Turtle', k: 'turtle', c: '#2a8a6a', c2: '#a0e0a0', c3: '#1a4a3a' },
      { n: 'Axolotl', k: 'axolotl', c: '#ffb3d9', c2: '#fff0f8', c3: '#ff5fa8' },
      { n: 'Willow Seahorse', k: 'seahorse', c: '#8ad04a', c2: '#e8ffc0', c3: '#4a8a2a' },
      { n: 'Silver Swan', k: 'swan', c: '#d8e0f0', c2: '#ffffff', c3: '#3a3a4a', x: 'crown' },
      { n: 'Moon Koi', k: 'fish', c: '#e8f0ff', c2: '#8ab0ff', c3: '#c8d8ff', x: 'spots glow' },
      { n: 'Lake Guardian', k: 'otter', c: '#3a6ad0', c2: '#c8e0ff', c3: '#ffd23a', x: 'crown halo glow' },
    ],
  },
  {
    id: 'desert', name: 'Desert Oasis', color: '#f2d28c', alt: '#e8c57a', banner: ['#ffb84a', '#a85a1a'], water: '#30d0c0', waterLine: '#e0fff4', text: '#fff6d8',
    cover: ['cactus', 'mesaRock', 'deadBush'], fx: 'sand', fxColors: ['#f2d28c', '#e8b870', '#fff0c0'], dust: '#f2d8a0',
    girls: [
      { n: 'Sand Turtle', k: 'turtle', c: '#d8b070', c2: '#f2d8a0', c3: '#8a6a3a' },
      { n: 'Oasis Frog', k: 'frog', c: '#e8c84a', c2: '#fff6c0', c3: '#8a6a1a' },
      { n: 'Desert Crab', k: 'crab', c: '#e8823a', c2: '#ffd8a0', c3: '#a84a1a' },
      { n: 'Mirage Fish', k: 'fish', c: '#3ad0c0', c2: '#e0fff8', c3: '#ffd23a' },
      { n: 'Sand Croc', k: 'croc', c: '#c8a060', c2: '#f2e0b0', c3: '#6a4a2a' },
      { n: 'Sun Axolotl', k: 'axolotl', c: '#ffd23a', c2: '#fff6c0', c3: '#ff8a1a' },
      { n: 'Scarab Crab', k: 'crab', c: '#2a6ad0', c2: '#3ad0c0', c3: '#ffd23a', x: 'shiny' },
      { n: 'Oasis Swan', k: 'swan', c: '#3ad0c0', c2: '#e0fff8', c3: '#ffd23a' },
      { n: 'Mirage Seahorse', k: 'seahorse', c: '#ff9a3a', c2: '#ffe0a0', c3: '#ff5a1a', x: 'glow' },
      { n: 'Pharaoh Croc', k: 'croc', c: '#ffd23a', c2: '#2a6ad0', c3: '#ffffff', x: 'crown glow' },
    ],
  },
  {
    id: 'snow', name: 'Frozen River', color: '#f4fbff', alt: '#e2f0fa', banner: ['#9fe0ff', '#3a7ad0'], water: '#7ad8f0', waterLine: '#ffffff', text: '#ffffff',
    cover: ['pine', 'snowMound', 'iceBlock'], fx: 'snow', fxColors: ['#ffffff', '#e8f6ff', '#c8ecff'], dust: '#ffffff',
    girls: [
      { n: 'Penguin', k: 'penguin', c: '#2a2a3a', c2: '#ffffff', c3: '#ffb02a' },
      { n: 'Seal', k: 'seal', c: '#9aa2ae', c2: '#d8dde6', c3: '#3a3a4a' },
      { n: 'Ice Fish', k: 'fish', c: '#bfeaff', c2: '#ffffff', c3: '#7ac8f2' },
      { n: 'Snow Duck', k: 'duck', c: '#ffffff', c2: '#e8f4ff', c3: '#ffb02a' },
      { n: 'Walrus', k: 'seal', c: '#a8744a', c2: '#d8a878', c3: '#ffffff', x: 'tusks' },
      { n: 'Frost Turtle', k: 'turtle', c: '#7ac8f2', c2: '#e0f4ff', c3: '#3a8ad0', x: 'spikes' },
      { n: 'Polar Otter', k: 'otter', c: '#f4f8ff', c2: '#ffffff', c3: '#3a4a5a' },
      { n: 'Narwhal', k: 'whale', c: '#8a9ab8', c2: '#e0e8f4', c3: '#fff6e0', x: 'horn' },
      { n: 'Emperor Penguin', k: 'penguin', c: '#1a2a4a', c2: '#ffffff', c3: '#ffd23a', x: 'crown' },
      { n: 'Frost Spirit', k: 'jelly', c: '#bfeaff', c2: '#ffffff', c3: '#7ae8ff', x: 'halo glow' },
    ],
  },
  {
    id: 'autumn', name: 'Maple Stream', color: '#f0a24a', alt: '#e6923c', banner: ['#ff8a3a', '#8a2a1a'], water: '#3ab0c8', waterLine: '#ffe8c8', text: '#fff0d8',
    cover: ['autumnTree', 'pumpkin', 'redBush'], fx: 'leaves', fxColors: ['#ff8a2a', '#e8502a', '#ffc23a', '#c8401a'], dust: '#f0c890',
    girls: [
      { n: 'Maple Duck', k: 'duck', c: '#e8823a', c2: '#a83a1a', c3: '#ffd23a' },
      { n: 'Acorn Turtle', k: 'turtle', c: '#8a5a2a', c2: '#d8a868', c3: '#5a3a1a' },
      { n: 'Leaf Frog', k: 'frog', c: '#ff8a2a', c2: '#ffe0a0', c3: '#a83a1a' },
      { n: 'Salmon', k: 'fish', c: '#ff8a6a', c2: '#ffd8c8', c3: '#c84a3a' },
      { n: 'Fox Otter', k: 'otter', c: '#ff7a2a', c2: '#ffffff', c3: '#3a2414' },
      { n: 'Pumpkin Crab', k: 'crab', c: '#ff8a1a', c2: '#ffd08a', c3: '#3a8a2a' },
      { n: 'Bronze Carp', k: 'fish', c: '#c87a3a', c2: '#f0c08a', c3: '#8a4a1a', x: 'shiny' },
      { n: 'Autumn Swan', k: 'swan', c: '#ffd8a0', c2: '#ffffff', c3: '#c84a1a', x: 'crown' },
      { n: 'Harvest Seahorse', k: 'seahorse', c: '#ffb02a', c2: '#fff2a0', c3: '#c84a1a', x: 'glow' },
      { n: 'Ember Koi', k: 'fish', c: '#ff5a1a', c2: '#ffd23a', c3: '#ffffff', x: 'spots crown glow' },
    ],
  },
  {
    id: 'crystal', name: 'Crystal Falls', color: '#9fe8ff', alt: '#8adcf5', banner: ['#7ae8ff', '#3a5ad0'], water: '#5ad8ff', waterLine: '#ffffff', text: '#ffffff',
    cover: ['crystals', 'blueRock', 'crystals'], fx: 'gems', fxColors: ['#7ae8ff', '#c8a0ff', '#ff9bd2', '#ffffff'], dust: '#d8f6ff',
    girls: [
      { n: 'Crystal Crab', k: 'crab', c: '#9fe8ff', c2: '#ffffff', c3: '#3a8ad0' },
      { n: 'Gem Fish', k: 'fish', c: '#c8a0ff', c2: '#ffffff', c3: '#7a4bff' },
      { n: 'Quartz Turtle', k: 'turtle', c: '#ff9bd2', c2: '#fff0f8', c3: '#c84a8a', x: 'spikes' },
      { n: 'Prism Frog', k: 'frog', c: '#7ae8ff', c2: '#ffffff', c3: '#ff9bd2' },
      { n: 'Glass Jelly', k: 'jelly', c: '#c8f0ff', c2: '#ffffff', c3: '#7ae8ff' },
      { n: 'Amethyst Axolotl', k: 'axolotl', c: '#b07cff', c2: '#e6d8ff', c3: '#ff9bf0' },
      { n: 'Diamond Duck', k: 'duck', c: '#e0f8ff', c2: '#7ae8ff', c3: '#ffffff', x: 'shiny' },
      { n: 'Crystal Seahorse', k: 'seahorse', c: '#7ae8ff', c2: '#ffffff', c3: '#c8a0ff', x: 'glow' },
      { n: 'Geode Croc', k: 'croc', c: '#6a4ab0', c2: '#ff9bd2', c3: '#7ae8ff', x: 'spikes glow' },
      { n: 'Crystal Wyrm', k: 'croc', c: '#9fe8ff', c2: '#ffffff', c3: '#c8a0ff', x: 'wings horn glow' },
    ],
  },
  {
    id: 'beach', name: 'Sunset Bay', color: '#ffd2a0', alt: '#f8c28c', banner: ['#ff7a5a', '#a02a6a'], water: '#3ac0e0', waterLine: '#ffe8d0', text: '#fff0d8',
    cover: ['palm', 'umbrella', 'sandcastle'], fx: 'sunset', fxColors: ['#ffb05a', '#ff7a8a', '#ffe08a'], dust: '#ffe0b8',
    girls: [
      { n: 'Beach Crab', k: 'crab', c: '#e83a2a', c2: '#ffb08a', c3: '#8a1a1a' },
      { n: 'Seagull', k: 'duck', c: '#ffffff', c2: '#c8ccd4', c3: '#ffd23a' },
      { n: 'Sea Turtle', k: 'turtle', c: '#3a8a6a', c2: '#c8e0a0', c3: '#1a4a3a' },
      { n: 'Clownfish', k: 'fish', c: '#ff7a1a', c2: '#ffffff', c3: '#1a1a1a', x: 'stripes' },
      { n: 'Dolphin', k: 'dolphin', c: '#7a9ac0', c2: '#e0e8f4', c3: '#4a6a90' },
      { n: 'Sunset Seal', k: 'seal', c: '#ff9a6a', c2: '#ffe0c8', c3: '#a84a3a' },
      { n: 'Flamingo Swan', k: 'swan', c: '#ff8ac0', c2: '#ffd6ea', c3: '#1a1a1a' },
      { n: 'Golden Dolphin', k: 'dolphin', c: '#ffc21f', c2: '#fff2a0', c3: '#ff8a1a', x: 'shiny' },
      { n: 'Sun Turtle', k: 'turtle', c: '#ff8a2a', c2: '#ffe680', c3: '#ff3a3a', x: 'crown glow' },
      { n: 'Sunset Whale', k: 'whale', c: '#ff7a5a', c2: '#ffd2a0', c3: '#a02a6a', x: 'halo glow' },
    ],
  },
  {
    id: 'reef', name: 'Coral Reef', color: '#3fc4d8', alt: '#34b6cc', banner: ['#3ad0ff', '#1a3a8a'], water: '#1aa8e0', waterLine: '#9ff0ff', text: '#ffffff',
    cover: ['coral', 'seaweed', 'coral'], fx: 'bubbles', fxColors: ['#c8f8ff', '#ffffff', '#a0e8ff'], dust: '#c8f8ff',
    girls: [
      { n: 'Reef Fish', k: 'fish', c: '#3a6aff', c2: '#ffd23a', c3: '#1a3aa0' },
      { n: 'Pufferfish', k: 'fish', c: '#f2d28c', c2: '#ffffff', c3: '#8a6a3a', x: 'spikes round' },
      { n: 'Octopus', k: 'octopus', c: '#ff5a8a', c2: '#ffd6e0', c3: '#a82a4a' },
      { n: 'Reef Shark', k: 'shark', c: '#7a8aa0', c2: '#ffffff', c3: '#4a5a70' },
      { n: 'Seahorse', k: 'seahorse', c: '#ffb02a', c2: '#fff2a0', c3: '#ff5a1a' },
      { n: 'Coral Crab', k: 'crab', c: '#ff7aa8', c2: '#ffffff', c3: '#c82a6a', x: 'spikes' },
      { n: 'Blue Tang', k: 'fish', c: '#2a5aff', c2: '#ffd23a', c3: '#0a1a6a', x: 'stripes' },
      { n: 'Sea Dragon', k: 'seahorse', c: '#3ad0a0', c2: '#ffd23a', c3: '#ff5a8a', x: 'wings glow' },
      { n: 'Reef Queen', k: 'octopus', c: '#b04aff', c2: '#ffd6f0', c3: '#ffd23a', x: 'crown glow' },
      { n: 'Pearl Whale', k: 'whale', c: '#e8f0ff', c2: '#ffffff', c3: '#ff9ad8', x: 'halo glow shiny' },
    ],
  },
  {
    id: 'heaven', name: 'Cloud Springs', color: '#fffaf0', alt: '#f3ecdc', banner: ['#fff0b0', '#c89a3a'], water: '#9ae8ff', waterLine: '#ffffff', text: '#ffffff',
    cover: ['cloud', 'pillar', 'cloud'], fx: 'feathers', fxColors: ['#ffffff', '#fff6d8', '#ffe8a0'], dust: '#ffffff',
    girls: [
      { n: 'Cloud Duck', k: 'duck', c: '#ffffff', c2: '#f0f4ff', c3: '#ffd23a', x: 'halo' },
      { n: 'Sky Fish', k: 'fish', c: '#9fd8ff', c2: '#ffffff', c3: '#ffd23a', x: 'wings' },
      { n: 'Angel Frog', k: 'frog', c: '#fff6e0', c2: '#ffffff', c3: '#ffd23a', x: 'halo wings' },
      { n: 'Cloud Jelly', k: 'jelly', c: '#ffffff', c2: '#fff6e0', c3: '#ffd23a' },
      { n: 'Sky Dolphin', k: 'dolphin', c: '#c8e8ff', c2: '#ffffff', c3: '#ffd23a', x: 'wings' },
      { n: 'Halo Turtle', k: 'turtle', c: '#ffe680', c2: '#ffffff', c3: '#c89a3a', x: 'halo' },
      { n: 'Seraph Swan', k: 'swan', c: '#ffffff', c2: '#fff6d8', c3: '#ffd23a', x: 'halo wings glow' },
      { n: 'Star Seahorse', k: 'seahorse', c: '#fff0b0', c2: '#ffffff', c3: '#ffd23a', x: 'glow' },
      { n: 'Heaven Whale', k: 'whale', c: '#fffaf0', c2: '#ffffff', c3: '#ffd23a', x: 'wings halo glow' },
      { n: 'Divine Koi', k: 'fish', c: '#ffffff', c2: '#ffd23a', c3: '#ff9ad8', x: 'spots halo wings glow' },
    ],
  },
  {
    id: 'lava', name: 'Lava Lake', color: '#5a2a24', alt: '#4a201c', banner: ['#ff5a1a', '#5a0a0a'], water: '#ff6a1a', waterLine: '#ffe060', text: '#ffe0a0',
    cover: ['obsidian', 'charTree', 'lavaRock'], fx: 'embers', fxColors: ['#ff7a1a', '#ffcc33', '#ff3a1a'], dust: '#5a4a48',
    girls: [
      { n: 'Magma Crab', k: 'crab', c: '#3a2a2a', c2: '#ff5a1a', c3: '#ffcc33' },
      { n: 'Lava Frog', k: 'frog', c: '#e83a1a', c2: '#ffcc33', c3: '#3a1a1a' },
      { n: 'Ember Fish', k: 'fish', c: '#ff5a1a', c2: '#ffcc33', c3: '#8a1a0a', x: 'glow' },
      { n: 'Obsidian Turtle', k: 'turtle', c: '#2a2030', c2: '#ff6a1a', c3: '#ffcc33', x: 'spikes' },
      { n: 'Salamander', k: 'axolotl', c: '#ff3a1a', c2: '#ffcc33', c3: '#ff8a1a', x: 'spots' },
      { n: 'Volcano Croc', k: 'croc', c: '#4a2420', c2: '#ff6a1a', c3: '#ffcc33', x: 'spikes' },
      { n: 'Lava Shark', k: 'shark', c: '#3a2a2a', c2: '#ff5a1a', c3: '#ffcc33', x: 'glow' },
      { n: 'Inferno Octopus', k: 'octopus', c: '#ff3a1a', c2: '#ffcc33', c3: '#2a1010', x: 'glow' },
      { n: 'Phoenix Duck', k: 'duck', c: '#ff5a1a', c2: '#ffcc33', c3: '#ffffff', x: 'wings crown glow' },
      { n: 'Magma Leviathan', k: 'whale', c: '#2a1a1a', c2: '#ff5a1a', c3: '#ffcc33', x: 'horn spikes glow' },
    ],
  },
  {
    id: 'cosmic', name: 'Cosmic Sea', color: '#3a2a6a', alt: '#30225c', banner: ['#b04aff', '#1a0a4a'], water: '#6a3aff', waterLine: '#3affff', text: '#e0f8ff',
    cover: ['alienCrystal', 'alienPlant', 'meteor'], fx: 'stars', fxColors: ['#ffffff', '#b07cff', '#3affff', '#ff9bf0'], dust: '#8a7aff',
    girls: [
      { n: 'Star Jelly', k: 'jelly', c: '#b07cff', c2: '#ffffff', c3: '#3affff' },
      { n: 'Space Fish', k: 'fish', c: '#3a2a8a', c2: '#3affff', c3: '#ff5fd2', x: 'glow' },
      { n: 'Alien Frog', k: 'frog', c: '#7dff4a', c2: '#e0ffd0', c3: '#b04aff', x: 'horn' },
      { n: 'Comet Seahorse', k: 'seahorse', c: '#3affff', c2: '#ffffff', c3: '#b04aff', x: 'glow' },
      { n: 'Nebula Octopus', k: 'octopus', c: '#7a4bff', c2: '#ff5fd2', c3: '#3affff', x: 'spots glow' },
      { n: 'Void Shark', k: 'shark', c: '#1a1030', c2: '#b04aff', c3: '#3affff', x: 'glow' },
      { n: 'Galaxy Turtle', k: 'turtle', c: '#2a1a5a', c2: '#ff5fd2', c3: '#3affff', x: 'spots glow' },
      { n: 'Cosmic Whale', k: 'whale', c: '#3a2a8a', c2: '#b04aff', c3: '#3affff', x: 'spots halo glow' },
      { n: 'Astro Axolotl', k: 'axolotl', c: '#ff5fd2', c2: '#ffffff', c3: '#3affff', x: 'halo wings glow' },
      { n: 'Omega Kraken', k: 'octopus', c: '#1a0a3a', c2: '#b04aff', c3: '#3affff', x: 'crown halo horn glow' },
    ],
  },
]

const niceRound = (v) => {
  if (v < 10) return Math.round(v)
  const p = Math.pow(10, Math.floor(Math.log10(v)) - 1)
  return Math.round(v / p) * p
}
// Every animal, flattened: { id, name, area, slot, rarity, odds, income, look }.
// An animal's look from its short keys: k body plan (game/baddieModel.js KINDS: duck, frog, fish,
// turtle, crab, penguin, seal, otter, octopus, jelly, shark, dolphin, whale, axolotl, swan, croc,
// seahorse), c main colour, c2 second colour (belly / head / pattern), c3 accent (beak, fins,
// claws), x extras (any of: crown halo horn wings spots stripes spikes tusks whiskers straw shiny
// round glow). `place` = { fx, fxColors } for its particles.
const lookOf = (g, _i, place) => {
  const x = new Set((g.x ?? '').split(/\s+/).filter(Boolean))
  return { kind: g.k, main: g.c, second: g.c2 ?? g.c, accent: g.c3 ?? '#ffd23a', extras: x, glow: x.has('glow'), fx: place.fx, fxColors: place.fxColors }
}
// Every lane girl, flattened (see above).
export const BADDIES = AREAS.flatMap((area, ai) => {
  const shift = Math.floor(ai / 3)
  return area.girls.map((g, slot) => ({
    id: `${area.id}_${g.n.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
    name: g.n,
    area: ai,
    slot,
    rarity: Math.min(RARITIES.length - 1, RARITY_SLOTS[slot] + shift),
    odds: niceRound(SLOT_ODDS[slot] * (1 + ai * 0.35)),
    income: niceRound(AREA_INCOME(ai) * SLOT_INCOME[slot]),
    look: lookOf(g, ai * 7 + slot * 3, area),
  }))
})
// The lane areas as z ranges: twelve equal stretches from the lane mouth to its far end.
{
  const L = HUB.lane
  const len = (L.end + 2 - L.start) / AREAS.length
  AREAS.forEach((a, i) => {
    HUB.zones.push({ ...a, index: i, from: L.start + i * len, to: i === AREAS.length - 1 ? L.end - 30 : L.start + (i + 1) * len })
  })
}

// Ids from the first version of the game (one flat list of 18) -> the girl they became.
export const LEGACY_IDS = {} // none: a new game
const _OLD_IDS = {
  pip: 'meadow_daisy', momo: 'meadow_clover', taffy: 'meadow_bunnie', juniper: 'meadow_ladybell', kiki: 'farm_cinna', bolt: 'meadow_honey',
  sable: 'lake_rowan', coral: 'beach_flamina', nova: 'lake_libelle', vexa: 'lava_cerbie', mirage: 'desert_mirage', rune: 'snow_borea',
  solara: 'desert_solara', onyx: 'cosmic_nyx', frostine: 'snow_glacia', cosmia: 'cosmic_nebby', emberqueen: 'lava_pyra', glitchling: 'cosmic_cyra',
}

// Size steps a fuse climbs: three of one size make one of the next.
export const SIZES = [
  { name: '', scale: 1, mult: 1 },
  { name: 'BIG', scale: 1.4, mult: 4 },
  { name: 'HUGE', scale: 2, mult: 20 },
  { name: 'GIANT', scale: 2.5, mult: 100 },
  { name: 'TITAN', scale: 3, mult: 500 },
]

// Variants: a rare shiny version of any girl, rolled on every catch (`v` on a pen / hotbar
// entry). chance = 1 in N before boosts (the featured-area event multiplies it). Fusing needs
// three of the same girl, size AND variant; the result keeps the variant.
export const VARIANTS = [
  { name: '', mult: 1, chance: 0 },
  { name: 'GOLD', mult: 2, chance: 20, color: '#ffd23a', glow: '#ffe680' },
  { name: 'DIAMOND', mult: 5, chance: 200, color: '#7ae8ff', glow: '#c8f6ff' },
  { name: 'RAINBOW', mult: 15, chance: 2000, color: '#ff7af2', glow: '#ffffff', rainbow: true },
]

// Live events (game/events.js). All of them run on the UTC clock, so every player sees the same
// ones at the same time without a server. Money / Wins / earned tickets only: no premium currency.
export const EVENTS = {
  luckHour: { every: 60, length: 10, luck: 2 }, // the first `length` minutes of every hour: luck x2
  weekend: { income: 2 }, // Saturday and Sunday (UTC): income x2
  featured: { every: 30, luck: 1.5, variant: 3 }, // one area at a time: luck x1.5, variants x3 as likely
  // The Hungry Giant (game/boss.js; the server counts a room's throws): turns up at these minutes
  // past every hour for `length` minutes; every throw anyone in the room makes feeds her.
  boss: { at: [20, 50], length: 4, needPerPlayer: 8, rewardSecs: 60, perThrowSecs: 10, maxSecs: 180, tickets: 10 },
}

// Seasonal events: one theme at a time, `days` long each, cycling from `anchor` (UTC ms). While a
// season runs, a throw sometimes brings one of its girls out instead of a lane girl (`chance` =
// 1 in N), every throw pays `ticketsPerThrow` Event Tickets and a season girl pays `ticketsPerGirl`.
// Tickets are earned only (never bought) and are spent in the event shop (EVENT_SHOP).
export const SEASON = { anchor: Date.UTC(2026, 0, 5), days: 14, chance: 18, ticketsPerThrow: 1, ticketsPerGirl: 5 }
// A season girl earns like a girl of the area she was caught in (`a` on her entry):
// AREA_INCOME(a) x SLOT_INCOME[slot]. Odds are within the season's own four.
const SEASON_SLOTS = [
  { rarity: 3, odds: 5, slot: 4 },
  { rarity: 4, odds: 20, slot: 5 },
  { rarity: 5, odds: 80, slot: 6 },
  { rarity: 6, odds: 400, slot: 8 },
]
export const SEASONS = [
  {
    id: 'candy', name: 'Candy Carnival', icon: '\u{1F36C}', color: '#ff7ac8', banner: ['#ff9ad8', '#c42f8a'], fx: 'gems', fxColors: ['#ff9ad8', '#ffffff', '#7ae8ff', '#ffe680'],
    girls: [
      { n: 'Gummy Duck', k: 'duck', c: '#ff7ac8', c2: '#7ae8ff', c3: '#ffe680' },
      { n: 'Candy Fish', k: 'fish', c: '#9a6bff', c2: '#ffd6f0', c3: '#ff7ac8', x: 'stripes' },
      { n: 'Bonbon Octopus', k: 'octopus', c: '#ff4f8a', c2: '#ffd6f0', c3: '#6a3b1e', x: 'spots crown' },
      { n: 'Sugar Swan', k: 'swan', c: '#fff0fa', c2: '#ff9ad8', c3: '#ffd23a', x: 'crown wings glow' },
    ],
  },
  {
    id: 'frost', name: 'Frost Festival', icon: '\u{2744}\u{FE0F}', color: '#7ae8ff', banner: ['#9ff0ff', '#2f7cc8'], fx: 'snow', fxColors: ['#ffffff', '#c8f6ff', '#9fd8ff'],
    girls: [
      { n: 'Mitten Penguin', k: 'penguin', c: '#3d8fd6', c2: '#ffffff', c3: '#ff5a5a' },
      { n: 'Snowflake Seal', k: 'seal', c: '#e8f4ff', c2: '#ffffff', c3: '#7cc8f2', x: 'spots' },
      { n: 'Aurora Narwhal', k: 'whale', c: '#c8a0ff', c2: '#7ae8ff', c3: '#ffffff', x: 'horn' },
      { n: 'Glacier Swan', k: 'swan', c: '#bfeaff', c2: '#ffffff', c3: '#3d8fd6', x: 'crown halo glow' },
    ],
  },
  {
    id: 'moon', name: 'Spooky Moon', icon: '\u{1F383}', color: '#ff8a2e', banner: ['#ffa84a', '#5a2a8a'], fx: 'embers', fxColors: ['#ff8a2e', '#b07cff', '#ffe14a'],
    girls: [
      { n: 'Pumpkin Frog', k: 'frog', c: '#ff8a2e', c2: '#2a1a1a', c3: '#3fd23a' },
      { n: 'Bat Fish', k: 'fish', c: '#3a2a4a', c2: '#b07cff', c3: '#ff3a5a', x: 'wings' },
      { n: 'Ghost Jelly', k: 'jelly', c: '#e8e8ff', c2: '#ffffff', c3: '#3fd23a', x: 'glow' },
      { n: 'Moon Kraken', k: 'octopus', c: '#5a3a8a', c2: '#b07cff', c3: '#ffd23a', x: 'horn crown glow' },
    ],
  },
]
// Season girls (SEASONS): area -1 (not in a lane area's Index page), `season` = the season id,
// `incomeSlot` = the SLOT_INCOME step she earns at in the area she was caught in (entry `a`).
// `income` is her Sunny Meadow figure (for display before she is caught).
export const SEASON_GIRLS = SEASONS.flatMap((season, si) =>
  season.girls.map((g, i) => ({
    id: `${season.id}_${g.n.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
    name: g.n,
    area: -1,
    season: season.id,
    slot: i,
    rarity: SEASON_SLOTS[i].rarity,
    odds: SEASON_SLOTS[i].odds,
    incomeSlot: SEASON_SLOTS[i].slot,
    income: niceRound(AREA_INCOME(0) * SLOT_INCOME[SEASON_SLOTS[i].slot]),
    look: lookOf(g, si * 5 + i * 3 + 1, season),
  })),
)
// What a season girl earns when caught in area `a`.
export const seasonIncome = (def, a) => niceRound(AREA_INCOME(Math.max(0, a | 0)) * SLOT_INCOME[def.incomeSlot ?? 0])

// The event shop (Events window): money-free, paid in earned Event Tickets.
export const EVENT_SHOP = [
  { id: 'luck', name: 'Luck Potion', desc: '2x luck for 10 minutes', icon: '\u{1F340}', price: 25, potion: 'luck', minutes: 10 },
  { id: 'cash', name: 'Cash Potion', desc: '2x income for 10 minutes', icon: '\u{1F4B0}', price: 40, potion: 'cash', minutes: 10 },
  { id: 'lucky', name: 'Lucky Cast', desc: '100x luck on your next cast', icon: '\u{2618}\u{FE0F}', price: 30, lucky: 1 },
  { id: 'lure', name: 'Season Lure', desc: 'Your next cast hooks a season animal', icon: '\u{1F3A3}', price: 60, lure: 1 },
]
// Potions (event shop, Daily Reward, spin wheel): S.potions[kind] = epoch ms it lasts until.
export const POTIONS = { luck: { mult: 2, name: 'Luck x2', icon: '\u{1F340}' }, cash: { mult: 2, name: 'Income x2', icon: '\u{1F4B0}' } }

// PERFECT streak: every PERFECT in a row adds `step` luck (up to `max` steps); GOOD or WEAK
// ends the streak, GREAT keeps it.
export const STREAK = { step: 0.1, max: 10 }
// Distance records: a new longest throw is announced; every `every` metres of record pays
// `secs` of income (at least `min`).
export const RECORDS = { every: 50, secs: 30, min: 100 }
// Finishing an area's Index page also pays `secs` of income (at least `min`) and a title.
export const INDEX_REWARD = { secs: 300, min: 1000, title: (area) => `${area.name} Master` }

// Playtime gifts (Rewards window): claimable once each after this many minutes of play in one
// session. kind: cash (secs of income, at least min), lucky (free Lucky Throws), potion.
export const PLAYTIME_GIFTS = [
  { min: 5, kind: 'cash', secs: 30, floor: 200, icon: '\u{1F4B5}' },
  { min: 10, kind: 'lucky', n: 1, icon: '\u{2618}\u{FE0F}' },
  { min: 15, kind: 'cash', secs: 60, floor: 500, icon: '\u{1F4B5}' },
  { min: 30, kind: 'potion', potion: 'luck', minutes: 10, icon: '\u{1F340}' },
  { min: 45, kind: 'cash', secs: 120, floor: 2000, icon: '\u{1F4B0}' },
  { min: 60, kind: 'potion', potion: 'cash', minutes: 10, icon: '\u{1F4B0}' },
]
// Daily Reward (server clock; backend daily.ts): one day unlocks per UTC day, 7 in a cycle.
export const DAILY = {
  days: [
    { kind: 'cash', secs: 60, floor: 500, icon: '\u{1F4B5}' },
    { kind: 'lucky', n: 1, icon: '\u{2618}\u{FE0F}' },
    { kind: 'cash', secs: 180, floor: 2000, icon: '\u{1F4B5}' },
    { kind: 'potion', potion: 'luck', minutes: 15, icon: '\u{1F340}' },
    { kind: 'potion', potion: 'cash', minutes: 15, icon: '\u{1F4B0}' },
    { kind: 'lucky', n: 2, icon: '\u{2618}\u{FE0F}' },
    { kind: 'cash', secs: 600, floor: 20000, tickets: 20, icon: '\u{1F381}' },
  ],
}
// Spin wheel. Online the server owns the spins and rolls them (backend constants.ts SPIN_*: same
// ids, weights and timing); offline the client does, for the session only.
export const SPIN = {
  everyMin: 15, // one free spin every this many minutes
  cap: 5, // spins that can pile up
  start: 1, // a new player's spins
  wedges: [
    { id: 'cash1', weight: 30, kind: 'cash', secs: 60, floor: 300, label: '1 min cash', color: '#6ee04a' },
    { id: 'luck', weight: 22, kind: 'potion', potion: 'luck', minutes: 10, label: 'Luck x2', color: '#2fb8a0' },
    { id: 'cash5', weight: 20, kind: 'cash', secs: 300, floor: 1500, label: '5 min cash', color: '#3fa6ff' },
    { id: 'lucky', weight: 15, kind: 'lucky', n: 1, label: 'Lucky Cast', color: '#c97bff' },
    { id: 'income', weight: 12, kind: 'potion', potion: 'cash', minutes: 10, label: 'Income x2', color: '#ffb020' },
    { id: 'jackpot', weight: 1, kind: 'cash', secs: 1800, floor: 10000, label: 'JACKPOT', color: '#ff4f5e' },
  ],
}

// The Fuse Machine (ui/hud.js window, main.js startFuse). Bring 3 of the same baddie and
// size (from your pen and/or hotbar): you always get the next size up, and a lucky fuse skips
// a size (normal -> HUGE) or, when there is no bigger size left, pays a cash bonus.
export const FUSE = {
  duration: 2.6, // s the machine runs
  luckyChance: 0.1,
  luckyBonusSeconds: 120, // a lucky BIG -> HUGE also pays this many seconds of the result's income
}

// Food rarities (the Food Shop card colours and the throw effects; separate from the
// baddie RARITIES). key = CSS card class, color = text/accent, glow = trails, auras and
// impact light, fx = how loud the throw effects get (0 plain .. 10 everything),
// emissive = how much the model itself glows (bloom picks up its glow voxels).
export const FOOD_RARITIES = [
  { key: 'common', name: 'Common', color: '#e9edf2', glow: '#ffffff', fx: 0, emissive: 0 },
  { key: 'uncommon', name: 'Uncommon', color: '#69e05a', glow: '#8aff6a', fx: 1, emissive: 0 },
  { key: 'rare', name: 'Rare', color: '#3fa6ff', glow: '#5fc0ff', fx: 2, emissive: 0 },
  { key: 'epic', name: 'Epic', color: '#d36bff', glow: '#d98aff', fx: 3, emissive: 0 },
  { key: 'legendary', name: 'Legendary', color: '#ffc21f', glow: '#ffd84f', fx: 4, emissive: 0 },
  { key: 'mythic', name: 'Mythic', color: '#ff5a3a', glow: '#ff7a3a', fx: 5, emissive: 0.03 },
  { key: 'celestial', name: 'Celestial', color: '#3fe0c0', glow: '#8affea', fx: 6, emissive: 0.05, rainbow: true },
  { key: 'cosmic', name: 'Cosmic', color: '#7a5bff', glow: '#9a7dff', fx: 7, emissive: 0.08 },
  { key: 'divine', name: 'Divine', color: '#ffd6f0', glow: '#fff0b0', fx: 8, emissive: 0.1 },
  { key: 'secret', name: 'Secret', color: '#d8d8e8', glow: '#e8e8ff', fx: 9, emissive: 0.06 },
  { key: 'exotic', name: 'Exotic', color: '#ffe04a', glow: '#7ffcff', fx: 10, emissive: 0.12 },
  { key: 'special', name: 'Special Rod', color: '#ffe04a', glow: '#c07dff', fx: 8, emissive: 0.1 },
]

// Foods you can throw (the Food Shop, ui/hud.js; models in game/foods.js). Bought once
// with money and kept; buying one equips it. dist = the food's base throw distance in metres
// (Throwing Strength multiplies it, see THROW), luck scales the rarity roll; both climb with
// every tier. kind = what it sounds like and how it breaks up when it lands (crunch, squish,
// soft, meat, jelly, metal, cosmic).
// The Galaxy Donut is the reference art's premium-currency food: here it costs money like
// everything else (priced a bit above the tier it matches), as the root CLAUDE.md requires.
// Pacing (tested in a progression sim): a player who throws and trains reaches the last area
// in about 2 hours (the prices up to tier ~32 set that pace; above it they climb x1.7 a tier,
// so the whole list takes about a day of top-end income).
const FOOD_DIST = (tier) => Math.round(20 * Math.pow(1.08, tier - 1) * 10) / 10
const FOOD_LUCK = (tier) => {
  const l = Math.pow(1.1, tier - 1)
  return l < 10 ? Math.round(l * 100) / 100 : Math.round(l * 10) / 10
}
const FOOD_LIST = [
  // id, name, rarity, price (money; the tuned per-tier list, see Pacing above), kind (splash sound), [blank, grip, accent]
  ['twig', 'Twig Rod', 0, 0, 'crunch', ['#a8743a', '#6b4226', '#e8222c']],
  ['bamboo', 'Bamboo Rod', 0, 10, 'crunch', ['#c8d860', '#6a8a2a', '#e8222c']],
  ['wooden', 'Wooden Rod', 0, 15, 'squish', ['#b07a44', '#4a2f1c', '#e8222c']],
  ['oak', 'Oak Rod', 0, 25, 'squish', ['#8b5a33', '#3a2414', '#ff8a1a']],
  ['fiberglass', 'Fiberglass Rod', 1, 38, 'squish', ['#f2f2e8', '#2a2a2a', '#3fa6ff']],
  ['pine', 'Pine Rod', 1, 60, 'squish', ['#d8b070', '#3a5a2a', '#69e05a']],
  ['birch', 'Birch Rod', 1, 98, 'squish', ['#f0ece0', '#2a2a2a', '#ff5a5a']],
  ['angler', 'Angler Rod', 1, 190, 'squish', ['#3a6ad0', '#1a1a2a', '#ffd23a']],
  ['carbon', 'Carbon Rod', 2, 400, 'squish', ['#2a2a30', '#e83a3a', '#e83a3a']],
  ['steel', 'Steel Rod', 2, 980, 'crunch', ['#9aa2ae', '#2a2a2a', '#3fa6ff']],
  ['coral', 'Coral Rod', 2, 2500, 'crunch', ['#ff7aa8', '#c82a6a', '#ffffff']],
  ['reef', 'Reef Rod', 2, 4500, 'soft', ['#3ad0c0', '#1a5a6a', '#ffd23a']],
  ['lucky', 'Lucky Rod', 3, 8200, 'soft', ['#3fd23a', '#1a5a1a', '#ffd23a']],
  ['neon', 'Neon Rod', 3, 15000, 'squish', ['#ff3fd2', '#1a1a2a', '#3affff']],
  ['candy', 'Candy Rod', 3, 35000, 'squish', ['#ff9ad8', '#ffffff', '#7ae8ff']],
  ['frost', 'Frost Rod', 3, 68000, 'crunch', ['#bfeaff', '#3a7ad0', '#ffffff']],
  ['golden', 'Golden Rod', 4, 130000, 'crunch', ['#ffd23a', '#8a5a1a', '#ff3a3a']],
  ['royal', 'Royal Rod', 4, 450000, 'soft', ['#7a3ad0', '#ffd23a', '#ffd23a']],
  ['sakura', 'Sakura Rod', 4, 900000, 'soft', ['#ffd6ea', '#8a3a5a', '#ff5fa8']],
  ['thunder', 'Thunder Rod', 4, 2800000, 'soft', ['#3a3a6a', '#ffd23a', '#7ae8ff']],
  ['lava', 'Lava Rod', 5, 5800000, 'crunch', ['#3a2020', '#ff5a1a', '#ffcc33']],
  ['shark', 'Shark Rod', 5, 12000000, 'soft', ['#7a8aa0', '#2a3a4a', '#ffffff']],
  ['kraken', 'Kraken Rod', 5, 28000000, 'soft', ['#5a2a8a', '#2a1a3a', '#ff5fd2']],
  ['phoenix', 'Phoenix Rod', 5, 90000000, 'crunch', ['#ff7a1a', '#a81a1a', '#ffe14a']],
  ['rainbow', 'Rainbow Rod', 6, 280000000, 'crunch', ['#ff5a5a', '#5a3ad0', '#5aff8a']],
  ['aurora', 'Aurora Rod', 6, 900000000, 'jelly', ['#7ae8ff', '#3a2a8a', '#c8a0ff']],
  ['prism', 'Prism Rod', 6, 2500000000, 'soft', ['#e0f8ff', '#7a4bff', '#ff9bd2']],
  ['sunbeam', 'Sunbeam Rod', 6, 12000000000, 'jelly', ['#fff0a0', '#ff8a1a', '#ffffff']],
  ['nebula', 'Nebula Rod', 7, 13000000000, 'crunch', ['#7a4bff', '#1a0a3a', '#ff5fd2']],
  ['comet', 'Comet Rod', 7, 15000000000, 'meat', ['#3affff', '#1a2a5a', '#ffffff']],
  ['meteor', 'Meteor Rod', 7, 18000000000, 'meat', ['#5a4a4a', '#ff5a1a', '#ffcc33']],
  ['starlight', 'Starlight Rod', 7, 42000000000, 'soft', ['#1a1a4a', '#ffd23a', '#fff6a0']],
  ['void', 'Void Rod', 7, 72000000000, 'crunch', ['#0a0a14', '#b04aff', '#b04aff']],
  ['angel', 'Angel Rod', 8, 120000000000, 'meat', ['#ffffff', '#ffd23a', '#fff0b0']],
  ['seraph', 'Seraph Rod', 8, 210000000000, 'jelly', ['#fff6d8', '#ff9ad8', '#ffd23a']],
  ['halo', 'Halo Rod', 8, 350000000000, 'meat', ['#fffaf0', '#c89a3a', '#7ae8ff']],
  ['shadow', 'Shadow Rod', 9, 600000000000, 'meat', ['#1a1a24', '#3a3a4a', '#e8e8ff']],
  ['phantom', 'Phantom Rod', 9, 1000000000000, 'soft', ['#c8c8e8', '#4a4a6a', '#ffffff']],
  ['abyss', 'Abyss Rod', 9, 1800000000000, 'jelly', ['#0a1a3a', '#1a3a6a', '#3affff']],
  ['trident', 'Trident Rod', 9, 3000000000000, 'metal', ['#ffd23a', '#3a6ad0', '#7ae8ff']],
  ['leviathan', 'Leviathan Rod', 9, 5000000000000, 'squish', ['#1a5a6a', '#0a2a3a', '#7dff4a']],
  ['dragon', 'Dragon Rod', 9, 8500000000000, 'soft', ['#c82a2a', '#2a1a1a', '#ffd23a']],
  ['crystal', 'Crystal Rod', 9, 14000000000000, 'jelly', ['#9fe8ff', '#c8a0ff', '#ffffff']],
  ['obsidian', 'Obsidian Rod', 9, 25000000000000, 'squish', ['#1a1020', '#ff6a1a', '#ff6a1a']],
  ['eclipse', 'Eclipse Rod', 9, 42000000000000, 'jelly', ['#1a1a2a', '#ffd23a', '#ff7a1a']],
  ['ancient', 'Ancient Rod', 9, 72000000000000, 'meat', ['#8a7a5a', '#3a3a2a', '#3ad0a0']],
  ['cosmic', 'Cosmic Rod', 10, 120000000000000, 'cosmic', ['#3a1a8a', '#0a0a2a', '#3affff']],
  ['infinity', 'Infinity Rod', 10, 210000000000000, 'cosmic', ['#ffffff', '#7a4bff', '#ff5fd2']],
  ['omega', 'Omega Rod', 10, 350000000000000, 'cosmic', ['#ffd23a', '#1a0a3a', '#7ffcff']],
  // The deep-sea set (from the reference Rods window): each has its own head piece (ROD_TOPS).
  ['atlantean', 'Atlantean Rod', 10, 600000000000000, 'metal', ['#2a8fd0', '#0a2a4a', '#7dffd4']],
  ['leviathancrown', "Leviathan's Crown Rod", 10, 1000000000000000, 'metal', ['#1a3a6a', '#0a1a3a', '#ffd23a']],
  ['rift', 'Rift Rod', 10, 1700000000000000, 'cosmic', ['#16101e', '#c03ac0', '#ff4fd8']],
  ['voideye', 'Void Eye Rod', 10, 2900000000000000, 'cosmic', ['#1a0a3a', '#0a0a14', '#b04aff']],
]
export const FOODS = [
  // Special: premium currency in the reference, money here. Distance of tier 14, luck of tier 16, priced as tier 17.
  { id: 'galaxy', name: 'Galaxy Rod', rarity: 11, tier: 0, special: true, price: 130e3, dist: FOOD_DIST(14), luck: FOOD_LUCK(16), kind: 'cosmic', colors: ['#2a1a6a', '#0a0a2a', '#c07dff'] },
  ...FOOD_LIST.map(([id, name, rarity, price, kind, colors], i) => ({ id, name, rarity, tier: i + 1, price, dist: FOOD_DIST(i + 1), luck: FOOD_LUCK(i + 1), kind, colors })),
]
// Head pieces some rods wear on the tip (game/foods.js buildRod): the rarer rods stand out in the
// shop and in the hand. trident / bolt / flame / crown / cube / eye / star / wing / halo / fin.
export const ROD_TOPS = {
  coral: 'fin',
  thunder: 'bolt',
  lava: 'flame',
  phoenix: 'flame',
  royal: 'crown',
  angel: 'wing',
  halo: 'halo',
  trident: 'trident',
  leviathan: 'fin',
  dragon: 'flame',
  starlight: 'star',
  atlantean: 'trident',
  leviathancrown: 'crown',
  rift: 'cube',
  voideye: 'eye',
}
export const STARTER_FOOD = 'twig'

// --- Tackle: baits, trails and the boost shelf (ui/tackleShop.js, game/state.js) ------------------
// Everything is bought with money (never premium currency, see the root CLAUDE.md). The reference
// shows a few Robux prices (Jackpot Bait, the premium trails): here they cost fair, slightly high,
// money. Rarity = an index into FOOD_RARITIES (card colours, effects).
// BAITS: bought in packs (`pack` casts each), one bait is equipped; every cast uses one and its
// `luck` multiplies the cast's luck. `dyn` = priced from your income like the Lucky Cast
// ({ min, secs }: max(min, income x secs)). `guarantee` = the cast always brings an animal of at
// least that RARITIES index (6 = Secret). `kind` picks the 3D model (game/foods.js buildBait).
export const BAITS = [
  { id: 'worm', name: 'Worm Bait', rarity: 0, luck: 1.1, pack: 10, price: 400, kind: 'worm', colors: ['#ff7aa0', '#c8456a', '#ffd0dc'] },
  { id: 'minnow', name: 'Minnow Bait', rarity: 0, luck: 1.15, pack: 10, price: 2500, kind: 'minnow', colors: ['#9ab8d8', '#4a6a98', '#ffffff'] },
  { id: 'grub', name: 'Grub Bait', rarity: 1, luck: 1.2, pack: 10, price: 15e3, kind: 'grub', colors: ['#f4e8b8', '#c8a860', '#6a4a20'] },
  { id: 'cricket', name: 'Cricket Bait', rarity: 1, luck: 1.25, pack: 10, price: 80e3, kind: 'cricket', colors: ['#6a8a2a', '#3a4a14', '#c8e060'] },
  { id: 'shrimp', name: 'Shrimp Bait', rarity: 2, luck: 1.3, pack: 10, price: 450e3, kind: 'shrimp', colors: ['#ff9a8a', '#d85a4a', '#ffe0d0'] },
  { id: 'glowworm', name: 'Glow Worm', rarity: 2, luck: 1.35, pack: 10, price: 2.2e6, kind: 'worm', glow: true, colors: ['#7dff4a', '#2a8a1a', '#d8ffb0'] },
  { id: 'firefly', name: 'Firefly Bait', rarity: 3, luck: 1.4, pack: 10, price: 10e6, kind: 'firefly', colors: ['#3a3a2a', '#ffe14a', '#ffffff'] },
  { id: 'crystalbait', name: 'Crystal Bait', rarity: 3, luck: 1.5, pack: 10, price: 35e6, kind: 'crystal', colors: ['#9fe8ff', '#5a9aff', '#ffffff'] },
  { id: 'golden', name: 'Golden Lure', rarity: 4, luck: 1.75, pack: 10, price: 100e6, kind: 'lure', colors: ['#ffd23a', '#a8721a', '#fff6a0'] },
  { id: 'thunderlure', name: 'Thunder Lure', rarity: 4, luck: 1.85, pack: 10, price: 1.2e9, kind: 'lure', top: 'bolt', colors: ['#3a6aff', '#1a2a8a', '#ffe14a'] },
  { id: 'rainbow', name: 'Rainbow Lure', rarity: 5, luck: 2, pack: 10, price: 15e9, kind: 'rainbow', colors: ['#ff5a5a', '#ffd84a', '#5ac8ff'] },
  { id: 'magma', name: 'Magma Lure', rarity: 5, luck: 2.25, pack: 10, price: 90e9, kind: 'lure', top: 'flame', glow: true, colors: ['#ff5a1a', '#3a1410', '#ffd23a'] },
  { id: 'starlure', name: 'Star Lure', rarity: 6, luck: 2.5, pack: 10, price: 600e9, kind: 'lure', top: 'star', glow: true, colors: ['#8affea', '#2a8a8a', '#ffffff'] },
  { id: 'nebulalure', name: 'Nebula Lure', rarity: 7, luck: 3, pack: 10, price: 4e12, kind: 'lure', top: 'star', glow: true, colors: ['#7a4bff', '#1a0a3a', '#ff5fd2'] },
  { id: 'angellure', name: 'Angel Lure', rarity: 8, luck: 3.5, pack: 10, price: 30e12, kind: 'lure', top: 'halo', glow: true, colors: ['#ffffff', '#ffd23a', '#fff0b0'] },
  { id: 'shadowlure', name: 'Shadow Lure', rarity: 9, luck: 4, pack: 10, price: 200e12, kind: 'lure', top: 'eye', glow: true, colors: ['#1a1a24', '#3a3a4a', '#e8e8ff'] },
  { id: 'jackpot', name: 'Jackpot Bait', rarity: 9, luck: 1, pack: 1, dyn: { min: 5e8, secs: 6000 }, kind: 'jackpot', guarantee: 6, note: 'GUARANTEED SECRET CAST!', colors: ['#ffd23a', '#e8222c', '#fff6a0'] },
  { id: 'infinitylure', name: 'Infinity Lure', rarity: 10, luck: 5, pack: 10, price: 1.5e15, kind: 'lure', top: 'halo', glow: true, colors: ['#ffffff', '#7a4bff', '#ff5fd2'] },
]

// TRAILS: a trail follows your rod: it streams behind the bobber when you cast and drifts behind
// you in the hub. `ribbon` colours the streak behind the bobber ('rainbow' cycles, null = the
// rod's own glow); `parts` are the particle emitters (rate = per second, s = SPR key, c = colours,
// size / life ranges, spread = sideways m/s, up, back = m/s it drifts behind, grav, glow =
// additive, hue = cycle the colour). Order = card order in the Trail Shop.
const P = (s, c, o = {}) => ({ s, c, size: [0.3, 0.55], life: [0.5, 1], rate: 24, spread: 0.7, up: 0.3, back: 0.5, grav: 0, glow: true, ...o })
export const TRAILS = [
  { id: 'goldenwhale', name: 'Golden Whale', rarity: 4, price: 400e9, ribbon: ['#ffe14a', '#fff6c0'], parts: [P('sparkle', ['#ffe14a', '#fff6c0', '#ffffff'], { rate: 36, size: [0.35, 0.7] }), P('bubble', ['#9fe8ff', '#ffffff'], { rate: 12, glow: false, size: [0.3, 0.5], up: 1.2, life: [0.7, 1.2] }), P('gem', ['#ffd23a'], { rate: 8, size: [0.25, 0.4], grav: -2, glow: false })] },
  { id: 'rainbow', name: 'Rainbow', rarity: 6, price: 20e9, ribbon: 'rainbow', parts: [P('sparkle', ['#ff5a5a'], { hue: true, rate: 40, size: [0.35, 0.7] }), P('dot', ['#ff5a5a'], { hue: true, rate: 40, size: [0.4, 0.7], life: [0.6, 1.1] })] },
  { id: 'galaxystardust', name: 'Galaxy Stardust', rarity: 7, price: 150e9, ribbon: ['#c07dff', '#7ae8ff'], parts: [P('star', ['#ffffff', '#ff9bd2', '#c8a0ff', '#7ae8ff'], { rate: 26, size: [0.3, 0.6], spin: 3 }), P('sparkle', ['#ffffff', '#ffd6f5'], { rate: 30 }), P('dot', ['#7a4bff', '#ff5fd2'], { rate: 30, size: [0.5, 0.9], life: [0.8, 1.3] })] },
  { id: 'comet', name: 'Comet', rarity: 5, price: 60e9, ribbon: ['#ffb02a', '#fff0b0'], parts: [P('flame', ['#ff9a2a', '#ffd23a', '#ff5a1a'], { rate: 40, size: [0.5, 0.9], life: [0.4, 0.8] }), P('crumb', ['#ffcc66', '#e8a040'], { rate: 20, size: [0.2, 0.35], glow: false, grav: -3, spread: 1.4 }), P('star', ['#ffffff'], { rate: 10 })] },
  { id: 'sprinkledonut', name: 'Sprinkle Donut', rarity: 3, price: 5e9, ribbon: ['#ff9ad8', '#fff0f8'], parts: [P('square', ['#ff5fa8', '#ffffff', '#5ae8ff', '#ffe14a', '#8aff6a'], { rate: 44, size: [0.16, 0.26], glow: false, grav: -4, spread: 1.2, life: [0.6, 1.1], spin: 6 }), P('sparkle', ['#ffffff'], { rate: 12 })] },
  { id: 'bubbles', name: 'Bubbles', rarity: 0, price: 1e3, ribbon: null, parts: [P('bubble', ['#bfeaff', '#ffffff'], { rate: 26, glow: false, size: [0.25, 0.6], up: 1.3, life: [0.8, 1.4] })] },
  { id: 'leafy', name: 'Leafy', rarity: 1, price: 1e6, ribbon: ['#7dff4a', '#e8ffb0'], parts: [P('leaf', ['#5ad23a', '#9aff5a', '#e8c84a'], { rate: 28, glow: false, size: [0.3, 0.5], grav: -1.4, spin: 4, life: [0.8, 1.4], spread: 1 })] },
  { id: 'splash', name: 'Splash', rarity: 2, price: 1e9, ribbon: ['#5fc0ff', '#ffffff'], parts: [P('bubble', ['#7ad0ff', '#ffffff', '#3fa6ff'], { rate: 36, glow: false, size: [0.2, 0.5], grav: -5, spread: 1.6, up: 1.4, life: [0.5, 0.9] }), P('dot', ['#ffffff'], { rate: 24, size: [0.2, 0.35] })] },
  { id: 'hearts', name: 'Lovely Hearts', rarity: 1, price: 25e3, ribbon: ['#ff7aa8', '#ffe0ec'], parts: [P('heart', ['#ff5f8a', '#ff9ab8', '#ffffff'], { rate: 16, glow: false, size: [0.35, 0.6], up: 1.1, life: [0.8, 1.3] })] },
  { id: 'notes', name: 'Melody', rarity: 1, price: 400e3, ribbon: ['#c8a0ff', '#ffffff'], parts: [P('note', ['#ffffff', '#ffd84a', '#7ae8ff', '#ff9ad8'], { rate: 12, glow: false, size: [0.4, 0.65], up: 1, life: [0.9, 1.4] })] },
  { id: 'snowfall', name: 'Snowfall', rarity: 2, price: 12e6, ribbon: ['#bfeaff', '#ffffff'], parts: [P('snow', ['#ffffff', '#cfefff'], { rate: 40, glow: false, size: [0.2, 0.4], grav: -1.2, spread: 1.2, life: [0.9, 1.5] }), P('sparkle', ['#e8fbff'], { rate: 10 })] },
  { id: 'sakura', name: 'Sakura', rarity: 3, price: 60e6, ribbon: ['#ffb0d0', '#fff0f6'], parts: [P('petal', ['#ffb0d0', '#ff8ab8', '#ffe0ec'], { rate: 34, glow: false, size: [0.3, 0.5], grav: -1.3, spin: 4, life: [0.9, 1.5], spread: 1.1 })] },
  { id: 'fireflies', name: 'Fireflies', rarity: 3, price: 300e6, ribbon: ['#d8ff6a', '#ffffff'], parts: [P('dot', ['#e8ff5a', '#b8ff4a'], { rate: 26, size: [0.3, 0.55], up: 0.5, spread: 1.4, life: [1, 1.8] }), P('sparkle', ['#ffffd0'], { rate: 10 })] },
  { id: 'flames', name: 'Blazing Flames', rarity: 4, price: 3e9, ribbon: ['#ff5a1a', '#ffd23a'], parts: [P('flame', ['#ff5a1a', '#ff9a2a', '#ffd23a'], { rate: 46, size: [0.5, 0.9], life: [0.35, 0.7], up: 0.8 }), P('dot', ['#ffcc33'], { rate: 20, size: [0.2, 0.3], grav: -1 })] },
  { id: 'gems', name: 'Gem Rain', rarity: 5, price: 250e9, ribbon: ['#9fe8ff', '#ff9bd2'], parts: [P('gem', ['#5ae8ff', '#ff6aa8', '#7dff4a', '#ffd23a', '#c07dff'], { rate: 20, glow: false, size: [0.3, 0.5], grav: -3, spin: 4, spread: 1.2 }), P('sparkle', ['#ffffff'], { rate: 24 })] },
  { id: 'lightning', name: 'Lightning', rarity: 6, price: 900e9, ribbon: ['#ffe14a', '#7ae8ff'], parts: [P('star', ['#ffe14a', '#ffffff'], { rate: 30, size: [0.3, 0.6], life: [0.2, 0.45], spread: 1.6 }), P('sparkle', ['#7ae8ff', '#ffffff'], { rate: 36, life: [0.2, 0.5], spread: 1.8 })] },
  { id: 'feathers', name: 'Angel Feathers', rarity: 8, price: 6e12, ribbon: ['#ffffff', '#fff0b0'], parts: [P('feather', ['#ffffff', '#fff6d8', '#ffe9a8'], { rate: 20, glow: false, size: [0.4, 0.7], grav: -0.8, spin: 3, life: [1, 1.7], spread: 1 }), P('sparkle', ['#fff6c0'], { rate: 24 })] },
  { id: 'voidtrail', name: 'Void Smoke', rarity: 9, price: 30e12, ribbon: ['#b04aff', '#14081e'], parts: [P('smoke', ['#2a1440', '#5a2a8a', '#14081e'], { rate: 30, glow: false, size: [0.9, 1.5], life: [0.8, 1.3], spread: 0.5 }), P('sparkle', ['#b04aff', '#ffffff'], { rate: 22 })] },
  { id: 'aurora', name: 'Aurora', rarity: 7, price: 120e12, ribbon: 'rainbow', parts: [P('dot', ['#3affc8'], { hue: true, hueBase: 0.35, hueSpan: 0.3, rate: 44, size: [0.7, 1.1], life: [0.8, 1.4] }), P('sparkle', ['#ffffff'], { rate: 18 })] },
  { id: 'phoenixtrail', name: 'Phoenix Fire', rarity: 9, price: 500e12, ribbon: ['#ff7a1a', '#ffe14a'], parts: [P('flame', ['#ff5a1a', '#ffb02a', '#ffe14a'], { rate: 44, size: [0.6, 1], life: [0.4, 0.8], up: 0.9 }), P('feather', ['#ff9a2a', '#ffd23a'], { rate: 12, glow: false, size: [0.4, 0.7], grav: -0.8, spin: 3, life: [1, 1.5] }), P('sparkle', ['#ffe14a'], { rate: 24 })] },
  { id: 'cosmictrail', name: 'Cosmic Rings', rarity: 10, price: 1.5e15, ribbon: 'rainbow', parts: [P('ring', ['#7ae8ff', '#ff5fd2', '#ffe14a'], { rate: 10, size: [0.6, 1.2], life: [0.6, 1], spread: 0.3 }), P('star', ['#ffffff', '#c8a0ff', '#7ae8ff'], { rate: 28, spin: 3 }), P('sparkle', ['#ffffff'], { rate: 26 })] },
]

// The boost shelf in the Shop window: potions, free Lucky Casts and Season Lures, priced from your
// income (max(min, income x secs)) so they stay worth buying all game. Money only.
export const BOOST_SHOP = [
  { id: 'luck15', name: 'Luck Potion', desc: 'Luck x2 for 15 minutes', icon: '\u{1F340}', potion: 'luck', minutes: 15, min: 2e3, secs: 900 },
  { id: 'luck60', name: 'Big Luck Potion', desc: 'Luck x2 for 1 hour', icon: '\u{1F340}', potion: 'luck', minutes: 60, min: 7500, secs: 3200 },
  { id: 'cash15', name: 'Income Potion', desc: 'Income x2 for 15 minutes', icon: '\u{1F4B0}', potion: 'cash', minutes: 15, min: 3e3, secs: 1500 },
  { id: 'cash60', name: 'Big Income Potion', desc: 'Income x2 for 1 hour', icon: '\u{1F4B0}', potion: 'cash', minutes: 60, min: 12e3, secs: 5200 },
  { id: 'lucky1', name: 'Lucky Cast', desc: 'A free 100x luck cast', icon: '\u{1F3B0}', lucky: 1, min: 3e3, secs: 520 },
  { id: 'lucky5', name: 'Lucky Cast x5', desc: 'Five free 100x luck casts', icon: '\u{1F3B0}', lucky: 5, min: 14e3, secs: 2300 },
  { id: 'lure1', name: 'Season Lure', desc: 'The next cast brings out a season animal', icon: '\u{1F380}', lure: 1, min: 2e4, secs: 1800 },
  { id: 'lure3', name: 'Season Lure x3', desc: 'Three season animals, one per cast', icon: '\u{1F380}', lure: 3, min: 5e4, secs: 5000 },
]

// Throw range = the food's distance x (1 + strength bonus), at most maxRange. The bonus is
// strengthPct per Throwing Strength point (training levels give 5, every throw 1), capped.
export const THROW = {
  strengthPct: 0.00125, // +0.125% range per strength point
  strengthCap: 3, // at most +300%
  maxRange: 376, // the lane is about this long past the throw line
  flightTime: [1.1, 3.8], // s in the air at no range / max range
  strengthPerThrow: 1,
}

// The Training Place (game/training.js, hub/trainingStation.js, ui/trainUi.js): the Training
// Bench (two pillars + a pull-up bar) stands right in front of your pad, so you train with the
// pad at your back. Walk in under the bar and you jump up and do pull-ups: every rep earns
// training XP (the bench's XP/s), every training level gives Throwing Strength. STOP, Esc / Q,
// walking or jumping gets off.
// The pad shows the bench's XP/s and the money price of the next bench: step on it to upgrade.
// Every tier is its own 3D model (`style`, built in hub/trainingStation.js). Money only.
const PAD_Z = PENS.z - PENS.halfD + POI.padOffset.z // the upgrade pad's z (all bases)
const PAD_GAP = 4.3 // m from the bar to the pad centre: about 2.3 m of open grass between them
export const TRAINING = {
  // Centre of the bench; the bar runs east-west over it, the pad sits `padGap` m behind it.
  padGap: PAD_GAP,
  spot: { x: PENS.xs[PENS.playerIndex] + POI.padOffset.x, z: PAD_Z - PAD_GAP },
  ringR: 4.7, // the dashed ring round bench + pad (decoration and the "near" glow)
  enterR: 1.45, // step this close to the bar's centre to start training
  facing: Math.PI, // you face north (toward the lane) on the bar, the pad behind you
  pillar: { gap: 2.7, height: 3.4, size: 0.78 }, // centre-to-centre gap, height to the lintel top
  // The hands are pinned to the bar (2-bone arm IK sized from the avatar's own bones): you
  // hang with the arms nearly straight and pull until your shoulders are `top` m under the bar.
  grip: { drop: 0.05, top: 0.14, forward: 0.06 }, // hand centre under the bar, shoulders at the top, bar ahead of the shoulders
  rep: { up: 0.32, hold: 0.1, down: 0.42, rest: 0.1 }, // s per phase at 1x speed
  strengthPerLevel: 5,
  // XP to finish a level: about 3 reps at level 1 on the first bench, +4% every level.
  need: (level) => Math.round(10 * Math.pow(1.04, level)),
  // The benches, in order: XP per second of training at 1x, the money price to upgrade INTO it,
  // and its look (`style` picks the model, `colors` its palette, `glow` its accent light).
  benches: [
    { name: 'Rookie Logs', xps: 4, price: 0, style: 'logs', colors: ['#9a6334', '#6e4220', '#c99a5e', '#e8d6a8'], glow: '#ffd27a' },
    { name: 'Brick Gym', xps: 6, price: 150, style: 'brick', colors: ['#f6f8fc', '#dde3ee', '#c4ccdb', '#2a2f3d'], glow: '#ffffff' },
    { name: 'Iron Rig', xps: 9, price: 1400, style: 'iron', colors: ['#5d6678', '#3a4150', '#e0313f', '#cfd6e2'], glow: '#ff5a5a' },
    { name: 'Neon Arena', xps: 14, price: 12e3, style: 'neon', colors: ['#1d2236', '#10131f', '#25e8ff', '#ff3df2'], glow: '#25e8ff' },
    { name: 'Golden Temple', xps: 20, price: 110e3, style: 'gold', colors: ['#ffc93a', '#d99a12', '#c4202f', '#fff2b0'], glow: '#ffd34f' },
    { name: 'Frost Crystal', xps: 30, price: 1e6, style: 'ice', colors: ['#bfeaff', '#7cc8f2', '#ffffff', '#3d8fd6'], glow: '#9fe8ff' },
    { name: 'Lava Forge', xps: 46, price: 9e6, style: 'lava', colors: ['#3e3446', '#241c2a', '#ff6a1a', '#ffd23a'], glow: '#ff6a1a' },
    { name: 'Royal Diamond', xps: 68, price: 80e6, style: 'royal', colors: ['#7a3cf0', '#4a1fa8', '#ffffff', '#ffd34f'], glow: '#c79bff' },
    { name: 'Celestial Gate', xps: 103, price: 720e6, style: 'celestial', colors: ['#fff6e0', '#ffe7a3', '#8a7aff', '#ffd34f'], glow: '#fff3c4' },
    { name: 'Cosmic Titan', xps: 154, price: 6.5e9, style: 'cosmic', colors: ['#1a1240', '#0a0820', '#ff7af2', '#7ffce0'], glow: '#ff7af2' },
  ],
  // Random XP boosts: while you train a round "2x" tap button pops up somewhere on screen at a
  // random time (it is never there all the time); tap it before it runs out and every rep pays
  // that many times the XP for `dur` s, then it ends. The value is rolled by weight (rarer = bigger).
  drops: {
    first: [3, 7], // s into a session before the first one
    every: [8, 16], // s between one leaving and the next appearing
    life: 4.2, // s it stays up
    values: [
      { mult: 2, weight: 60, dur: 10, color: '#7dff4a' },
      { mult: 3, weight: 25, dur: 10, color: '#3fd0ff' },
      { mult: 5, weight: 11, dur: 10, color: '#c27dff' },
      { mult: 10, weight: 4, dur: 10, color: '#ffc21f' },
    ],
  },
}
// XP one rep pays on bench `tier` (before boosts): its XP/s times the length of a 1x rep.
export const repXp = (tier) => {
  const r = TRAINING.rep
  return Math.max(1, Math.round(TRAINING.benches[tier].xps * (r.up + r.hold + r.down + r.rest)))
}

// Pen growth: every capacity upgrade moves your pen's north fence out toward the river (the south
// fence stays put). The gate, the capacity sign, the upgrade pad and the Training Bench move with
// it, so the north-most thing in front of a pen is the bench's dashed ring. `stopZ` = the line it
// must stay south of: the Rod / Bait / Trail shop rings plus a little gap. `max` = metres the fence
// moves at full capacity (~7.7 m); growth(level) = metres at that capacity level.
PENS.grow = {
  stopZ: Math.max(POI.foodShop.z, POI.baitShop.z, POI.trailShop.z) + Math.max(POI.foodShop.r, POI.baitShop.r, POI.trailShop.r) + 0.8,
}
PENS.grow.max = TRAINING.spot.z + TRAINING.padGap / 2 - TRAINING.ringR - PENS.grow.stopZ
PENS.grow.at = (level) => {
  const levels = (ECONOMY.maxCapacity - ECONOMY.startCapacity) / ECONOMY.capacityStep
  return PENS.grow.max * Math.min(1, Math.max(0, level) / levels)
}

// The cast sequence (game/throw.js + ui/throwUi.js). Step onto the yellow band at the river
// mouth: the camera settles behind you, a power meter sweeps up and down, tap to cast. The
// camera chases the bobber down the river (luck climbs with every metre), slow-mo splashdown,
// then an animal bites, bursts out of the water and is revealed on a card.
export const THROW_MODE = {
  band: { north: -31.75, south: -26.6, halfWidth: 17.6 }, // the yellow band (z range, |x|)
  spot: { x: 0, z: -29.2 }, // where you stand on it
  meterSpeed: 0.95, // full bottom -> top sweeps per second
  minPower: 0.12, // the bottom of the meter still throws this fraction of your range
  // Where the slider stops (0 bottom .. 1 top) grades the throw: power is the slider value,
  // and the grade multiplies luck.
  grades: [
    { min: 0.9, name: 'PERFECT!', color: '#7dff4a', luck: 1.5 },
    { min: 0.7, name: 'GREAT!', color: '#d4ff3a', luck: 1.2 },
    { min: 0.4, name: 'GOOD', color: '#ffd23a', luck: 1 },
    { min: 0, name: 'WEAK', color: '#ff8a3a', luck: 1 },
  ],
  // The cast show, one per grade above (game/throw.js lockIn / launch, ui/throwUi.js castShow,
  // sfx.castShow / castRelease). windup = s the rod is held back before the release (hero = the
  // camera swings round to the front-left of you meanwhile), title / style = the big banner
  // (style picks its letter colours), frame = the screen border (gold: speed rays + grid + golden
  // edges, silver: lighter), screen = flat confetti bursting on screen, cubes = 3D confetti cubes
  // at the release. Pose (radians): arm = how far the rod swings back over your head, lean = body
  // lean back in the windup, lunge = lean forward at the release, hop = m jumped in the windup.
  // A Jackpot Bait or Lucky Cast upgrades the show to at least GREAT ("SECRET CAST!" / "LUCKY CAST!").
  castFx: [
    { title: 'PERFECT CAST!', style: 'rainbow', frame: 'gold', windup: 1.0, hero: true, screen: 26, cubes: 44, arm: 3.05, lean: 0.3, lunge: -0.34, hop: 0.55, shake: 0.3, life: 2.6 },
    { title: 'GREAT CAST!', style: 'lime', frame: 'silver', windup: 0.7, hero: true, screen: 12, cubes: 22, arm: 2.9, lean: 0.22, lunge: -0.28, hop: 0.25, shake: 0.15, life: 2.2 },
    { title: 'GOOD CAST', style: 'gold', frame: '', windup: 0.42, hero: false, screen: 0, cubes: 8, arm: 2.7, lean: 0.16, lunge: -0.22, hop: 0, shake: 0, life: 1.8 },
    { title: 'WEAK CAST...', style: 'weak', frame: '', windup: 0.36, hero: false, screen: 0, cubes: 0, arm: 2.15, lean: 0.06, lunge: -0.08, hop: 0, shake: 0, life: 1.6 },
  ],
  luckPerMeters: 75, // the luck multiplier climbs +1x for every this many metres flown
  slowMo: { last: 0.42, scale: 0.28 }, // s of flight before touchdown played in slow motion, time scale
  hitStop: 0.08, // s frozen on impact
  // The money-priced 100x luck offer (no premium currency anywhere): price = max(min, income x seconds).
  lucky: { mult: 100, minPrice: 2500, incomeSeconds: 420 },
  auto: { stopAt: [0.8, 0.99], continueAfter: 1.0, revealHold: 1.9 },
  typeEvery: 0.085, // s per letter of the name reveal
  // The rod in hand (m): length, shoulder height above the feet, how far the bobber hangs under
  // the tip while aiming, the bobber's size.
  rod: { length: 2.6, shoulder: 1.55, hang: 0.8, bobber: 0.42 },
  // The bite (s unless noted): nibbles on the bobber, the hook hangs hookDepth m under the water,
  // the animal swims in from swimFrom m upstream for `swim` s and bites, the bobber is yanked
  // under for `tug` s, then it bursts out of the water (leap m high) over `burst` s.
  bite: {
    nibbles: 2, hookDepth: 2.2, swimFrom: 7, swim: 1.7, tug: 0.75, burst: 1.0, leap: 1.6,
    // The animal's-eye view before the reveal: it searches (s), spots the bait, swims in (`swim`),
    // lunges (s) and the bite lands. FOVs in degrees: wide when searching, narrowing as it closes in.
    pov: { search: 1.0, lunge: 0.28, fov0: 96, fov1: 52, fovLunge: 82, beatFrom: 0.8, beatTo: 0.3 },
  },
  // Camera shots (metres, degrees).
  cam: {
    aim: { back: 6.4, up: 4.4, side: 1.6, lookAhead: 34, lookUp: -5.5, fov: 60 },
    // PERFECT / GREAT windup: in front of you and to your left, looking back at you (side -x, ahead = toward the river).
    hero: { side: -5.6, ahead: 3.6, up: 2.1, lookUp: 1.9, fov: 50 },
    chase: { back: 3.6, up: 1.1, fov: 82 },
    landed: { radius: 5.2, up: 1.6, fov: 54, orbit: 0.22 },
    reveal: { dist: 4.1, up: 1.55, fov: 44, yaw: 0.55 }, // yaw: the animal turns three-quarters to the camera
  },
}

export const ECONOMY = {
  startMoney: 50,
  startStrength: 10,
  startCapacity: 4,
  capacityStep: 2,
  maxCapacity: 24,
  capacityCost: (level) => Math.round(250 * Math.pow(4.2, level)), // level 0 = first upgrade
  sellSeconds: 45, // a baddie sells for this many seconds of its income
  friendBoost: 0.15, // per Bloxity friend in your room
  inviteBoost: 0.1, // per friend who joined the game from your invite link (permanent)
  inviteMax: 10, // invited friends that count
  chestEvery: 600, // s between free chest rewards
  chestSeconds: 120, // the chest pays this many seconds of income (at least chestMin)
  chestMin: 100,
  offlineCap: 2 * 3600, // s of offline income credited on return
  offlineShare: 0.5,
  saveEveryMs: 4000, // progress goes to the server this often while it changes (net.js saveGame)
  // Rewarded ads (ADS below): Wins / money rewards only, never premium currency.
  adBoostMult: 2, // income multiplier while the ad boost lasts
  hotbarSlots: 9, // caught baddies wait here (select one to carry it, click to place it in your pen)
}

// The Shop. Money only: nothing in this game costs premium currency.
export const UPGRADES = [
  { id: 'cash', name: 'Cash Boost', desc: '+25% income', max: 10, cost: (l) => Math.round(600 * Math.pow(4, l)) },
  { id: 'arms', name: 'Iron Arms', desc: '+20% training XP', max: 25, xpPerLevel: 0.2, cost: (l) => Math.round(200 * Math.pow(2.6, l)) },
  { id: 'luck', name: 'Lucky Charm', desc: '+20% luck', max: 10, cost: (l) => Math.round(1500 * Math.pow(4.5, l)) },
  { id: 'speed', name: 'Speedy Shoes', desc: '+10% walk speed', max: 5, cost: (l) => Math.round(400 * Math.pow(3, l)) },
]

// The objective banner (top centre). The first unfinished one shows; each pays a reward: `reward`
// money, or `secs` seconds of income when that is more. Quests with a `goal` complete themselves
// once it is met (state.js checkQuests); the others are completed by the action they name.
// goal types: area (reach area n, 1-based), catches, food (own food tier n), bench (bench tier n,
// 0-based), level (training level), size (own one this size), variant (catch one this variant),
// rarity (catch one this rarity), dist (throw n metres), streak (PERFECT streak), index (pages done).
export const QUESTS = [
  { id: 'catch1', text: 'Cast your rod into the river', reward: 50 },
  { id: 'train1', text: 'Do pull-ups at the pull-up bar', reward: 100 },
  { id: 'bench1', text: 'Upgrade your pull-up bar on its pad', reward: 150 },
  { id: 'food1', text: 'Buy a new rod', reward: 150 },
  { id: 'area2', text: 'Cast into Area 2: Farm Creek', reward: 200, goal: { type: 'area', n: 2 } },
  { id: 'catch5', text: 'Catch 5 animals', reward: 400 },
  { id: 'pen1', text: 'Upgrade your pen', reward: 800 },
  { id: 'level10', text: 'Reach Training Level 10', reward: 300, secs: 20, goal: { type: 'level', n: 10 } },
  { id: 'area3', text: 'Cast into Area 3: Willow Lake', reward: 500, secs: 30, goal: { type: 'area', n: 3 } },
  { id: 'fuse1', text: 'Fuse 3 animals in the Fuse Machine', reward: 2500 },
  { id: 'food2', text: 'Buy a new rod', reward: 6000 },
  { id: 'dist50', text: 'Cast 50 metres', reward: 1000, secs: 30, goal: { type: 'dist', n: 50 } },
  { id: 'rare1', text: 'Catch a Rare animal', reward: 9000 },
  { id: 'area4', text: 'Cast into Area 4: Desert Oasis', reward: 2000, secs: 40, goal: { type: 'area', n: 4 } },
  { id: 'streak3', text: 'Cast 3 PERFECTs in a row', reward: 2000, secs: 30, goal: { type: 'streak', n: 3 } },
  { id: 'food3', text: 'Buy a new rod', reward: 25000 },
  { id: 'catch25', text: 'Catch 25 animals', reward: 5000, secs: 40, goal: { type: 'catches', n: 25 } },
  { id: 'bench3', text: 'Upgrade to the Neon Arena bench', reward: 5000, secs: 40, goal: { type: 'bench', n: 3 } },
  { id: 'epic1', text: 'Catch an Epic animal', reward: 60000 },
  { id: 'area5', text: 'Cast into Area 5: Frozen River', reward: 10000, secs: 50, goal: { type: 'area', n: 5 } },
  { id: 'gold1', text: 'Catch a GOLD animal', reward: 10000, secs: 50, goal: { type: 'variant', n: 1 } },
  { id: 'index1', text: 'Complete a page of the Index', reward: 10000, secs: 50, goal: { type: 'index', n: 1 } },
  { id: 'area6', text: 'Cast into Area 6: Maple Stream', reward: 20000, secs: 60, goal: { type: 'area', n: 6 } },
  { id: 'huge1', text: 'Fuse a HUGE animal', reward: 20000, secs: 60, goal: { type: 'size', n: 2 } },
  { id: 'dist150', text: 'Cast 150 metres', reward: 20000, secs: 60, goal: { type: 'dist', n: 150 } },
  { id: 'area7', text: 'Cast into Area 7: Crystal Falls', reward: 50000, secs: 70, goal: { type: 'area', n: 7 } },
  { id: 'legend1', text: 'Catch a Legendary animal', reward: 50000, secs: 70, goal: { type: 'rarity', n: 4 } },
  { id: 'catch100', text: 'Catch 100 animals', reward: 50000, secs: 70, goal: { type: 'catches', n: 100 } },
  { id: 'area8', text: 'Cast into Area 8: Sunset Bay', reward: 100000, secs: 80, goal: { type: 'area', n: 8 } },
  { id: 'streak5', text: 'Cast 5 PERFECTs in a row', reward: 100000, secs: 60, goal: { type: 'streak', n: 5 } },
  { id: 'food20', text: 'Buy the Thunder Rod', reward: 100000, secs: 80, goal: { type: 'food', n: 20 } },
  { id: 'area9', text: 'Cast into Area 9: Coral Reef', reward: 200000, secs: 90, goal: { type: 'area', n: 9 } },
  { id: 'diamond1', text: 'Catch a DIAMOND animal', reward: 200000, secs: 90, goal: { type: 'variant', n: 2 } },
  { id: 'area10', text: 'Cast into Area 10: Cloud Springs', reward: 500000, secs: 100, goal: { type: 'area', n: 10 } },
  { id: 'giant1', text: 'Fuse a GIANT animal', reward: 500000, secs: 100, goal: { type: 'size', n: 3 } },
  { id: 'area11', text: 'Cast into Area 11: Lava Lake', reward: 1e6, secs: 110, goal: { type: 'area', n: 11 } },
  { id: 'dist300', text: 'Cast 300 metres', reward: 1e6, secs: 110, goal: { type: 'dist', n: 300 } },
  { id: 'area12', text: 'Cast into Area 12: Cosmic Sea', reward: 2e6, secs: 180, goal: { type: 'area', n: 12 } },
  { id: 'mythic1', text: 'Catch a Mythic animal', reward: 2e6, secs: 120, goal: { type: 'rarity', n: 5 } },
  { id: 'titan1', text: 'Fuse a TITAN animal', reward: 5e6, secs: 300, goal: { type: 'size', n: 4 } },
  { id: 'rainbow1', text: 'Catch a RAINBOW animal', reward: 5e6, secs: 300, goal: { type: 'variant', n: 3 } },
  { id: 'index6', text: 'Complete 6 pages of the Index', reward: 1e7, secs: 300, goal: { type: 'index', n: 6 } },
]

// Neighbour plots (offline stand-ins for other players). Names are made up.
export const NEIGHBOURS = [
  { name: 'PixelPanda22', hair: '#2a1a12', skin: '#f2c79a', shirt: '#3fa6ff', team: ['meadow_goldencarp', 'farm_trout', 'meadow_duck', 'lake_axolotl', 'meadow_koi'] },
  { name: 'sunny_bricks', hair: '#ff9a3c', skin: '#ffe0c4', shirt: '#ff5f8a', team: ['lake_lakeotter', 'desert_desertcrab', 'lake_blueduck', 'farm_goose'] },
  null, // the player
  { name: 'MoonLoaf', hair: '#1a1a24', skin: '#e2b08a', shirt: '#7be04a', team: ['desert_miragefish', 'snow_penguin', 'autumn_salmon', 'beach_dolphin', 'farm_hayotter', 'snow_seal'] },
  { name: 'TacoTurbo7', hair: '#6b3f22', skin: '#c98e64', shirt: '#ffd54a', team: ['meadow_swan', 'meadow_pondfrog', 'farm_bullfrog'] },
]

// Leaderboard stand-ins: [name, animals caught, best pull (1 in N), money/s].
export const BOARD_BOTS = [
  ['StarSprinkle', 31200, 1.2e6, 9.1e9], ['blocky_bea', 18800, 6.5e5, 7.6e9], ['NoodleKnight', 15100, 4.2e5, 6.4e9],
  ['MintyMax', 13900, 2.9e5, 5.0e9], ['ZoomZebra', 12100, 1.9e5, 4.9e8], ['CloudCobbler', 10400, 1.1e5, 4.1e8],
  ['tofu_titan', 9800, 9.0e4, 3.9e7], ['LavaLlama', 9700, 6.2e4, 3.1e6], ['GummyGolem', 9400, 4.1e4, 2.8e5],
  ['RiverRook', 9100, 2.7e4, 2.2e4], ['PebblePilot', 8000, 9.0e3, 1.0e3],
]

export const FX = {
  maxGlow: 2400, // additive particles (sparkles, motes, beams)
  maxSolid: 1800, // alpha particles (confetti, crumbs, hearts, smoke, leaves)
  maxCoins: 140,
  maxChunks: 220, // voxel food chunks that burst off a landing and bounce on the ground
  maxTexts: 24,
}

export const AUDIO = {
  volume: 0.8,
  storageKey: 'fish-for-secret-animals.sound',
  buses: { ui: 0.8, sfx: 0.9, amb: 0.5, engine: 0.5 },
  duck: 0.5, // world (ambience) level while a menu window is open
  maxVoices: 48,
  maxVoicesTouch: 24,
  latency: 0.04,
  latencyTouch: 0.07,
  lead: 0.02,
  // Generated impulse response: an open meadow inside dirt cliffs (short slap, soft tail).
  reverb: { seconds: 1.6, preDelay: 0.014, early: [[23, 0.42], [41, 0.3], [63, 0.22], [91, 0.14]], decay: 1.1, tail: 0.16, darken: 1.8, send: 0.85 },
  ambience: { wind: 0.1, birdEvery: [1.2, 4.5], bird: 0.045, cricket: 0.02 },
  stepEvery: 1.6, // m between footsteps
}
