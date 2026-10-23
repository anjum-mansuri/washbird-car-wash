# Washbird Car Care — Project Notes

Working notes for this project: what it is, current state, what's still a placeholder, and how to pick it back up. (For end-user / setup docs, see [README.md](README.md). For the site's look, Diwali theme and the mascot bird, see [SITE-DESIGN.md](SITE-DESIGN.md).)

## What this is

A dynamic car wash website with a full admin panel — every price, offer, photo, and page of text is editable from `/admin` with no code changes. Built with Node.js + Express, JSON file storage (`data/db.json`), no external database.

## Branding

- **Business name**: Washbird Car Care
- **Owner**: Mikaeel Mansuri (credited in the About section and site footer)
- **Instagram**: [instagram.com/washbird_](https://instagram.com/washbird_) — branding (name, logo style, bio tagline) was matched to this profile
- **Logo**: [public/img/washbird-logo.jpeg](public/img/washbird-logo.jpeg) — the real logo file, supplied directly and dropped into the project. Shown in the site header as a circular crop (CSS `border-radius: 50%` in `public/css/site.css`) so only the badge shows, not the square navy background. (An earlier hand-drawn placeholder, `public/img/logo.svg`, is no longer used but still sits in the repo.)
- **Currency**: Indian Rupees (₹), prices set for the Indian market

## Current services (editable anytime from Services tab)

Replaced the original generic wash menu with the 4 real packages, in this order:

| Order | Package | Price | Billing |
|---|---|---|---|
| 1 | Daily Exterior Shine | ₹1,199 | /month |
| 2 | Celebrity Care ⭐ *Most Booked* | ₹1,999 | /month — includes 2 Full Comfort Washes/month |
| 3 | Full Comfort Wash | ₹549 | per wash — includes pickup & drop |
| 4 | Deep Interior Wash | **Starting from** ₹2,499 | per visit |

Vehicle types: Hatchback (base), Sedan (×1.15), SUV/MUV (×1.35) — multiplier applies to all 4 packages.

Deep Interior Wash is flagged "price varies" (a per-service checkbox in Services → Edit), so it shows as "Starting from ₹2,499" everywhere a price appears — the service card, its WhatsApp message, and the booking form's price estimate — instead of one fixed number.

## Booking form features

- **Coupon codes**: the booking form has a Coupon Code field + Apply button. It checks the code against Offers' promo codes and, if that offer has a discount value set, shows the discount and the new price live. **To make a code actually work**, open Admin → Offers → edit the offer and set *Discount type* (Percent/Flat) and *Discount value* — the `code` field alone is just text until that's set. Currently configured: `MIDWEEK25` (25% off), `FIRSTDETAIL` (₹300 flat off).
- **Live price estimate**: recalculates automatically as the customer changes Service, Vehicle, or applies a coupon.
- **Per-service time slots**: a service can carry its own custom list of bookable times (Services → Edit → "Custom booking time slots"). When such a service is selected in the booking form, the Time field relabels to "Preferred Service Time" and only shows that service's slots; otherwise it falls back to the general time slots (Content tab). Currently set for **Daily Exterior Shine** and **Celebrity Care**: 6:15 AM, 7:00 AM, 8:00 AM, 8:30 AM.

**Fixed (2026-10-22)**: the coupon-code row used to overflow the booking form below ~480px. Cause was the grid *tracks* (`1fr` = `minmax(auto, 1fr)`) refusing to shrink below their content; switching `.booking-grid` / `.booking-form .row` to `minmax(0, 1fr)` columns fixed it.

## ⚠️ Placeholder info — update before going live

These were guessed/left as placeholders since the real details weren't provided. Update via **Settings** in `/admin`:

- Phone: `+91 98765 43210`
- WhatsApp: `919876543210`
- Email: `hello@washbird.example`
- Address: `Update this with your shop address, India`
- Map: currently blank (was pointing at Dubai from the original seed data — removed rather than leave it wrong). Add a real Google Maps embed URL once you have an address.

## Admin login

- URL: `http://localhost:3000/admin`
- Default: username `admin`, password `admin123`
- **Change this from the Account tab before sharing the site publicly** — anyone with it can edit everything.

## How to start the server

```bash
cd C:\Users\Admin\Desktop\PROJECT
npm start
```
Then open `http://localhost:3000` (site) or `http://localhost:3000/admin` (admin). Leave the terminal window open — closing it stops the server.

## How to get a public link again (temporary demo tunnel)

A Cloudflare quick tunnel was used to demo the site from any phone/network. It is **not permanent** — it dies when the tunnel process or PC stops, and the address changes every time it's restarted.

The tool is already saved locally at `tools\cloudflared.exe` (not committed to git — see `.gitignore`). To start a new tunnel once the server is running:

```bash
tools\cloudflared.exe tunnel --url http://localhost:3000
```
It will print a fresh `https://xxxx.trycloudflare.com` link — share that.

**For a real, permanent, always-on website with a stable URL/domain, this needs proper hosting** — not yet set up. Revisit when ready.

### Vercel deployment — code is done, account is blocked

Chose to deploy on **Vercel**. Since Vercel has no persistent disk, the storage layer was reworked to run in two modes automatically (no manual switching needed):

- **Local / Railway / Render** (unchanged): JSON file on disk, exactly as before.
- **Vercel**: detected via env vars — **Upstash Redis** for all content/bookings, **Vercel Blob** for image uploads. `SESSION_SECRET` must be set explicitly (no writable disk for the auto-generated secret file).

This is real, tested code, not a plan — see commits "Add dual-mode storage/uploads for Vercel deployment" and "Fix data loss on Vercel: await every save before responding" (the second one fixed a genuine bug caught during testing: the debounced save scheduled a write 120ms later via `setTimeout`, but Vercel can freeze a function the instant its response is sent, so the write sometimes never happened. Redis saves are now immediate and awaited before responding).

**Status (updated 2026-10-23): working.** Pushes to `master` now auto-deploy to **https://washbird-car-wash.vercel.app** in about 30–45 seconds. This is the live, public link.
- Vercel account: `aymljku-7193` (project `washbird-car-wash`); Upstash Redis database `champion-bison-98030` holds content/bookings.
- The earlier `BLOCKED` deployment problem has cleared on its own.
- The old Railway link (`washbird-car-wash-production.up.railway.app`) now returns "Application not found" — the Railway service is gone or paused, and the Railway CLI login on this machine has expired. Use the Vercel link.

## Source control

- Local git repo initialized, history preserved (`git log --oneline` to see commits).
- Pushed to a **private** GitHub repo: **https://github.com/anjum-mansuri/washbird-car-wash**
- Logged in as GitHub user `anjum-mansuri` via `gh` CLI on this machine.
- `data/db.json` (all live content/bookings) and `data/.secret` (session signing key) are intentionally **not** committed — they're real runtime data, not code. Back them up separately (Settings tab has a one-click backup/download).

## Open items / next decisions

- [x] Fix the mobile coupon-row overflow bug — fixed 2026-10-22
- [x] Vercel deployments unstuck — auto-deploying again as of 2026-10-22
- [ ] Booking alerts: new bookings only show in Admin → Bookings (no email/WhatsApp notification yet)
- [ ] Fill in real phone, WhatsApp, email, and address in Settings
- [ ] Add a real Google Maps embed link once there's an address
- [ ] Change the default admin password
- [ ] Add real photos to the Gallery tab (currently empty)
- [ ] Review/replace the placeholder customer reviews (Rania K., Mahmoud A., Chris D. — left over from the original seed data, not Washbird's real customers)
- [ ] The 3 "Current offers" (Midweek Special, Wash Card, New Customer Detail) are still generic placeholders — replace with real Washbird promotions if any
- [ ] Facebook page URL still needed — icon is already built (utility bar + footer), just add the URL in Settings → Social links whenever you have it

## Changelog

- Real Washbird logo added, replacing the placeholder SVG — used in the header, favicon, footer, and admin sidebar
- Service menu replaced: 4 real packages (Daily Exterior Shine, Celebrity Care, Full Comfort Wash, Deep Interior Wash) with monthly/per-wash/per-visit pricing, in that display order
- Private GitHub repo created and kept in sync: https://github.com/anjum-mansuri/washbird-car-wash
- Remote Control set up so this project can be worked on from a phone via the Claude app (run `/remote-control` in the session, then open **Code** in the Claude mobile app)
- Interactive WhatsApp ordering: a WhatsApp button on every service card (pre-filled message with service + price) plus a floating site-wide WhatsApp button
- Header/footer redesign inspired by vrajcorporation.com: a dark utility bar above the header (click-to-call phone, email, social badges), footer restructured into Brand / Quick Links / Contact+Socials
- Small "Site by Dr. Anjum" builder credit added to the footer, top-right, with its own logo
- Vercel deployment: dual-mode storage (file locally, Upstash Redis + Vercel Blob on Vercel) — see Vercel section above for status
- Booking form: coupon codes with live discount, per-service custom time slots, "Starting from" pricing for Deep Interior Wash — see Booking form features above
- Gen Z visual refresh (bold fonts, neo-brutal cards, ticker tapes, chat-bubble reviews, polaroid gallery, booking confetti) — see [SITE-DESIGN.md](SITE-DESIGN.md)
- Diwali festive theme with admin switch (Settings → Festive theme: Auto / Always on / Off) — see [SITE-DESIGN.md](SITE-DESIGN.md)
- Washbird mascot bird: flies in and perches on the header logo; tap it to make it fly a loop — see [SITE-DESIGN.md](SITE-DESIGN.md)
