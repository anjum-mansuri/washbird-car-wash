# Washbird Car Care — Site Design & Animations

How the public site looks and moves, what can be switched on/off, and where each piece lives in the code. (Business content — prices, offers, reviews, text — is still edited from `/admin`; see [PROJECT-NOTES.md](PROJECT-NOTES.md).)

**Live site:** https://washbird-car-wash.vercel.app

---

## 1. Gen Z look (always on)

Bold, playful style built on top of the same layout and admin-editable content.

| Element | What it does |
|---|---|
| Fonts | **Bricolage Grotesque** for headings, **Manrope** for body text (Google Fonts) |
| Cards | Thick black outline + hard offset shadow ("neo-brutal"), lift on hover |
| Labels | Sticker-style tilted pills (e.g. "💸 Menu & prices") |
| Hero | Words of the headline pop in one by one; last two words get a moving gradient; rating counts up from 0; rising soap bubbles; "🫧 fresh. clean. iconic." sticker |
| Ticker tapes | Two crossing scrolling strips under the hero (service names + selling points) |
| Services | 3D tilt + cursor spotlight on desktop; "🔥 Most booked" tag wiggles; prices bounce when the vehicle type changes |
| Reviews | Styled as chat bubbles |
| Gallery | Tilted polaroid photos; click opens full-size lightbox |
| Booking | Emoji confetti burst on a successful booking; button reads "Lock in my slot 🚀" |
| Extras | Gradient scroll-progress bar at the top; giant gradient "Washbird" wordmark in the footer; magnetic primary buttons |

Headings were rewritten in a Gen Z voice ("Pick your glow-up ✨", "Deals that hit different", "The people have spoken", "Fresh outta the bay", "Pull up 📍"). These headings are **hard-coded** in `src/views/site.js`, not editable in the admin.

**Files:** `public/css/site.css`, `public/js/site.js`, `src/views/site.js`

---

## 2. Diwali festive theme (switchable)

A festive skin layered on top of the Gen Z look.

- **Marigold toran** (flowers, mango leaves, bells) hanging under the header — stays visible while scrolling
- **Night-sky hero** with live canvas **fireworks** (tap/click the sky to launch your own), twinkling stars and floating **sky lanterns**
- A row of **flickering diyas** at the bottom of the hero and a slowly rotating **rangoli**
- "✨ Shubh Deepavali ✨" greeting and a glowing "🪔 Happy Diwali!" sticker
- Saffron / gold / rani-pink / maroon palette across the whole site; faint rangoli in section corners
- Marigold + maroon ticker tapes with 🪔 separators and "Shubh Deepavali 🪔" in the scroll
- Golden sparkle trail following the mouse (desktop); 🪔🎆🌼✨ confetti on booking
- Booking form sticker: "🪔 Diwali slots filling fast" (change in `public/css/diwali.css` if not accurate)

### Turning it on / off

**Admin → Settings → Look & currency → Festive theme**

| Option | Behaviour |
|---|---|
| **Auto** (default) | On from **3 weeks before Diwali until 1 week after**, then off automatically. Built-in Diwali dates: 2026-11-08, 2027-10-29, 2028-10-17, 2029-11-05, 2030-10-26 |
| Diwali — always on | Forces the Diwali look regardless of date |
| Off | Normal Gen Z look only |

After 2030, add more dates to `DIWALI_DATES` in `src/views/diwali.js`.

**Files:** `src/views/diwali.js` (on/off logic + hero layers), `public/css/diwali.css` (only loaded while the theme is on), `public/img/toran.svg`, `public/img/rangoli.svg`, fireworks/sparkle code in `public/js/site.js`

---

## 3. Washbird mascot bird

A little bird styled after the logo — blue body, blue cap with a white **W**, silver wings with gold edges (plus a tiny marigold garland during Diwali).

1. **On page open:** flies in from the right, swoops across the hero leaving a trail (golden sparkles in Diwali, blue water drops otherwise), turns around and **lands on the top rim of the header logo**. The logo glows and sparkles as it lands.
2. **While perched:** stays on the logo (scrolls with the header), breathes, blinks, tilts its head and flutters now and then.
3. **When tapped/clicked:** says a random line in a speech bubble ("Wheee! 💨", "Shine time! ✨", "Tweet tweet! 🎶", "Happy Diwali! 🪔"), takes off, flies a loop around the screen and lands back on the logo. Tapping the bird does **not** open the home link.

**Files:** bird drawing + flight logic in `public/js/site.js` (search `Washbird mascot`), styles in `public/css/site.css` (search `Washbird mascot`)

---

## Accessibility

Visitors whose device has **"reduce motion"** turned on get the same design without the animations (no bird flight, fireworks, lanterns, bubbles, tickers or reveals).

## Testing done

- Desktop (1366px) and phone (390px) widths: no horizontal scroll, no script errors
- Booking confetti tested with a mocked request (no test booking saved)
- Bird: entrance, perching after scroll, tap-to-fly on mouse and touch, repeat taps
- Fixed along the way: coupon-code row overflowing the booking form on narrow phones
