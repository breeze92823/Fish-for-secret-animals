// The throw-sequence overlay (game/throw.js drives it): power meter + "CLICK TO CAST!",
// Exit / Auto buttons, the money-priced Lucky Throw offer, the in-flight luck counter and
// zone banner, "Click to continue", the name typewriter + rarity card, and the screen
// effects (letterbox bars, vignette, coloured flash, speed lines, wipe transition).
// Everything is DOM + CSS in relative units; one full-screen tap layer takes the "tap"
// (mouse, touch or pen) so it works the same on phones.
import './throwUi.css'
import { RARITIES, VARIANTS } from '../config.js'
import { fmt } from '../game/format.js'

function el(tag, cls, html = '') {
  const e = document.createElement(tag)
  e.className = cls
  e.innerHTML = html
  return e
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const CLOVER = `<svg viewBox="0 0 64 64"><g fill="#3fd23a" stroke="#14601a" stroke-width="3">
<circle cx="22" cy="22" r="13"/><circle cx="42" cy="22" r="13"/><circle cx="22" cy="42" r="13"/><circle cx="42" cy="42" r="13"/></g>
<g fill="#8af06a"><circle cx="18" cy="18" r="4"/><circle cx="38" cy="18" r="4"/><circle cx="18" cy="38" r="4"/><circle cx="38" cy="38" r="4"/></g>
<rect x="29" y="29" width="6" height="6" fill="#14601a"/></svg>`
const ARM = `<svg viewBox="0 0 64 64"><path d="M14 50c-4-10 0-22 8-30l6-8c3-3 8-1 7 3l-2 8 10-3c8-2 15 4 14 12-1 10-9 17-20 18H22c-4 0-7-0-8 0z" fill="#ffc531" stroke="#5a3a00" stroke-width="4" stroke-linejoin="round"/></svg>`

// The cast banner's letter colours per style (each letter: a light top fading into its colour).
const CAST_STYLES = {
  rainbow: ['#ff5ad8', '#ff7a4a', '#ffb02a', '#ffe14a', '#b8ff3a', '#5aff8a', '#4ae8ff', '#5aa8ff', '#9a7dff', '#e07dff'],
  lime: ['#d4ff3a', '#9aff3a', '#5aff8a', '#4affd0'],
  lucky: ['#7dff4a', '#ffe14a'],
  gold: ['#ffe14a', '#ffc02a'],
  weak: ['#ffa86a', '#ff8a4a'],
}
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16)
  const f = (v) => Math.round(Math.max(0, Math.min(255, v * k)))
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}
const CONFETTI = ['#ff4a6a', '#ff8a3a', '#ffd23a', '#7dff4a', '#3ae8c0', '#4ab0ff', '#c07dff', '#ff7ad8']

