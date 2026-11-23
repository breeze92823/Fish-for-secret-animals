import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Fog,
  HemisphereLight,
  Mesh,
  PMREMGenerator,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { FOG, LIGHT, TIME_OF_DAY } from './config.js'
import { mulberry32 } from './textures.js'

// All scene lighting, blended between two moods (TIME_OF_DAY.day / .night):
//  - a sky shader: zenith / mid / horizon gradient, a sunset glow pooled on the horizon,
//    streaky warm-lit clouds, a nebula band, a sun / moon disc; dot stars + sparkle stars
//  - image-based lighting: the sky is baked into a PMREM environment map, so
//    every PBR material picks up matching ambient light and reflections
//    (re-baked as the mood changes)
//  - a hemisphere fill + one shadow-casting directional sun whose shadow box
//    follows the player (full shadow resolution over a small area)
//  - warm point-light lamps that switch on at night, with emissive bulbs
//  - distance fog in the horizon colour, stars at night, and tone-mapping
//    exposure, all following the same blend.
const SKY_RADIUS = 500

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`
// The sky: a three-stop gradient (zenith / mid / horizon), a sunset glow that pools on the
// horizon toward glowDir (the far end of the river), streaky clouds lit warm on the glow side and
// dark on the other, a faint nebula band, and the sun / moon disc at glowDir.
const skyFragment = /* glsl */ `
  uniform vec3 top;
  uniform vec3 mid;
  uniform vec3 bottom;
  uniform vec3 glow;
  uniform vec3 sunDir;
  uniform vec3 sunColor;
  uniform vec3 cloudLit;
  uniform vec3 cloudDark;
  uniform float clouds;
  uniform float nebula;
  uniform float uTime;
  varying vec3 vDir;
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 5; i++) {
      s += a * n2(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return s;
  }
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = mix(bottom, mid, smoothstep(-0.02, 0.09, h));
    col = mix(col, top, smoothstep(0.07, 0.42, h));
    // Sunset glow: strongest low on the horizon toward the sun, a wide warm wash elsewhere.
    vec2 hd = normalize(d.xz + vec2(1e-5));
    vec2 gd = normalize(sunDir.xz + vec2(1e-5));
    float az = max(dot(hd, gd), 0.0);
    float band = exp(-max(h, 0.0) * 9.0);
    col += glow * band * (0.25 + 0.95 * pow(az, 4.0));
    // Nebula: a soft band of blue-violet across the sky.
    float nd = dot(d, normalize(vec3(0.55, 0.35, -0.75)));
    float neb = exp(-nd * nd * 22.0) * fbm(d.xy * 5.0 + d.zx * 3.0) * smoothstep(0.05, 0.4, h);
    col += mix(vec3(0.18, 0.3, 0.95), vec3(0.75, 0.3, 0.9), fbm(d.zy * 3.0)) * neb * nebula;
    // Clouds: long wispy streaks between the horizon and half way up.
    vec2 uv = d.xz / (h + 0.22);
    float c = fbm(vec2(uv.x * 1.1 + uv.y * 0.6, uv.y * 3.2 - uv.x * 0.9) + vec2(uTime * 0.006, 0.0));
    c = smoothstep(0.52, 0.82, c) * smoothstep(0.015, 0.1, h) * (1.0 - smoothstep(0.32, 0.7, h)) * clouds;
    float lit = clamp(pow(az, 1.6) * 0.75 + (1.0 - smoothstep(0.0, 0.35, h)) * 0.45, 0.0, 1.0);
    col = mix(col, mix(cloudDark, cloudLit, lit), c);
    // Sun / moon disc + halo.
    float sd = max(dot(d, sunDir), 0.0);
    col += sunColor * (pow(sd, 2200.0) * 1.6 + pow(sd, 90.0) * 0.18);
    col = mix(col, bottom * 0.8, smoothstep(0.0, -0.25, h)); // darker below the horizon
    gl_FragColor = vec4(col, 1.0);
  }`

function sunDirection(elevationDeg, azimuthDeg, out) {
  const el = (elevationDeg * Math.PI) / 180
  const az = (azimuthDeg * Math.PI) / 180
  return out.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize()
}

function makeStars(count = 1400) {
  const rand = mulberry32(7)
  const pos = []
  for (let i = 0; i < count; i++) {
    const u = rand() * Math.PI * 2
    const v = Math.acos(rand() * 0.95) // upper hemisphere only
    const r = SKY_RADIUS * 0.9
    pos.push(Math.sin(v) * Math.cos(u) * r, Math.cos(v) * r, Math.sin(v) * Math.sin(u) * r)
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
  const mat = new PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false, blending: AdditiveBlending })
  const stars = new Points(geo, mat)
  stars.renderOrder = -1
  return stars
}

// A few big four-point sparkle stars (like the reference sky), on a canvas sprite.
function makeSparkles(count = 46) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const x = c.getContext('2d')
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.12, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.3, 'rgba(200,220,255,0.25)')
  g.addColorStop(1, 'rgba(200,220,255,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 64, 64)
  x.fillStyle = 'rgba(255,255,255,0.95)'
  for (const [w, hh] of [[2.5, 30], [30, 2.5]]) {
    x.beginPath()
    x.ellipse(32, 32, w, hh, 0, 0, Math.PI * 2)
    x.fill()
  }
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  const rand = mulberry32(19)
  const pos = []
  for (let i = 0; i < count; i++) {
    const u = rand() * Math.PI * 2
    const v = Math.acos(0.25 + rand() * 0.72)
    const r = SKY_RADIUS * 0.88
    pos.push(Math.sin(v) * Math.cos(u) * r, Math.cos(v) * r, Math.sin(v) * Math.sin(u) * r)
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
  const mat = new PointsMaterial({ map: tex, color: 0xffffff, size: 18, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false, blending: AdditiveBlending })
  const p = new Points(geo, mat)
  p.renderOrder = -1
  return p
}

// Shared with world.js: the colour the 3D puff clouds take in the current mood.
export const skyTint = { puff: new Color('#ffffff'), puffGlow: new Color('#dcebff'), puffGlowK: 0.6 }

export function createLighting(scene, renderer, preset) {
  // The two moods in use: TIME_OF_DAY, or a world's own sky (setMoods).
  let D = TIME_OF_DAY.day
  let N = TIME_OF_DAY.night

  // --- Sky + stars ---
  const skyMaterial = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new Color(D.zenith) },
      mid: { value: new Color(D.mid ?? D.zenith) },
      bottom: { value: new Color(D.horizon) },
      glow: { value: new Color(D.glow ?? '#000000') },
      sunDir: { value: new Vector3(0, 1, 0) },
      sunColor: { value: new Color(D.sunColor) },
      cloudLit: { value: new Color(D.cloudLit ?? '#ffffff') },
      cloudDark: { value: new Color(D.cloudDark ?? '#ffffff') },
      clouds: { value: 0 },
      nebula: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
  })
  const sky = new Mesh(new SphereGeometry(SKY_RADIUS, 48, 24), skyMaterial)
  sky.renderOrder = -2
  sky.frustumCulled = false
  const stars = makeStars()
  const sparkles = makeSparkles()
  scene.add(sky, stars, sparkles)

  scene.fog = new Fog(D.horizon, FOG.near, FOG.far)

  // --- Lights ---
  const hemi = new HemisphereLight(D.hemiSky, D.hemiGround, D.hemiIntensity)
  const sun = new DirectionalLight(D.sunColor, D.sunIntensity)
  sun.castShadow = preset.shadows
  sun.shadow.mapSize.set(preset.shadowMap, preset.shadowMap)
  const r = LIGHT.shadowRange
  Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 220 })
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.03
  scene.add(hemi, sun, sun.target)

  // --- Image-based lighting: bake the sky into an environment map ---
  const pmrem = new PMREMGenerator(renderer)
  const envScene = new Scene()
  envScene.add(new Mesh(sky.geometry, skyMaterial))
  let envTarget = null
  let bakedAt = -1
  function bakeEnvironment(night) {
    const next = pmrem.fromScene(envScene, 0, 1, SKY_RADIUS * 2)
    envTarget?.dispose()
    envTarget = next
    scene.environment = next.texture
    bakedAt = night
  }

  // --- Lamps (none placed right now) ---
  const lamps = [] // { light, bulb }
  function addLamp(x, y, z, bulbMaterial) {
    const light = new PointLight(LIGHT.lampColor, 0, LIGHT.lampDistance, 2)
    light.position.set(x, y, z)
    scene.add(light)
    lamps.push({ light, bulb: bulbMaterial })
    apply()
    return light
  }

  // --- Day/night blend ---
  let night = 0 // 0 = day, 1 = night
  let target = 0
  const dir = new Vector3()
  const tmpA = new Vector3()
  const tmpB = new Vector3()
  const c = new Color()
  const lerp = (a, b, t) => a + (b - a) * t
  // Mood keys with fallbacks (a world's own sky may not set the newer ones).
  const FALL = { mid: 'zenith', glowColor: null, fog: 'horizon', lightColor: 'sunColor', cloudLit: null, cloudDark: null, puff: null, puffGlow: null }
  const get = (M, key) => M[key] ?? (FALL[key] ? M[FALL[key]] : null) ?? (key === 'puff' ? '#ffffff' : key === 'puffGlow' ? '#dcebff' : key.startsWith('cloud') ? '#ffffff' : '#000000')
  const mix = (key, out) => out.set(get(D, key)).lerp(c.set(get(N, key)), night)
  const num = (key, def) => lerp(D[key] ?? def, N[key] ?? def, night)

  function apply() {
    const t = night
    const U = skyMaterial.uniforms
    mix('zenith', U.top.value)
    mix('mid', U.mid.value)
    mix('horizon', U.bottom.value)
    mix('glowColor', U.glow.value)
    mix('sunColor', U.sunColor.value)
    mix('cloudLit', U.cloudLit.value)
    mix('cloudDark', U.cloudDark.value)
    U.clouds.value = num('clouds', 0)
    U.nebula.value = num('nebula', 0)
    mix('fog', scene.fog.color)
    mix('lightColor', sun.color)
    mix('puff', skyTint.puff)
    mix('puffGlow', skyTint.puffGlow)
    skyTint.puffGlowK = num('puffGlowK', 0.6)
    mix('hemiSky', hemi.color)
    mix('hemiGround', hemi.groundColor)
    sun.intensity = lerp(D.sunIntensity, N.sunIntensity, t)
    hemi.intensity = lerp(D.hemiIntensity, N.hemiIntensity, t)
    scene.environmentIntensity = lerp(D.envIntensity, N.envIntensity, t)
    renderer.toneMappingExposure = lerp(D.exposure, N.exposure, t)
    stars.material.opacity = lerp(D.stars, N.stars, t)
    sparkles.material.opacity = lerp(D.stars, N.stars, t) * 0.9
    // Sun and moon are different directions: slerp-ish via normalised lerp of the two. The light
    // shines from sunElevation / sunAzimuth; the disc + glow sit at discElevation / discAzimuth
    // (a low sunset at the far end of the river while the light keeps the hub readable).
    sunDirection(D.sunElevation, D.sunAzimuth, tmpA)
    sunDirection(N.sunElevation, N.sunAzimuth, tmpB)
    dir.lerpVectors(tmpA, tmpB, t).normalize()
    sunDirection(D.discElevation ?? D.sunElevation, D.discAzimuth ?? D.sunAzimuth, tmpA)
    sunDirection(N.discElevation ?? N.sunElevation, N.discAzimuth ?? N.sunAzimuth, tmpB)
    skyMaterial.uniforms.sunDir.value.lerpVectors(tmpA, tmpB, t).normalize()
    const lampLevel = lerp(D.lampIntensity, N.lampIntensity, t)
    for (const lamp of lamps) {
      lamp.light.intensity = lampLevel
      lamp.bulb.emissiveIntensity = 0.3 + (lampLevel / N.lampIntensity) * 3
    }
  }

  apply()
  bakeEnvironment(0)

  return {
    sun,
    addLamp,
    isNight: () => target === 1,
    // A world's sky { day, night } (WORLDS): swapped at once, keeping day or night as it is.
    setMoods(sky) {
      if (sky.day === D && sky.night === N) return
      D = sky.day
      N = sky.night
      apply()
      bakeEnvironment(night)
    },
    toggleDayNight() {
      target = target === 1 ? 0 : 1
    },
    setShadows(next) {
      sun.castShadow = next.shadows
      if (sun.shadow.mapSize.x !== next.shadowMap) {
        sun.shadow.mapSize.set(next.shadowMap, next.shadowMap)
        sun.shadow.map?.dispose()
        sun.shadow.map = null
      }
    },
    // Called every frame with the player's position so the sun's shadow box and the sky follow them.
    update(dt, focus) {
      if (night !== target) {
        const stepAmount = dt / TIME_OF_DAY.transition
        night = target > night ? Math.min(target, night + stepAmount) : Math.max(target, night - stepAmount)
        apply()
        if (Math.abs(night - bakedAt) > 0.08 || night === target) bakeEnvironment(night)
      }
      skyMaterial.uniforms.uTime.value += dt
      sky.position.set(focus.x, 0, focus.z)
      stars.position.copy(sky.position)
      sparkles.position.copy(sky.position)
      sun.position.set(focus.x + dir.x * 90, focus.y + dir.y * 90, focus.z + dir.z * 90)
      sun.target.position.set(focus.x, focus.y, focus.z)
      sun.target.updateMatrixWorld()
    },
  }
}
