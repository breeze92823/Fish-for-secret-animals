// The tackle windows (hud.js hosts them): "Rods & Bait" (tabs ROD / BAIT: one row of tall rarity
// cards, 3D portraits of the models, owned / locked / price buttons, an ODDS popup per bait) and the
// "Trail Shop" (a grid of trails, each with a live particle preview and TRY IT). Everything costs
// money, never premium currency (root CLAUDE.md). Built once per opening; state changes only repaint
// the buttons (update()), so scrolling and animations never restart while a window is open.
import './tackleShop.css'
import { AREAS, BAITS, FOOD_RARITIES, FOODS, RARITIES, TRAILS } from '../config.js'
import { fmt } from '../game/format.js'
import * as state from '../game/state.js'
import { baitPortrait, foodPortrait } from './snapshot.js'

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const num = (n) => (Number.isInteger(n) ? String(n) : n < 10 ? n.toFixed(2).replace(/0$/, '') : n.toFixed(1).replace(/\.0$/, ''))
const el = (tag, cls, html) => {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (html != null) e.innerHTML = html
  return e
}
const BURST = ['#ffffff', '#ffe14a', '#7dff4a', '#4fc8ff', '#ff6aa0', '#c07dff']
const pct = (p) => (p >= 0.1 ? `${(p * 100).toFixed(p >= 0.995 ? 0 : 1)}%` : p >= 0.001 ? `${(p * 100).toFixed(2)}%` : p > 0 ? `1 in ${fmt(Math.round(1 / p))}` : '0%')

function burst(card, color) {
  const fx = el('div', 'tk-burst')
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('i')
    const a = (i / 24) * Math.PI * 2 + Math.random() * 0.3
    const d = 30 + Math.random() * 45
    p.style.setProperty('--dx', `${Math.cos(a) * d}cqw`)
    p.style.setProperty('--dy', `${Math.sin(a) * d * 0.8 - 10}cqh`)
    p.style.setProperty('--r', `${Math.random() * 720 - 360}deg`)
    p.style.background = i % 3 === 0 ? color : BURST[i % BURST.length]
    p.style.animationDelay = `${Math.random() * 60}ms`
    fx.appendChild(p)
  }
  card.appendChild(fx)
  setTimeout(() => fx.remove(), 1100)
}
function replay(e, cls) {
  e.classList.remove(cls)
  void e.offsetWidth
  e.classList.add(cls)
}

