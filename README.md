# Car Wash Website + Admin Panel

A complete car wash website where **every word, price, photo and offer is editable from a browser** — no code, no rebuild, no database server. Content lives in `data/db.json`, the admin panel writes to it, and the public page renders from it on every request.

## Run it

```bash
npm install
npm start
```

| | |
|---|---|
| Website | http://localhost:3000 |
| Admin panel | http://localhost:3000/admin |
| Default login | `admin` / `admin123` — **change it in Account on first sign-in** |

`npm run dev` restarts the server automatically while you edit code.

## What the admin can change

| Tab | Controls |
|---|---|
| **Dashboard** | Booking counts, latest requests, and switches to show/hide any section of the site |
| **Bookings** | Every request from the website form — filter by status, mark new/confirmed/done/cancelled, read notes, export CSV, bulk-delete finished ones |
| **Services** | Add/edit/reorder services: name, icon, description, price, duration, "what's included" list, "Most booked" badge, show/hide |
| **Offers** | Promotions with a badge, promo code and optional start/end dates — an offer outside its date window disappears from the site by itself. The first live offer also shows in the hero banner |
| **Gallery** | Drag-and-drop image upload, captions, ordering |
| **Reviews** | Customer testimonials with star ratings |
| **Content** | Hero headline/sub-headline/buttons/background, About text and selling points, booking form headings and time slots, thank-you message, SEO title & description, footer note |
| **Settings** | Business name, tagline, logo, phone, WhatsApp, email, address, Google Maps embed, opening hours per day, accent colour, currency and symbol position, vehicle types with price multipliers, social links, backups |
| **Account** | Change the admin password |

Two things worth knowing:

- **Vehicle multipliers** (Settings) drive the Sedan / SUV / Pickup switch on the price list. Set `SUV | 1.3` and every SUV price shows 30 % higher, recalculated in the browser.
- **Accent colour** (Settings) recolours the entire site — buttons, badges, links, highlights — from one colour picker.

## Layout

```
server.js              routes and start-up
src/db.js              JSON store + the seed content you see on first run
src/auth.js            scrypt passwords, signed session cookies, login throttle
src/routes/api.js      JSON API (public booking + admin CRUD)
src/views/site.js      the public page, server-rendered from db.json
src/views/admin.js     admin login + panel shell
public/css, public/js  styles and browser code
public/uploads/        uploaded images
data/db.json           all content (created on first run)
```

Adding a new editable collection means one entry in `COLLECTIONS` in [src/routes/api.js](src/routes/api.js) plus a render function in [src/views/site.js](src/views/site.js) — the CRUD routes and admin list UI are generic.

## Before going live

1. Sign in and change the password (Account tab).
2. Set a fixed session key so logins survive restarts and deploys:
   ```bash
   set SESSION_SECRET=some-long-random-string   # Windows
   export SESSION_SECRET=some-long-random-string
   ```
   Without it, a key is generated once and kept in `data/.secret`.
3. Run behind HTTPS with `NODE_ENV=production` — session cookies then set the `secure` flag.
4. Back up `data/db.json` and `public/uploads/` — that is the entire site's content. Settings → **Download backup** gives you a JSON copy (password hashes excluded), and **Save a backup on the server** drops a timestamped copy in `data/`.

Booking requests are stored in the database and shown in the admin inbox; the server also logs each one to the console. If you want them emailed or sent to WhatsApp, that hooks into the `POST /api/bookings` handler in [src/routes/api.js](src/routes/api.js).

## API

| Method | Route | Access |
|---|---|---|
| `POST` | `/api/bookings` | public — the website booking form |
| `GET` | `/api/all` | admin — everything the panel needs |
| `PUT` | `/api/settings` | admin — deep-merges a partial settings object |
| `GET POST PUT DELETE` | `/api/{services\|offers\|testimonials\|gallery}[/:id]` | admin |
| `POST` | `/api/{collection}/reorder` | admin — `{ ids: [...] }` in display order |
| `PUT DELETE` | `/api/bookings/:id` | admin — status changes, deletion |
| `GET` | `/api/bookings/export.csv` | admin |
| `POST` | `/api/upload` | admin — image upload, max 6 MB |
