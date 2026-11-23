// The Index window: every river area as a section (its painted scenery on the left, a grid of
// its ten animals, a progress bar "n/10" and the reward for completing it), then one section per
// seasonal event (its four event animals), a detail panel on the right with the selected
// animal's big portrait, name, rarity, catch odds, income and the page reward, and a bottom bar
// with the overall "Unlocked n/total" count and the titles earned.
// Animals you have not found are black silhouettes under "???" on their rarity colour; ones
// found since you last looked wear a NEW tag (it stays through rebuilds while you look, and is
// cleared the next time you open the window or tap the card). Portraits are drawn a few per
// frame as their cards scroll into view (snapshot.js queuePortrait). The built DOM is kept
// between HUD refreshes and only rebuilt when what it shows changes. Opening the window (or a
// new catch) scrolls the list to the selected animal's page.
import './indexWin.css'
import { AREAS, BADDIES, HUB, INDEX_BONUS, INDEX_REWARD, RARITIES, SEASONS, SEASON_GIRLS } from '../config.js'
import { season as currentSeason } from '../game/events.js'
import { fmt } from '../game/format.js'
import * as state from '../game/state.js'
import { areaArt } from './areaArt.js'
import { queuePortrait } from './snapshot.js'

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
function el(tag, cls, html) {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (html != null) e.innerHTML = html
  return e
}
// The NEW tags already looked at live in the save (state.S.seen, stored on the server).
function loadSeen() {
  return new Set(state.S.seen)
}
function saveSeen(set) {
  state.S.seen = [...set]
  state.save()
}
// Metres from the throw line to where an area starts.
const areaDistance = (a) => Math.max(0, Math.round(HUB.lane.throwLine - HUB.zones[a].from))

// Every animal the Index lists: the river's, then the seasonal events'.
const ALL = [...BADDIES, ...SEASON_GIRLS]
const SEASON_BY_ID = Object.fromEntries(SEASONS.map((s) => [s.id, s]))
const pct = Math.round(INDEX_BONUS * 100)
// What finishing a page pays right now (state.js payIndexReward).
const pageCash = () => Math.max(INDEX_REWARD.min, Math.round(state.income() * INDEX_REWARD.secs))
const chips = (area, claimed) => `<span class="chip cash">\u{1F4B0} $${fmt(pageCash())}</span><span class="chip title">\u{1F3F7}\u{FE0F} ${esc(INDEX_REWARD.title(area))}</span><span class="chip inc">+${pct}% income</span>${claimed ? '<span class="chip ok">✔ Claimed</span>' : ''}`

