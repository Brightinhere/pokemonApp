/* Prototype rendering helpers. Real data from src/data, rendered without a framework. */
const { chart } = window.DEX
const TYPES = Object.keys(chart)

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const dexNo = (n) => `#${String(n).padStart(4, '0')}`
const bst = (s) => s.hp + s.attack + s.defense + s.specialAttack + s.specialDefense + s.speed
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  )

const typeChip = (t, extra = '') =>
  `<span class="type ${extra}" style="--chip-bg: var(--color-type-${t}); --chip-fg: var(--color-type-${t}-fg)">${cap(t)}</span>`

const multiplier = (attack, types) => types.reduce((m, t) => m * chart[attack][t], 1)

const MARKS = {
  4: ['x4', '<i></i><i></i>', 'takes 4×'],
  2: ['x2', '<i></i>', 'takes 2×'],
  1: ['x1', '<i></i>', 'takes 1×'],
  0.5: ['half', '<i></i>', 'takes ½×'],
  0.25: ['quarter', '<i></i>', 'takes ¼×'],
  0: ['immune', '<i></i>', 'immune'],
}

const mark = (m, extra = '') => {
  const [cls, inner, label] = MARKS[m]
  return `<span class="mark mark--${cls} ${extra}" role="img" aria-label="${label}">${inner}</span>`
}

const formBadge = (e) =>
  ({
    mega: 'Battle-only Mega form',
    gmax: 'Battle-only Gigantamax form',
    regional: 'Regional form',
  })[e.formCategory] ?? ''

const appBar = (current) => `
  <header class="appbar">
    <div class="appbar__inner">
      <a class="brand" href="index.html">Squad Lab</a>
      <nav class="nav" aria-label="Main">
        <a href="index.html" ${current === 'dex' ? 'aria-current="page"' : ''}>Pokédex</a>
        <a href="squad.html" ${current === 'squad' ? 'aria-current="page"' : ''}>Squads</a>
      </nav>
      <a class="tray" href="squad.html" aria-label="Current squad: Kanto run, 5 of 6">
        <span class="tray__label">Kanto run</span>
        ${window.DEX.squad
          .map(
            (p) =>
              `<span class="tray__slot"><img src="${p.sprite}" alt="" width="32" height="32"></span>`,
          )
          .join('')}
        <span class="tray__slot tray__slot--empty"></span>
        <span class="tray__count">Squad ${window.DEX.squad.length}/6</span>
      </a>
    </div>
  </header>`