// ============================ Live particle previews (Trail Shop cards) ============================
// A small 2D version of fx/trails.js: the same emitters drawn on a canvas behind a glowing streak.
const previews = new Set()
let loopOn = false
let lastT = 0
const rr = (a, b) => a + Math.random() * (b - a)
function drawSprite(g, kind, x, y, s, rot, col) {
  g.save()
  g.translate(x, y)
  g.rotate(rot)
  g.fillStyle = col
  g.strokeStyle = col
  switch (kind) {
    case 'sparkle':
      g.beginPath()
      for (let i = 0; i < 8; i++) {
        const r = i % 2 ? s * 0.18 : s
        const a = (i / 8) * Math.PI * 2
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      g.fill()
      break
    case 'star':
      g.beginPath()
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? s * 0.45 : s
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      g.fill()
      break
    case 'heart':
      g.beginPath()
      g.moveTo(0, s * 0.7)
      g.bezierCurveTo(-s * 1.2, -s * 0.1, -s * 0.5, -s * 0.9, 0, -s * 0.3)
      g.bezierCurveTo(s * 0.5, -s * 0.9, s * 1.2, -s * 0.1, 0, s * 0.7)
      g.fill()
      break
    case 'square':
    case 'crumb':
      g.fillRect(-s * 0.5, -s * 0.3, s, s * 0.6)
      break
    case 'leaf':
    case 'petal':
    case 'feather':
      g.beginPath()
      g.ellipse(0, 0, s, s * (kind === 'feather' ? 0.28 : 0.5), 0, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = 'rgba(0,0,0,0.25)'
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(-s, 0)
      g.lineTo(s, 0)
      g.stroke()
      break
    case 'snow':
      g.lineWidth = Math.max(1, s * 0.25)
      for (let i = 0; i < 3; i++) {
        g.rotate(Math.PI / 3)
        g.beginPath()
        g.moveTo(-s, 0)
        g.lineTo(s, 0)
        g.stroke()
      }
      break
    case 'bubble':
      g.lineWidth = Math.max(1, s * 0.16)
      g.globalAlpha *= 0.85
      g.beginPath()
      g.arc(0, 0, s, 0, Math.PI * 2)
      g.stroke()
      g.fillStyle = '#fff'
      g.beginPath()
      g.arc(-s * 0.35, -s * 0.35, s * 0.2, 0, Math.PI * 2)
      g.fill()
      break
    case 'flame': {
      const gr = g.createRadialGradient(0, s * 0.2, 0, 0, 0, s)
      gr.addColorStop(0, '#fff6c0')
      gr.addColorStop(0.45, col)
      gr.addColorStop(1, 'rgba(255,60,0,0)')
      g.fillStyle = gr
      g.beginPath()
      g.moveTo(0, -s * 1.3)
      g.quadraticCurveTo(s, 0, 0, s)
      g.quadraticCurveTo(-s, 0, 0, -s * 1.3)
      g.fill()
      break
    }
    case 'note':
      g.font = `${s * 2.4}px sans-serif`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText('♪', 0, 0)
      break
    case 'gem':
      g.beginPath()
      g.moveTo(0, -s)
      g.lineTo(s * 0.8, 0)
      g.lineTo(0, s)
      g.lineTo(-s * 0.8, 0)
      g.closePath()
      g.fill()
      g.fillStyle = 'rgba(255,255,255,0.55)'
      g.beginPath()
      g.moveTo(0, -s)
      g.lineTo(s * 0.8, 0)
      g.lineTo(0, 0)
      g.fill()
      break
    case 'ring':
      g.lineWidth = Math.max(1.5, s * 0.15)
      g.beginPath()
      g.arc(0, 0, s, 0, Math.PI * 2)
      g.stroke()
      break
    case 'smoke':
    default: {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, s)
      gr.addColorStop(0, col)
      gr.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = gr
      g.beginPath()
      g.arc(0, 0, s, 0, Math.PI * 2)
      g.fill()
    }
  }
  g.restore()
}
function ribbonGrad(g, def, x0, x1, t) {
  const gr = g.createLinearGradient(x0, 0, x1, 0)
  const r = def.ribbon
  if (r === 'rainbow') {
    for (let i = 0; i <= 6; i++) gr.addColorStop(i / 6, `hsla(${((t * 60 + i * 55) % 360).toFixed(0)},100%,62%,${(1 - i / 6) * 0.95})`)
  } else if (Array.isArray(r)) {
    gr.addColorStop(0, r[0])
    gr.addColorStop(0.35, r[1])
    gr.addColorStop(1, 'rgba(255,255,255,0)')
  } else {
    gr.addColorStop(0, 'rgba(255,255,255,0.8)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
  }
  return gr
}
function stepPreview(pv, dt, t) {
  const { c, g, def, ps } = pv
  const W = c.width
  const H = c.height
  const hx = W * 0.27
  const hy = H * 0.5 + Math.sin(t * 2.2) * 3
  for (const part of def.parts) {
    let n = part.rate * dt * 1.1
    let cnt = Math.floor(n)
    if (Math.random() < n - cnt) cnt++
    for (let i = 0; i < cnt && ps.length < 110; i++) {
      const col = part.hue ? `hsl(${(((part.hueBase ?? 0) + (t * 0.7 + Math.random() * 0.25) * (part.hueSpan ?? 1)) % 1) * 360},100%,62%)` : part.c[(Math.random() * part.c.length) | 0]
      ps.push({
        part,
        col,
        x: hx + rr(-4, 4),
        y: hy + rr(-6, 6),
        vx: part.back * 70 + rr(30, 90),
        vy: -part.up * 36 * rr(0.4, 1.4) + rr(-part.spread, part.spread) * 62,
        life: 0,
        max: rr(part.life[0], part.life[1]) * 1.15,
        size: rr(part.size[0], part.size[1]) * 46,
        rot: rr(0, 6.28),
        spin: part.spin ? rr(-part.spin, part.spin) : 0,
      })
    }
  }
  g.clearRect(0, 0, W, H)
  const bg = g.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#171326')
  bg.addColorStop(1, '#0b0916')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)
  // The streak: soft wide band, brighter band, white core, fading to the right.
  g.globalCompositeOperation = 'lighter'
  for (const [h, a] of [[H * 0.2, 0.3], [H * 0.1, 0.65], [H * 0.04, 1]]) {
    g.globalAlpha = a
    g.fillStyle = a === 1 ? ribbonGrad(g, { ribbon: ['#fffdf0', '#ffe9a8'] }, hx, W, t) : ribbonGrad(g, def, hx, W, t)
    g.fillRect(hx, hy - h / 2, W - hx, h)
  }
  g.globalAlpha = 1
  const head = g.createRadialGradient(hx, hy, 0, hx, hy, H * 0.2)
  head.addColorStop(0, '#ffffff')
  head.addColorStop(0.3, def.parts[0].c[0].startsWith('#') ? def.parts[0].c[0] : '#ffffff')
  head.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = head
  g.beginPath()
  g.arc(hx, hy, H * 0.2, 0, Math.PI * 2)
  g.fill()
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i]
    p.life += dt
    if (p.life >= p.max) {
      ps.splice(i, 1)
      continue
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy -= p.part.grav * 22 * dt
    p.rot += p.spin * dt
    const k = p.life / p.max
    g.globalCompositeOperation = p.part.glow ? 'lighter' : 'source-over'
    g.globalAlpha = Math.min(1, k * 8) * (1 - k * k)
    drawSprite(g, p.part.s, p.x, p.y, p.size * (p.part.s === 'smoke' ? 1 + k : 1 - k * 0.4), p.rot, p.col)
  }
  g.globalAlpha = 1
  g.globalCompositeOperation = 'source-over'
}
function previewLoop(now) {
  const t = now / 1000
  const dt = Math.min(0.05, t - lastT || 0.016)
  lastT = t
  for (const pv of previews) {
    if (!pv.c.isConnected) {
      previews.delete(pv)
      continue
    }
    if (pv.vis) stepPreview(pv, dt, t)
  }
  if (previews.size) requestAnimationFrame(previewLoop)
  else loopOn = false
}
const seen = typeof IntersectionObserver === 'function' ? new IntersectionObserver((es) => es.forEach((e) => (e.target.__pv.vis = e.isIntersecting)), { threshold: 0 }) : null
function addPreview(canvas, def) {
  const pv = { c: canvas, g: canvas.getContext('2d'), def, ps: [], vis: !seen }
  canvas.__pv = pv
  seen?.observe(canvas)
  previews.add(pv)
  if (!loopOn) {
    loopOn = true
    lastT = performance.now() / 1000
    requestAnimationFrame(previewLoop)
  }
}

