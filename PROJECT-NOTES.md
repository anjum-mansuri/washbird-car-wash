# Washbird Car Care — Project Notes

Working notes for this project: what it is, current state, what's still a placeholder, and how to pick it back up. (For end-user / setup docs, see [README.md](README.md).)

## What this is

A dynamic car wash website with a full admin panel — every price, offer, photo, and page of text is editable from `/admin` with no code changes. Built with Node.js + Express, JSON file storage (`data/db.json`), no external database.

## Branding

- **Business name**: Washbird Car Care
- **Owner**: Mikaeel Mansuri (credited in the About section and site footer)
- **Instagram**: [instagram.com/washbird_](https://instagram.com/washbird_) — branding (name, logo style, bio tagline) was matched to this profile
- **Logo**: [public/img/logo.svg](public/img/logo.svg) — a hand-drawn badge mascot (navy/gold, wings, spray gun, "WASHBIRD" ribbon) styled after the Instagram profile picture, since the original image wasn't available as a file to copy directly
- **Currency**: Indian Rupees (₹), prices repriced for the Indian market (not a straight AED conversion)

## Current pricing (editable anytime from Services tab)

| Service | Price |
|---|---|
| Express Exterior Wash | ₹149 |
| Inside & Out | ₹299 |
| Steam Clean | ₹599 |
| Polish & Wax | ₹1,999 |
| Full Detail | ₹3,999 |
| Ceramic Coating | ₹12,999 |

Vehicle types: Hatchback (base), Sedan (×1.15), SUV/MUV (×1.35).

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

**For a real, permanent, always-on website with a stable URL/domain, this needs proper hosting** (a VPS or a platform like Railway/Render) — not yet set up. Revisit when ready.

## Source control

- Local git repo initialized, history preserved (`git log --oneline` to see commits).
- Pushed to a **private** GitHub repo: **https://github.com/anjum-mansuri/washbird-car-wash**
- Logged in as GitHub user `anjum-mansuri` via `gh` CLI on this machine.
- `data/db.json` (all live content/bookings) and `data/.secret` (session signing key) are intentionally **not** committed — they're real runtime data, not code. Back them up separately (Settings tab has a one-click backup/download).

## Open items / next decisions

- [ ] Fill in real phone, WhatsApp, email, and address in Settings
- [ ] Add a real Google Maps embed link once there's an address
- [ ] Change the default admin password
- [ ] Decide on permanent hosting (stable URL, always-on, optional custom domain) vs. continuing with on-demand tunnels
- [ ] Add real photos to the Gallery tab (currently empty)
- [ ] Review/replace the placeholder customer reviews (Rania K., Mahmoud A., Chris D. — Dubai-flavoured, left over from the original seed data)
