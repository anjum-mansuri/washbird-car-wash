# Washbird Car Care — Project Notes

Working notes for this project: what it is, current state, what's still a placeholder, and how to pick it back up. (For end-user / setup docs, see [README.md](README.md).)

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
| 4 | Deep Interior Wash | ₹2,499 | per visit |

Vehicle types: Hatchback (base), Sedan (×1.15), SUV/MUV (×1.35) — multiplier applies to all 4 packages.

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

### Hosting decision — pending

Asked about deploying to **Vercel**. Important catch: Vercel is serverless with no persistent disk, but this app stores everything (`data/db.json` — all content and every booking — plus uploaded photos in `public/uploads/`) as files on disk. Deployed to Vercel unchanged, admin edits and booking requests could silently disappear between requests/redeploys — a real risk for a business that needs booking records kept.

Two ways forward, not yet decided:

1. **Migrate to a real database** (e.g. free-tier Postgres/MongoDB) + Vercel Blob for photo uploads, so Vercel works properly. Real backend rework, needed only if Vercel specifically is the goal.
2. **Deploy as-is to a host with a persistent disk** (e.g. Railway or Render) — little to no code changes, keeps bookings/content exactly as tested today.

Revisit this before actually publishing — don't deploy to Vercel without doing (1) first, or bookings will be unreliable.

## Source control

- Local git repo initialized, history preserved (`git log --oneline` to see commits).
- Pushed to a **private** GitHub repo: **https://github.com/anjum-mansuri/washbird-car-wash**
- Logged in as GitHub user `anjum-mansuri` via `gh` CLI on this machine.
- `data/db.json` (all live content/bookings) and `data/.secret` (session signing key) are intentionally **not** committed — they're real runtime data, not code. Back them up separately (Settings tab has a one-click backup/download).

## Open items / next decisions

- [ ] Fill in real phone, WhatsApp, email, and address in Settings
- [ ] Add a real Google Maps embed link once there's an address
- [ ] Change the default admin password
- [ ] **Decide hosting path**: migrate storage to a database for Vercel, or deploy as-is to Railway/Render (see Hosting decision above)
- [ ] Add real photos to the Gallery tab (currently empty)
- [ ] Review/replace the placeholder customer reviews (Rania K., Mahmoud A., Chris D. — left over from the original seed data, not Washbird's real customers)
- [ ] The 3 "Current offers" (Midweek Special, Wash Card, New Customer Detail) are still generic placeholders — replace with real Washbird promotions if any

## Changelog

- Real Washbird logo added, replacing the placeholder SVG (circular badge in header)
- Service menu replaced: 4 real packages (Daily Exterior Shine, Celebrity Care, Full Comfort Wash, Deep Interior Wash) with monthly/per-wash/per-visit pricing, in that display order
- Private GitHub repo created and kept in sync: https://github.com/anjum-mansuri/washbird-car-wash
- Remote Control set up so this project can be worked on from a phone via the Claude app (run `/remote-control` in the session, then open **Code** in the Claude mobile app)