// ======================================== The shop factory ========================================
export function createTackleShop({ sfx, toast, celebrate, onTrailTry }) {
  // --- Portraits are rendered a couple per frame (nearest the view first) so opening is instant ---
  let queue = []
  let pumping = false
  function pump() {
    if (!queue.length) {
      pumping = false
      return
    }
    pumping = true
    for (let i = 0; i < 2 && queue.length; i++) {
      const c = queue.shift()
      if (!c.el.isConnected) continue
      const img = c.el.querySelector('.tk-art img')
      img.src = c.kind === 'bait' ? baitPortrait(c.def.id) : foodPortrait(c.def.id)
      img.classList.add('ready')
    }
    requestAnimationFrame(pump)
  }

  // ================================= Rods & Bait =================================
  let cards = new Map() // key -> { el, btn, btn2?, def, kind, state }
  let track = null
  let pill = null
  let lastIdx = -1
  let curTab = 'rods'
  let winBody = null
  let tabsEl = null
  let dragMoved = false
  let down = null
  let winWired = false

  const rodState = (def) => (state.S.food === def.id ? 'eq' : state.S.foods.includes(def.id) ? 'own' : state.rodLock(def.id) ? 'lock' : state.S.money >= def.price ? 'buy' : 'poor')
  function paintRod(c) {
    const s = rodState(c.def)
    if (c.state === s) return
    c.state = s
    const lock = s === 'lock' ? state.rodLock(c.def.id) : null
    c.el.classList.toggle('owned', s === 'own' || s === 'eq')
    c.el.classList.toggle('equipped', s === 'eq')
    c.el.classList.toggle('locked', s === 'lock')
    c.btn.className = `tk-btn ${s === 'eq' ? 'eq' : s === 'buy' || s === 'own' ? 'go' : s === 'lock' ? 'lock' : ''}`
    c.btn.querySelector('span').innerHTML = s === 'eq' ? 'Equipped' : s === 'own' ? 'Equip' : `${s === 'lock' ? '<i class="tk-lockico"></i>' : ''}$${fmt(c.def.price)}`
    c.note.textContent = s === 'own' || s === 'eq' ? 'Owned' : lock ? `Buy ${lock.name} first` : `Range ${num(c.def.dist)} m`
  }
  function pressRod(c) {
    const s = rodState(c.def)
    const r = FOOD_RARITIES[c.def.rarity]
    if (s === 'eq') {
      sfx.tick()
      replay(c.el, 'nudge')
      return
    }
    if (s === 'own') {
      state.equipFood(c.def.id)
      sfx.equip()
      sfx.foodEquip?.(r.fx)
      replay(c.el, 'pop')
      update()
      return
    }
    if (s === 'lock') {
      sfx.deny()
      replay(c.btn, 'shake')
      toast?.(`Buy ${state.rodLock(c.def.id)?.name ?? 'the rod before it'} first`, 'warn')
      return
    }
    if (!state.buyFood(c.def.id)) {
      sfx.deny()
      replay(c.btn, 'shake')
      return
    }
    sfx.foodBuy?.(r.fx)
    sfx.rodPower?.(r.fx, c.def.tier)
    replay(c.el, 'bought')
    burst(c.el, r.glow)
    if (r.fx >= 3) celebrate?.()
    toast?.(`New rod: ${c.def.name}! Range ${num(c.def.dist)} m • Luck x${num(c.def.luck)}`, 'good')
    update()
  }
  function rodCard(def, i) {
    const r = FOOD_RARITIES[def.rarity]
    const e = cardShell(def, r, i, 'rod')
    e.innerHTML = `<div class="tk-fx"></div><div class="tk-name">${esc(def.name)}</div><div class="tk-sub">${esc(def.special ? r.name : r.name)}</div>${artHtml(r, i)}<div class="tk-note"></div><div class="tk-luck"><b>x${num(def.luck)}</b> Luck</div><button class="tk-btn" data-silent><span></span></button>`
    const c = { el: e, btn: e.querySelector('.tk-btn'), note: e.querySelector('.tk-note'), def, kind: 'rod', state: '' }
    c.btn.addEventListener('click', (ev) => {
      ev.stopPropagation()
      if (!dragMoved) pressRod(c)
    })
    return c
  }

  const baitEq = (def) => state.S.bait === def.id && state.baitCount(def.id) > 0
  function paintBait(c) {
    const price = state.baitPrice(c.def)
    const have = state.baitCount(c.def.id)
    const s = `${state.S.money >= price ? 'buy' : 'poor'}|${have}|${baitEq(c.def) ? 1 : 0}|${c.def.dyn ? price : 0}`
    if (c.state === s) return
    c.state = s
    c.btn.className = `tk-btn ${state.S.money >= price ? 'go' : ''}`
    c.btn.querySelector('span').textContent = `$${fmt(price)}`
    c.note.textContent = have > 0 ? `Pack of ${c.def.pack} • Have ${have}` : `Pack of ${c.def.pack}`
    c.el.classList.toggle('owned', have > 0)
    c.el.classList.toggle('equipped', baitEq(c.def))
    c.btn2.style.display = have > 0 ? '' : 'none'
    c.btn2.className = `tk-btn2 ${baitEq(c.def) ? 'eq' : 'go'}`
    c.btn2.textContent = baitEq(c.def) ? 'Equipped' : 'Equip'
  }
  function pressBait(c) {
    const r = FOOD_RARITIES[c.def.rarity]
    if (!state.buyBait(c.def.id)) {
      sfx.deny()
      replay(c.btn, 'shake')
      return
    }
    sfx.baitBuy?.(r.fx, !!c.def.guarantee)
    replay(c.el, 'bought')
    burst(c.el, r.glow)
    if (r.fx >= 4 || c.def.guarantee) celebrate?.()
    toast?.(`${c.def.name} x${c.def.pack} added! ${c.def.guarantee ? 'Your next cast is a guaranteed Secret.' : `Luck x${c.def.luck} on every cast.`}`, 'good')
    update()
  }
  function baitCard(def, i) {
    const r = FOOD_RARITIES[def.rarity]
    const e = cardShell(def, r, i, 'bait')
    if (def.guarantee) e.classList.add('jackpot')
    e.innerHTML = `<div class="tk-fx"></div><div class="tk-name">${esc(def.name)}</div><div class="tk-sub">${esc(r.name)}</div><button class="tk-odds" data-silent>ODDS</button>${artHtml(r, i, `<i class="tk-badge">x${def.pack}</i>`)}<div class="tk-note"></div>${def.guarantee ? `<div class="tk-guar">${esc(def.note)}</div>` : `<div class="tk-luck"><b>x${num(def.luck)}</b> Luck</div>`}<button class="tk-btn" data-silent><span></span></button><button class="tk-btn2" data-silent></button>`
    const c = { el: e, btn: e.querySelector('.tk-btn'), btn2: e.querySelector('.tk-btn2'), note: e.querySelector('.tk-note'), def, kind: 'bait', state: '' }
    c.btn.addEventListener('click', (ev) => {
      ev.stopPropagation()
      if (!dragMoved) pressBait(c)
    })
    c.btn2.addEventListener('click', (ev) => {
      ev.stopPropagation()
      if (dragMoved) return
      const was = baitEq(def)
      if (state.equipBait(def.id)) {
        sfx.equip()
        sfx.baitEquip?.(r.fx, was)
        replay(e, 'pop')
        update()
      }
    })
    e.querySelector('.tk-odds').addEventListener('click', (ev) => {
      ev.stopPropagation()
      if (!dragMoved) oddsPopup(def)
    })
    return c
  }
  function cardShell(def, r, i, kind) {
    const e = el('div', `tk-card r-${r.key} k-${kind}`)
    e.style.setProperty('--glow', r.glow)
    e.style.setProperty('--len', String(Math.max(8, def.name.length)))
    e.style.setProperty('--d', `${Math.min(i, 6) * 45}ms`)
    e.style.setProperty('--bob', `${(i % 5) * -0.55}s`)
    return e
  }
  function artHtml(r, i, extra = '') {
    const tw = r.fx >= 6 ? Array.from({ length: 6 }, (_, k) => `<b class="tk-tw" style="left:${10 + ((k * 37 + i * 13) % 78)}%;top:${6 + ((k * 23 + i * 7) % 68)}%;animation-delay:${(k * 0.43 + i * 0.17) % 2}s"></b>`).join('') : ''
    const rays = r.fx >= 4 ? '<div class="tk-rays"></div>' : ''
    return `<div class="tk-art">${rays}<div class="tk-halo"></div>${tw}<img alt="" draggable="false">${extra}</div>`
  }

  // --- The ODDS popup: chance of each animal rarity for this bait in an area ---
  function oddsPopup(def) {
    winBody.querySelector('.tk-pop')?.remove()
    let area = Math.max(0, Math.min(AREAS.length - 1, state.S.stats.bestArea ?? 0))
    const pop = el('div', 'tk-pop')
    const L = () => (state.luck() / state.baitLuck()) * def.luck
    const draw = () => {
      const odds = state.oddsFor(area, L(), def.guarantee ?? 0)
      const by = new Map()
      for (const o of odds) by.set(o.rarity, (by.get(o.rarity) ?? 0) + o.p)
      const rows = [...by.entries()].sort((a, b) => a[0] - b[0])
      pop.innerHTML = `<div class="tk-pop-box"><div class="tk-pop-head"><b>${esc(def.name)} odds</b><button class="tk-pop-x" data-silent>X</button></div><div class="tk-pop-area"><button class="tk-nav" data-d="-1">&lt;</button><span>${esc(AREAS[area].name)}</span><button class="tk-nav" data-d="1">&gt;</button></div><div class="tk-pop-rows">${rows
        .map(([ri, p]) => `<div class="tk-pop-row" style="--c:${RARITIES[ri].color}"><span>${esc(RARITIES[ri].name)}</span><i><u style="width:${Math.max(2, p * 100)}%"></u></i><em>${pct(p)}</em></div>`)
        .join('')}</div><small>Luck x${num(L())}${def.guarantee ? ' • always a Secret or better' : ''}</small></div>`
      pop.querySelector('.tk-pop-x').onclick = () => pop.remove()
      pop.querySelectorAll('.tk-nav').forEach((b) => {
        b.onclick = () => {
          area = (area + Number(b.dataset.d) + AREAS.length) % AREAS.length
          sfx.tick()
          draw()
        }
      })
    }
    pop.addEventListener('click', (e) => e.target === pop && pop.remove())
    draw()
    winBody.appendChild(pop)
    sfx.tick()
  }

  // --- Scrolling: wheel -> horizontal, mouse drag, ticks as cards pass, the position pill ---
  function step() {
    const a = track.children[0]
    const b = track.children[1]
    return a && b ? Math.max(1, b.offsetLeft - a.offsetLeft) : 1
  }
  function onScroll() {
    const max = track.scrollWidth - track.clientWidth
    const w = Math.min(1, track.clientWidth / Math.max(1, track.scrollWidth))
    pill.style.width = `${Math.max(8, w * 100)}%`
    pill.style.left = `${max > 0 ? (track.scrollLeft / max) * (100 - Math.max(8, w * 100)) : 0}%`
    const idx = Math.round(track.scrollLeft / step())
    if (idx !== lastIdx) {
      if (lastIdx >= 0) sfx.tick()
      lastIdx = idx
    }
  }
  function wire() {
    track.addEventListener('scroll', onScroll, { passive: true })
    track.addEventListener(
      'wheel',
      (e) => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
        e.preventDefault()
        track.scrollBy({ left: e.deltaY * 1.4, behavior: 'smooth' })
      },
      { passive: false },
    )
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      down = { x: e.clientX, left: track.scrollLeft }
      dragMoved = false
    })
    if (winWired) return
    winWired = true
    window.addEventListener('pointermove', (e) => {
      if (!down || !track) return
      const dx = e.clientX - down.x
      if (Math.abs(dx) > 6 && !dragMoved) {
        dragMoved = true
        track.classList.add('dragging')
      }
      if (dragMoved) track.scrollLeft = down.left - dx
    })
    window.addEventListener('pointerup', () => {
      if (!down) return
      down = null
      track?.classList.remove('dragging')
      setTimeout(() => (dragMoved = false), 0)
    })
  }

  function fill(tab) {
    curTab = tab
    cards = new Map()
    winBody.querySelectorAll('.tk-wrap, .tk-pop').forEach((n) => n.remove())
    tabsEl?.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab))
    const wrap = el('div', 'tk-wrap')
    track = el('div', 'tk-track')
    const bar = el('div', 'tk-scroll')
    pill = document.createElement('i')
    bar.appendChild(pill)
    const list = tab === 'rods' ? FOODS : BAITS
    list.forEach((def, i) => {
      const c = tab === 'rods' ? rodCard(def, i) : baitCard(def, i)
      cards.set(def.id, c)
      track.appendChild(c.el)
    })
    wrap.append(track, bar)
    winBody.appendChild(wrap)
    wire()
    update()
    // Open on what you would buy next, with the one before it in view.
    const all = [...cards.values()]
    let next = 0
    if (tab === 'rods') next = Math.max(0, all.findIndex((c) => !c.def.special && (c.state === 'buy' || c.state === 'poor' || c.state === 'lock')))
    else next = Math.max(0, all.findIndex((c) => state.baitCount(c.def.id) === 0 && state.S.money >= state.baitPrice(c.def) * 0.02))
    const target = Math.max(0, next - 1)
    lastIdx = -1
    track.scrollTo({ left: target * step(), behavior: 'instant' })
    onScroll()
    queue = all.map((c) => ({ c, d: Math.abs(all.indexOf(c) - target - 1) })).sort((a, b) => a.d - b.d).map((e) => e.c)
    if (!pumping) requestAnimationFrame(pump)
  }
  function renderRods(body, startTab) {
    winBody = body
    const head = body.parentElement.querySelector('.win-head')
    head.querySelector('.tk-tabs')?.remove()
    tabsEl = el('div', 'tk-tabs', '<button class="tk-tab" data-tab="rods" data-silent>RODS</button><button class="tk-tab" data-tab="baits" data-silent>BAIT</button>')
    head.insertBefore(tabsEl, head.querySelector('.win-x'))
    tabsEl.querySelectorAll('button').forEach((b) =>
      b.addEventListener('click', () => {
        if (curTab === b.dataset.tab) return
        sfx.tick()
        fill(b.dataset.tab)
      }),
    )
    fill(startTab)
  }
  function update() {
    for (const c of cards.values()) (c.kind === 'rod' ? paintRod : paintBait)(c)
  }

  // ===================================== Trail Shop =====================================
  let tcards = new Map()
  const trailState = (def) => (state.S.trail === def.id ? 'eq' : state.S.trails.includes(def.id) ? 'own' : state.S.money >= def.price ? 'buy' : 'poor')
  function paintTrail(c) {
    const s = `${trailState(c.def)}|${state.trailTrial() === c.def.id ? 1 : 0}`
    if (c.state === s) return
    c.state = s
    const st = s.split('|')[0]
    c.el.classList.toggle('owned', st === 'own' || st === 'eq')
    c.el.classList.toggle('equipped', st === 'eq')
    c.el.classList.toggle('trying', s.endsWith('|1'))
    c.btn.className = `tk-btn ${st === 'eq' ? 'eq' : st === 'poor' ? '' : 'go'}`
    c.btn.querySelector('span').textContent = st === 'eq' ? 'Equipped' : st === 'own' ? 'Equip' : `$${fmt(c.def.price)}`
    c.try.querySelector('span').textContent = s.endsWith('|1') ? 'TRYING!' : 'TRY IT'
  }
  function pressTrail(c) {
    const st = trailState(c.def)
    const r = FOOD_RARITIES[c.def.rarity]
    if (st === 'eq' || st === 'own') {
      state.equipTrail(c.def.id)
      sfx.equip()
      sfx.trailTry?.(r.fx)
      replay(c.el, 'pop')
      updateTrails()
      return
    }
    if (!state.buyTrail(c.def.id)) {
      sfx.deny()
      replay(c.btn, 'shake')
      return
    }
    sfx.trailBuy?.(r.fx)
    replay(c.el, 'bought')
    burst(c.el, r.glow)
    if (r.fx >= 3) celebrate?.()
    onTrailTry?.(c.def)
    toast?.(`New trail: ${c.def.name}! It follows your rod everywhere.`, 'good')
    updateTrails()
  }
  function renderTrails(body) {
    const head = body.parentElement.querySelector('.win-head')
    head.querySelector('.tk-ticon')?.remove()
    head.insertBefore(el('span', 'tk-ticon', '<i></i><i></i><i></i>'), head.firstChild)
    body.appendChild(el('div', 'tr-intro', '<b>A trail follows your rod everywhere you go!</b><small>Your cast\'s bobber leaves it too as it flies out.</small>'))
    const grid = el('div', 'tr-grid')
    tcards = new Map()
    TRAILS.forEach((def, i) => {
      const r = FOOD_RARITIES[def.rarity]
      const e = el('div', `tr-card r-${r.key}`)
      e.style.setProperty('--glow', r.glow)
      e.style.setProperty('--d', `${Math.min(i, 8) * 35}ms`)
      e.innerHTML = `<div class="tr-name" style="--len:${Math.max(8, def.name.length)}">${esc(def.name)}</div><div class="tr-view"><canvas width="240" height="132"></canvas></div><button class="tk-btn" data-silent><span></span></button><button class="tr-try" data-silent><span></span></button>`
      const c = { el: e, btn: e.querySelector('.tk-btn'), try: e.querySelector('.tr-try'), def, state: '' }
      c.btn.addEventListener('click', (ev) => {
        ev.stopPropagation()
        pressTrail(c)
      })
      c.try.addEventListener('click', (ev) => {
        ev.stopPropagation()
        state.tryTrail(def.id)
        sfx.trailTry?.(r.fx)
        onTrailTry?.(def)
        toast?.(`Trying ${def.name}: cast to see it! (${state.S.trails.includes(def.id) ? 'tap Equip to keep it' : 'buy it to keep it'})`, 'good')
        updateTrails()
      })
      tcards.set(def.id, c)
      grid.appendChild(e)
      addPreview(e.querySelector('canvas'), def)
    })
    body.appendChild(grid)
    updateTrails()
  }
  function updateTrails() {
    for (const c of tcards.values()) paintTrail(c)
  }

  return {
    rods: { render: (b) => renderRods(b, 'rods'), update },
    baits: { render: (b) => renderRods(b, 'baits'), update },
    trails: { render: renderTrails, update: updateTrails },
  }
}

// Render rod portraits during idle time after boot so the shop opens fully drawn.
export function warmTackle() {
  const jobs = [...FOODS.map((f) => () => foodPortrait(f.id)), ...BAITS.map((b) => () => baitPortrait(b.id))]
  const idle = window.requestIdleCallback ?? ((fn) => setTimeout(() => fn({ timeRemaining: () => 8 }), 120))
  const next = (dl) => {
    while (jobs.length && dl.timeRemaining() > 6) jobs.shift()()
    if (jobs.length) idle(next)
  }
  idle(next)
}
