/**
 * Diwali festive skin for the public site: on/off logic plus the extra hero layers
 * (sky lanterns, twinkles, fireworks canvas, rangoli, a row of diyas).
 */

// Diwali (Lakshmi Puja) dates; "auto" mode runs from 3 weeks before to 1 week after.
const DIWALI_DATES = ['2026-11-08', '2027-10-29', '2028-10-17', '2029-11-05', '2030-10-26'];
const DAY = 86400000;

/** Admin setting 'diwali' forces the skin on, 'off' disables it, 'auto' (default) follows the calendar. */
function diwaliOn(s, today) {
  const mode = s.festiveTheme || 'auto';
  if (mode === 'diwali') return true;
  if (mode !== 'auto') return false;
  const t = Date.parse(today + 'T00:00:00Z');
  return DIWALI_DATES.some((d) => {
    const dt = Date.parse(d + 'T00:00:00Z');
    return t >= dt - 21 * DAY && t <= dt + 7 * DAY;
  });
}

/** Clay diya with a flickering flame (inline so CSS can animate the flame). */
function diya(i) {
  return `<svg class="diya" style="--i:${i}" viewBox="0 0 64 56" aria-hidden="true">
    <defs>
      <radialGradient id="fl${i}" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#fff7c2"/><stop offset=".45" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff7a1a"/></radialGradient>
      <linearGradient id="cl${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2571b"/><stop offset="1" stop-color="#7c2d12"/></linearGradient>
    </defs>
    <circle class="diya-glow" cx="32" cy="18" r="18" fill="#ffb400"/>
    <path class="diya-flame" d="M32 4 C38 14 39 20 32 27 C25 20 26 14 32 4 Z" fill="url(#fl${i})"/>
    <path d="M6 30 Q32 26 58 30 Q54 50 32 51 Q10 50 6 30 Z" fill="url(#cl${i})"/>
    <path d="M6 30 Q32 26 58 30 Q32 35 6 30 Z" fill="#9a3412"/>
    <path d="M12 38 Q32 44 52 38" fill="none" stroke="#ffd23f" stroke-width="1.6" stroke-dasharray="1 4" stroke-linecap="round"/>
    <path d="M58 30 L63 27 L60 33 Z" fill="#c2410c"/>
  </svg>`;
}

/** Extra hero layers shown while the Diwali skin is on (fixed pseudo-random spread so markup is stable). */
function renderDiwaliHero() {
  const lanterns = Array.from({ length: 9 }, (_, i) => {
    const x = (i * 41 + 7) % 96;
    const size = 18 + ((i * 13) % 16);
    const dur = 16 + ((i * 7) % 10);
    const delay = -((i * 23) % 22);
    return `<span class="lantern" style="--x:${x}%;--s:${size}px;--d:${dur}s;--delay:${delay}s"></span>`;
  }).join('');
  const twinkles = Array.from({ length: 28 }, (_, i) =>
    `<span class="twinkle" style="left:${(i * 47 + 3) % 100}%;top:${(i * 29 + 5) % 70}%;--d:${(2 + (i % 5) * 0.7).toFixed(1)}s;--delay:-${(i * 0.37).toFixed(2)}s"></span>`
  ).join('');
  return `<canvas class="fireworks" aria-hidden="true"></canvas>
    <div class="sky" aria-hidden="true">${twinkles}${lanterns}</div>
    <img class="hero-rangoli" src="/img/rangoli.svg" alt="" aria-hidden="true">
    <div class="diyas" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => diya(i)).join('')}</div>`;
}

module.exports = { diwaliOn, renderDiwaliHero };