export function createThrowUi({ onTap, onExit, onAuto, onLucky }) {
  const root = el('div', 'tu')
  root.id = 'throw-ui'
  const tap = el('div', 'tu-tap')
  const bars = el('div', 'tu-bars', '<i></i><i></i>')
  const vignette = el('div', 'tu-vignette')
  const speed = el('div', 'tu-speed')
  const flash = el('div', 'tu-flash')
  const wipe = el('div', 'tu-wipe')
  const side = el('div', 'tu-side')
  const exitBtn = el('button', 'tu-btn exit', '<span class="outline">Exit</span>')
  const autoBtn = el('button', 'tu-btn auto', '<span class="outline">Auto: OFF</span>')
  side.append(exitBtn, autoBtn)
  const lucky = el('button', 'tu-lucky', `<span class="clover">${CLOVER}</span><span class="txt"><small class="outline">Lucky Cast!</small><b class="outline">100x LUCK</b></span><em class="price outline">$0</em>`)
  const meter = el('div', 'tu-meter', `<div class="tube"><i class="perfect"></i><i class="great"></i><b class="slider"></b></div><div class="gain outline">${ARM}<span>+1</span></div>`)
  const tapText = el('div', 'tu-taptext outline', matchMedia('(pointer: coarse)').matches ? 'TAP TO CAST!' : 'CLICK TO CAST!')
  const grade = el('div', 'tu-grade outline')
  const luck = el('div', 'tu-luck', '<div class="cloud"><b class="outline">1.00X</b><small class="outline">LUCK</small></div><div class="zone outline"></div>')
  const cont = el('div', 'tu-continue outline')
  const reveal = el('div', 'tu-reveal', '<div class="card"><div class="tag outline"></div><div class="vtag outline"></div><div class="name outline"></div><div class="income"><span class="outline"></span></div><div class="new outline">NEW!</div><div class="full outline">HOTBAR FULL!</div><i class="shine"></i></div>')
  // PERFECT streak badge (under the meter while aiming): "x3 STREAK +30% LUCK".
  const streakEl = el('div', 'tu-streak outline')
  // Your Power, bottom-left in the letterbox bar while aiming (like the hub's counter).
  const power = el('div', 'tu-power', `${ARM}<b class="outline">0</b>`)
  // The animal's-eye view while the bait hangs in the water: dark lens ring, a recording tag, focus
  // brackets that tighten on the bait, a "!" when it spots it and a thought caption.
  const pov = el('div', 'tu-pov', '<div class="lens"></div><div class="rec"><i></i><b class="outline">ANIMAL VIEW</b></div><div class="reticle"><i></i><i></i><i></i><i></i></div><div class="alert outline">!</div><div class="thought outline"></div>')
  const povThought = pov.querySelector('.thought')
  // The cast show (game/throw.js lockIn): a screen frame (speed rays, grid, glowing edges), the big
  // "PERFECT CAST!" banner with its bonus line, and flat confetti bursting out round you.
  const cast = el('div', 'tu-cast', '<div class="frame"><i class="rays"></i><i class="rays r2"></i><i class="grid"></i><i class="edge"></i></div><div class="bits"></div><div class="title"></div><div class="sub"></div>')
  const castTitle = cast.querySelector('.title')
  const castSub = cast.querySelector('.sub')
  const castBits = cast.querySelector('.bits')
  root.append(tap, vignette, speed, pov, bars, cast, luck, meter, tapText, grade, streakEl, power, side, lucky, reveal, cont, flash, wipe)
  document.body.appendChild(root)

  const slider = meter.querySelector('.slider')
  const gainVal = meter.querySelector('.gain span')
  const luckVal = luck.querySelector('b')
  const zoneEl = luck.querySelector('.zone')
  const card = reveal.querySelector('.card')
  const tagEl = reveal.querySelector('.tag')
  const nameEl = reveal.querySelector('.name')
  const incomeEl = reveal.querySelector('.income span')
  const vtagEl = reveal.querySelector('.vtag')
  const priceEl = lucky.querySelector('.price')
  const isTouch = () => document.body.classList.contains('touch-ui') || matchMedia('(pointer: coarse)').matches

  // Taps: the full-screen layer (any pointer) plus Space / Enter / F / E.
  tap.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    onTap()
  })
  window.addEventListener('keydown', (e) => {
    if (!phase || e.repeat) return
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyF' || e.code === 'KeyE') {
      e.preventDefault()
      e.stopImmediatePropagation()
      onTap()
    } else if (e.code === 'Escape' || e.code === 'KeyQ') {
      if (exitable) {
        e.stopImmediatePropagation()
        onExit()
      }
    }
  }, { capture: true })
  for (const b of [exitBtn, autoBtn, lucky]) b.addEventListener('pointerdown', (e) => e.stopPropagation())
  exitBtn.addEventListener('click', () => onExit())
  autoBtn.addEventListener('click', () => onAuto())
  lucky.addEventListener('click', () => onLucky())

  const restart = (node, cls) => {
    node.classList.remove(cls)
    void node.offsetWidth
    node.classList.add(cls)
  }
  let typeTimer = 0
  let castTimer = 0
  let phase = ''
  let boxed = false
  let exitable = false
  const sync = () => {
    root.className = phase ? `tu on ph-${phase}${boxed ? ' boxed' : ''}${exitable ? ' can-exit' : ''}` : 'tu'
  }

  return {
    // Phase names become classes on the root ("ph-aim", "ph-flight", ...); CSS shows what fits.
    setPhase(name) {
      phase = name
      sync()
    },
    hide() {
      phase = ''
      boxed = exitable = false
      sync()
    },
    canExit(on) {
      exitable = on
      sync()
    },
    setMeter(v) {
      slider.style.bottom = `${(v * 100).toFixed(2)}%`
    },
    setGain(n) {
      gainVal.textContent = `+${fmt(n)}`
    },
    grade(text, color) {
      grade.textContent = text
      grade.style.color = color
      restart(grade, 'show')
      restart(meter, 'locked')
    },
    // The cast show: { title, style, frame, label, items: [{ t, c }], screen, life } (THROW_MODE.castFx).
    castShow({ title, style = 'gold', frame = '', label = '', items = [], screen = 0, life = 2.2 }) {
      clearTimeout(castTimer)
      const cols = CAST_STYLES[style] ?? CAST_STYLES.gold
      let i = 0
      castTitle.innerHTML = [...title]
        .map((ch) => {
          if (ch === ' ') return '<span class="gap"></span>'
          const c = cols[i % cols.length]
          const html = `<span class="ch" style="--i:${i};--c:${c};--c2:${shade(c, 0.72)};--rot:${(i % 2 ? 1 : -1) * (2 + (i % 3))}deg"><i>${esc(ch)}</i><b>${esc(ch)}</b></span>`
          i++
          return html
        })
        .join('')
      castSub.innerHTML = (label ? `<span class="lbl outline">${esc(label)}</span>` : '') + items.map((it, j) => `${j ? '<span class="dot outline">&bull;</span>' : ''}<span class="it outline" style="color:${it.c}">${esc(it.t)}</span>`).join('')
      // Flat confetti cubes bursting out from round you (the middle of the screen) and tumbling down.
      let bits = ''
      for (let j = 0; j < screen; j++) {
        const a = (j / screen) * Math.PI * 2 + Math.random() * 0.4
        const r = 22 + Math.random() * 26
        bits += `<i style="--c:${CONFETTI[j % CONFETTI.length]};--tx:${(Math.cos(a) * r * 1.3).toFixed(1)}vw;--ty:${(Math.sin(a) * r - 8).toFixed(1)}vh;--r:${Math.round(Math.random() * 720 - 360)}deg;--dl:${(Math.random() * 0.25).toFixed(2)}s;--d:${(1.4 + Math.random() * 0.9).toFixed(2)}s;--s:${(0.7 + Math.random() * 0.8).toFixed(2)}"></i>`
      }
      castBits.innerHTML = bits
      cast.className = `tu-cast s-${style}${frame ? ` f-${frame}` : ''}`
      cast.style.setProperty('--life', `${life}s`)
      restart(cast, 'go')
      restart(meter, 'locked')
      castTimer = setTimeout(() => this.hideCast(), life * 1000 + 100)
    },
    hideCast() {
      clearTimeout(castTimer)
      cast.className = 'tu-cast'
      castBits.innerHTML = ''
    },
    setLuck(x, bump = false) {
      luckVal.textContent = `${x >= 100 ? fmt(x) : x.toFixed(2)}X`
      if (bump) restart(luck, 'bump')
    },
    zone(name, color) {
      zoneEl.textContent = name
      zoneEl.style.setProperty('--zc', color)
      restart(zoneEl, 'slam')
    },
    setSpeed(k) {
      speed.style.opacity = String(Math.max(0, Math.min(1, k)))
    },
    letterbox(on) {
      boxed = on
      sync()
    },
    // Animal's-eye view on / off (the overlay fades in with the cut underwater).
    pov(on) {
      pov.classList.toggle('show', on)
      if (!on) {
        pov.classList.remove('spot', 'lunge', 'beat')
        pov.style.setProperty('--pk', '0')
        povThought.textContent = ''
      }
    },
    // 0..1: how close the bait is (tightens the brackets and the lens).
    povLevel(k) {
      pov.style.setProperty('--pk', k.toFixed(3))
    },
    povThought(text) {
      if (povThought.textContent === text) return
      povThought.textContent = text
      restart(povThought, 'pop')
    },
    // The animal spots the bait: the "!" pops and the brackets lock on.
    povSpot() {
      pov.classList.add('spot')
      restart(pov, 'ping')
    },
    povBeat() {
      restart(pov, 'beat')
    },
    povLunge() {
      pov.classList.add('lunge')
    },
    vignette(color, k = 1) {
      vignette.style.setProperty('--vc', color)
      vignette.style.opacity = String(k)
    },
    flash(color = '#ffffff', strength = 0.8, dur = 0.45) {
      flash.style.setProperty('--fc', color)
      flash.style.setProperty('--fa', String(strength))
      flash.style.setProperty('--fd', `${dur}s`)
      restart(flash, 'go')
    },
    // A diagonal wipe: covers the screen, calls mid() while covered, then uncovers.
    wipe(mid, color = '#ffd23a') {
      wipe.style.setProperty('--wc', color)
      restart(wipe, 'go')
      setTimeout(() => mid?.(), 330)
    },
    showContinue(on, text) {
      cont.textContent = text ?? (isTouch() ? 'Tap to continue' : 'Click to continue')
      cont.classList.toggle('show', on)
    },
    // The dark panel typing the name out letter by letter; onLetter(i) per letter, done() at the end.
    typeName(name, every, onLetter, done) {
      clearInterval(typeTimer)
      reveal.className = 'tu-reveal typing'
      card.style.removeProperty('--rc')
      tagEl.textContent = ''
      incomeEl.textContent = ''
      let i = 0
      nameEl.textContent = '_'
      typeTimer = setInterval(() => {
        i++
        nameEl.textContent = name.slice(0, i) + (i < name.length ? '_' : '')
        if (name[i - 1] !== ' ') onLetter?.(i)
        if (i >= name.length) {
          clearInterval(typeTimer)
          setTimeout(() => done?.(), 260)
        }
      }, every * 1000)
    },
    // variant: VARIANTS index (GOLD / DIAMOND / RAINBOW stamp); season: the season's name for a season girl.
    card({ rarity, name, income, isNew, full, variant = 0, season = '' }) {
      const r = RARITIES[rarity]
      card.style.setProperty('--rc', r.color)
      card.style.setProperty('--rg', r.glow)
      tagEl.textContent = r.name.toUpperCase()
      nameEl.innerHTML = `${esc(name)}${isNew ? '<em class="new-tag outline">NEW!</em>' : ''}`
      incomeEl.innerHTML = `<i>$${esc(fmt(income))}</i>/s`
      const V = VARIANTS[variant]
      vtagEl.textContent = V?.name ? `✨ ${V.name} x${V.mult}` : season ? `\u{1F389} ${season}` : ''
      vtagEl.style.setProperty('--vc', V?.name ? V.color : '#ff9ad8')
      reveal.className = `tu-reveal carded r${rarity}${isNew ? ' is-new' : ''}${full ? ' is-full' : ''}${vtagEl.textContent ? ' has-v' : ''}${V?.rainbow ? ' rainbow' : ''}`
    },
    setPower(n) {
      power.querySelector('b').textContent = fmt(n)
    },
    setStreak(n, mult) {
      streakEl.textContent = n >= 2 ? `\u{1F525} x${n} STREAK  +${Math.round((mult - 1) * 100)}% LUCK` : ''
      streakEl.classList.toggle('on', n >= 2)
      if (n >= 2) {
        streakEl.classList.remove('pop')
        void streakEl.offsetWidth
        streakEl.classList.add('pop')
      }
    },
    hideReveal() {
      clearInterval(typeTimer)
      reveal.className = 'tu-reveal'
    },
    setAuto(on) {
      autoBtn.classList.toggle('on', on)
      autoBtn.querySelector('span').textContent = on ? 'Auto: ON' : 'Auto: OFF'
    },
    setLucky({ price, armed, afford, free, mult }) {
      priceEl.textContent = armed ? 'ARMED!' : free ? 'FREE' : `$${fmt(price)}`
      lucky.querySelector('b').textContent = `${mult}x LUCK`
      lucky.classList.toggle('armed', armed)
      lucky.classList.toggle('poor', !armed && !afford)
    },
    tapText(text) {
      tapText.textContent = text
    },
  }
}