export function createIndexView({ sfx, girlSfx }) {
  let built = null // { root, list, detail, sig }
  let selected = null
  let seen = null
  let observer = null
  let pendingScroll = false
  const shown = new Set() // ids that wore a NEW tag in the current look

  const owned = (id) => state.owned().filter((e) => e.b.id === id).length
  const found = (id) => !!state.S.discovered[id]
  const signature = () =>
    ALL.map((b) => (found(b.id) ? 1 : 0)).join('') + '|' + Math.floor(state.range()) + '|' + state.owned().map((e) => e.b.id).join(',') + '|' + state.S.indexPaid.length + '|' + state.S.titles.length

  function cardStyle(e, def) {
    const r = RARITIES[def.rarity]
    e.style.setProperty('--c1', r.card[0])
    e.style.setProperty('--c2', r.card[1])
    e.style.setProperty('--rc', r.color)
    if (r.shimmer) e.classList.add('shimmer')
  }

  function setImg(img, id, silhouette) {
    queuePortrait(id, silhouette, (url) => {
      if (url) img.src = url
      img.classList.add('in')
    })
  }

  // The reward box under the portrait: a lane animal's page reward, or the event note.
  function rewardsHtml(def) {
    if (def.season) {
      const s = SEASON_BY_ID[def.season]
      return `<div class="ix-rewards"><b class="outline">Event animal</b><small>Only while ${esc(s.name)} runs. Every one also pays Event Tickets.</small></div>`
    }
    const area = AREAS[def.area]
    const have = state.areaFound(def.area)
    const total = area.girls.length
    const claimed = state.S.indexPaid.includes(def.area)
    return `<div class="ix-rewards"><b class="outline">${esc(area.name)} page</b><div class="chips">${chips(area, claimed)}</div><small>${claimed ? 'Page complete!' : `${have}/${total} found: finish the page to win these`}</small></div>`
  }

  function fillDetail(detail) {
    const def = ALL.find((b) => b.id === selected) ?? BADDIES[0]
    const known = found(def.id)
    const r = RARITIES[def.rarity]
    detail.className = `ix-detail${r.shimmer ? ' shimmer' : ''}${known ? '' : ' unknown'}`
    cardStyle(detail, def)
    const n = owned(def.id)
    const s = def.season ? SEASON_BY_ID[def.season] : null
    const odds = s ? '' : `1 in ${fmt(def.odds)}`
    const inc = known ? `<span class="inc">${s ? 'from ' : ''}$${fmt(def.income)}/s</span>` : ''
    const oddsLine = [odds, inc].filter(Boolean).join(' <em>•</em> ') || '<span class="inc">Event only</span>'
    const where = s ? `${s.icon} ${s.name}` : AREAS[def.area].name
    detail.innerHTML = `<div class="ix-portrait"><img alt=""><i class="ix-glow"></i></div>
      <div class="ix-info">
        <b class="ix-name outline">${known ? esc(def.name) : '???'}</b>
        <span class="ix-rarity outline">${esc(r.name)}</span>
        <span class="ix-odds outline">${oddsLine}</span>
        <small class="ix-where">${esc(where)}${known && n ? ` • You have ${n}` : ''}</small>
      </div>${rewardsHtml(def)}`
    setImg(detail.querySelector('img'), def.id, !known)
  }

  function makeCard(def, root, detail) {
    const known = found(def.id)
    const isNew = known && !seen.has(def.id)
    if (isNew) shown.add(def.id)
    const c = el('button', `ix-card${known ? '' : ' unknown'}${def.id === selected ? ' sel' : ''}`)
    c.type = 'button'
    c.dataset.id = def.id
    c.setAttribute('aria-label', known ? `${def.name}, ${RARITIES[def.rarity].name}${isNew ? ', new' : ''}` : `Undiscovered ${RARITIES[def.rarity].name} animal`)
    c.setAttribute('aria-pressed', def.id === selected ? 'true' : 'false')
    cardStyle(c, def)
    c.innerHTML = `<img alt="" data-id="${def.id}" data-sil="${known ? 0 : 1}"><span class="ix-q outline">${known ? esc(def.name) : '???'}</span>${isNew ? '<span class="ix-new outline">NEW!</span>' : ''}${known && owned(def.id) ? '<i class="ix-own"></i>' : ''}`
    c.addEventListener('click', (e) => {
      e.stopPropagation()
      // Looked at: the NEW tag goes now and is not shown again.
      if (shown.delete(def.id)) {
        seen.add(def.id)
        saveSeen(seen)
        c.querySelector('.ix-new')?.remove()
      }
      if (selected === def.id) return
      const old = root.querySelector('.ix-card.sel')
      old?.classList.remove('sel')
      old?.setAttribute('aria-pressed', 'false')
      c.classList.add('sel')
      c.setAttribute('aria-pressed', 'true')
      selected = def.id
      girlSfx.select(def.rarity, known)
      fillDetail(detail)
    })
    observer.observe(c.querySelector('img'))
    return c
  }

  function progress(have, total, extra) {
    return el('div', 'ix-prog', `<div class="bar"><i style="width:${(have / total) * 100}%"></i><span class="outline">${have}/${total}</span></div>${extra}`)
  }

  function build() {
    if (!seen) seen = loadSeen()
    shown.clear()
    const root = el('div', 'ix')
    const body = el('div', 'ix-body')
    const list = el('div', 'ix-list')
    const detail = el('div', 'ix-detail')
    body.append(list, detail)
    if (!selected || !ALL.some((b) => b.id === selected)) selected = (ALL.find((b) => found(b.id)) ?? BADDIES[0]).id
    observer?.disconnect()
    observer = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue
        const img = en.target
        observer.unobserve(img)
        setImg(img, img.dataset.id, img.dataset.sil === '1')
      }
    }, { root: list, rootMargin: '200px 0px' })
    const range = state.range()
    AREAS.forEach((area, a) => {
      const girls = BADDIES.filter((b) => b.area === a)
      const have = girls.filter((b) => found(b.id)).length
      const done = have === girls.length
      const dist = areaDistance(a)
      const locked = a > 0 && range < dist
      const sec = el('section', `ix-area${done ? ' done' : ''}${locked ? ' locked' : ''}`)
      sec.style.setProperty('--b1', area.banner[0])
      sec.style.setProperty('--b2', area.banner[1])
      const art = el('div', 'ix-art', `<img alt="" src="${areaArt(area.id)}"><span class="ix-art-tag outline">AREA ${a + 1}</span><b class="ix-art-name outline">${esc(area.name)}</b>${locked ? `<span class="ix-lock outline">\u{1F512} Cast ${dist} m</span>` : ''}`)
      const main = el('div', 'ix-main')
      const cards = el('div', 'ix-cards')
      for (const def of girls) cards.appendChild(makeCard(def, root, detail))
      main.append(cards, progress(have, girls.length, `<div class="chips">${chips(area, state.S.indexPaid.includes(a))}</div>`))
      sec.append(art, main)
      list.appendChild(sec)
    })
    // Seasonal events: four animals each, no page bonus, only while the season runs.
    const live = currentSeason().season.id
    list.appendChild(el('h3', 'ix-divider outline', 'Event animals'))
    for (const s of SEASONS) {
      const girls = SEASON_GIRLS.filter((g) => g.season === s.id)
      const have = girls.filter((g) => found(g.id)).length
      const done = have === girls.length
      const sec = el('section', `ix-area ix-season${done ? ' done' : ''}`)
      sec.style.setProperty('--b1', s.banner[0])
      sec.style.setProperty('--b2', s.banner[1])
      const art = el('div', 'ix-art season', `<span class="ix-season-icon">${s.icon}</span><span class="ix-art-tag outline">${s.id === live ? 'LIVE NOW' : 'EVENT'}</span><b class="ix-art-name outline">${esc(s.name)}</b>`)
      const main = el('div', 'ix-main')
      const cards = el('div', 'ix-cards four')
      for (const def of girls) cards.appendChild(makeCard(def, root, detail))
      main.append(cards, progress(have, girls.length, `<small class="outline">${s.id === live ? 'Catch them now!' : 'Back when the season returns'}</small>`))
      sec.append(art, main)
      list.appendChild(sec)
    }
    fillDetail(detail)

    // Bottom bar: overall count, titles earned, what the green dot means.
    const got = ALL.filter((b) => found(b.id)).length
    const titles = state.S.titles.length
      ? state.S.titles.map((t) => `<b class="ix-title">${esc(t)}</b>`).join('')
      : '<small>Finish a page to earn a title</small>'
    const foot = el('div', 'ix-foot', `<div class="ix-unlock"><i style="width:${(got / ALL.length) * 100}%"></i><span class="outline">Unlocked: ${got}/${ALL.length}</span></div>
      <div class="ix-meta"><div class="ix-titles"><span>\u{1F3F7}\u{FE0F} Titles</span>${titles}</div><small class="ix-legend"><i class="ix-own"></i> You own one</small></div>`)
    root.append(body, foot)
    return { root, list, detail, sig: signature() }
  }

  function scrollToSelected(b) {
    const sec = b.list.querySelector('.ix-card.sel')?.closest('.ix-area')
    if (sec) b.list.scrollTop = Math.max(0, sec.offsetTop - 4)
  }

  function render(body, sub) {
    const got = ALL.filter((b) => found(b.id)).length
    const bonus = Math.round((state.indexMult() - 1) * 100)
    sub.textContent = `${got}/${ALL.length} found${bonus ? ` • +${bonus}% income` : ''}`
    const sig = signature()
    const scroll = built?.list.scrollTop ?? 0
    if (!built || built.sig !== sig) built = build()
    body.appendChild(built.root)
    if (pendingScroll) {
      pendingScroll = false
      const b = built
      scrollToSelected(b)
      requestAnimationFrame(() => scrollToSelected(b)) // again once the window has its size
    } else built.list.scrollTop = scroll
  }

  return {
    render,
    // Opening fresh: tags from the last look are done with, start at the selected animal's page and give the page a sound.
    opened() {
      girlSfx.indexOpen()
      if (!seen) seen = loadSeen()
      if (shown.size) {
        for (const id of shown) seen.add(id)
        shown.clear()
        saveSeen(seen)
      }
      built = null
      pendingScroll = true
    },
    // Jump to (and select) an animal, e.g. right after she was caught.
    focus(id) {
      selected = id
      built = null
      pendingScroll = true
    },
  }
}
