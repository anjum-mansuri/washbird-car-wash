/** JSON API. Public: POST /api/bookings. Everything else needs a session. */
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const auth = require('../auth');

const router = express.Router();

// Vercel has no persistent disk, so image uploads go to Vercel Blob there
// (env var it injects automatically once a Blob store is connected) and to
// a local folder everywhere else (this PC, Railway, Render, a VPS...).
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!USE_BLOB) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_IMAGE = /^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/;
const upload = multer({
  storage: USE_BLOB
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = (path.extname(file.originalname) || '.jpg').toLowerCase().slice(0, 6);
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
        }
      }),
  // Vercel server uploads are capped at 4.5MB per request body; stay under that.
  limits: { fileSize: USE_BLOB ? 4 * 1024 * 1024 : 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED_IMAGE.test(file.mimetype))
});

/** Collections the admin can CRUD through the generic routes below. */
const COLLECTIONS = {
  services: {
    fields: ['name', 'description', 'price', 'duration', 'icon', 'features', 'popular', 'active'],
    defaults: { name: 'New service', description: '', price: 0, duration: '', icon: '🚿', features: [], popular: false, active: true }
  },
  offers: {
    fields: ['title', 'description', 'badge', 'code', 'startsOn', 'endsOn', 'imageUrl', 'active'],
    defaults: { title: 'New offer', description: '', badge: '', code: '', startsOn: '', endsOn: '', imageUrl: '', active: true }
  },
  testimonials: {
    fields: ['name', 'text', 'rating', 'role', 'active'],
    defaults: { name: '', text: '', rating: 5, role: '', active: true }
  },
  gallery: {
    fields: ['url', 'caption', 'active'],
    defaults: { url: '', caption: '', active: true }
  }
};

/** Keeps unknown keys out of the store. */
function pick(body, fields) {
  const out = {};
  for (const f of fields) if (body[f] !== undefined) out[f] = body[f];
  return out;
}

/** Deep merge for the settings object, so a partial PUT never wipes siblings. */
function deepAssign(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value) &&
        target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      deepAssign(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

// ------------------------------------------------------------- public route
/** Booking requests from the website form. */
router.post('/bookings', (req, res) => {
  const s = db.data.settings;
  if (!s.booking.enabled) return res.status(403).json({ error: 'Online booking is currently closed' });

  const b = req.body || {};
  if (b.website) return res.json({ ok: true, message: s.booking.successMessage }); // honeypot
  const name = String(b.name || '').trim();
  const phone = String(b.phone || '').trim();
  if (name.length < 2 || phone.length < 6) {
    return res.status(400).json({ error: 'Please provide a name and a valid phone number' });
  }

  const clip = (v, n) => String(v || '').trim().slice(0, n);
  const booking = {
    id: db.id(),
    name: clip(name, 80),
    phone: clip(phone, 40),
    email: clip(b.email, 120),
    service: clip(b.service, 80),
    vehicle: clip(b.vehicle, 60),
    date: clip(b.date, 20),
    time: clip(b.time, 20),
    notes: clip(b.notes, 1000),
    status: 'new',
    createdAt: new Date().toISOString()
  };
  db.data.bookings.push(booking);
  db.save();
  console.log(`New booking request: ${booking.name} — ${booking.phone} — ${booking.service}`);
  res.json({ ok: true, message: s.booking.successMessage });
});

// ------------------------------------------------------------- admin routes
router.use(auth.requireApi);

router.get('/all', (_req, res) => {
  const { settings, services, offers, testimonials, gallery, bookings } = db.data;
  res.json({ settings, services, offers, testimonials, gallery, bookings });
});

router.put('/settings', (req, res) => {
  deepAssign(db.data.settings, req.body || {});
  db.save();
  res.json({ ok: true, settings: db.data.settings });
});

// --- bookings inbox (declared before the generic routes so it wins the match) ---
const BOOKING_STATUSES = ['new', 'confirmed', 'done', 'cancelled'];

router.get('/bookings', (_req, res) => res.json({ items: db.data.bookings }));

router.get('/bookings/export.csv', (_req, res) => {
  const cols = ['createdAt', 'name', 'phone', 'email', 'service', 'vehicle', 'date', 'time', 'status', 'notes'];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.join(',')]
    .concat(db.data.bookings.map((b) => cols.map((c) => cell(b[c])).join(',')))
    .join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
  res.send('﻿' + csv); // BOM so Excel reads UTF-8 correctly
});

router.post('/bookings/cleanup', (_req, res) => {
  const before = db.data.bookings.length;
  db.data.bookings = db.data.bookings.filter((b) => b.status !== 'done' && b.status !== 'cancelled');
  db.save();
  res.json({ ok: true, removed: before - db.data.bookings.length });
});

router.put('/bookings/:id', (req, res) => {
  const booking = db.data.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Not found' });
  if (req.body.status && BOOKING_STATUSES.includes(req.body.status)) booking.status = req.body.status;
  if (typeof req.body.notes === 'string') booking.notes = req.body.notes.slice(0, 1000);
  db.save();
  res.json({ ok: true, item: booking });
});

router.delete('/bookings/:id', (req, res) => {
  const index = db.data.bookings.findIndex((b) => b.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'Not found' });
  db.data.bookings.splice(index, 1);
  db.save();
  res.json({ ok: true });
});

// --- image uploads ---
router.post('/upload', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    const limitMb = USE_BLOB ? '4' : '6';
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? `Image is larger than ${limitMb} MB` : err.message });
    if (!req.file) return res.status(400).json({ error: 'Only image files are accepted' });

    if (!USE_BLOB) return res.json({ ok: true, url: '/uploads/' + req.file.filename });

    try {
      const { put } = require('@vercel/blob');
      const ext = (path.extname(req.file.originalname) || '.jpg').toLowerCase().slice(0, 6);
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const blob = await put(name, req.file.buffer, { access: 'public', contentType: req.file.mimetype });
      res.json({ ok: true, url: blob.url });
    } catch (e) {
      res.status(500).json({ error: 'Upload failed: ' + e.message });
    }
  });
});

// --- account & data ---
router.post('/password', async (req, res) => {
  const { current, next } = req.body || {};
  if (!auth.verifyPassword(String(current || ''), req.user.password)) {
    return res.status(400).json({ error: 'Current password is not correct' });
  }
  if (String(next || '').length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  req.user.password = auth.hashPassword(String(next));
  req.user.mustChangePassword = false;
  await db.saveNow();
  res.json({ ok: true });
});

router.get('/export', (_req, res) => {
  const { users, ...safe } = db.data; // never ship password hashes in a download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="carwash-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.send(JSON.stringify(safe, null, 2));
});

router.post('/backup', async (_req, res) => {
  try {
    const ref = await db.backup();
    res.json({ ok: true, file: db.USE_REDIS ? ref : path.basename(ref) });
  } catch (e) {
    res.status(500).json({ error: 'Backup failed: ' + e.message });
  }
});

// --- generic collection CRUD ---
router.param('collection', (req, res, next, name) => {
  if (!COLLECTIONS[name]) return res.status(404).json({ error: 'Unknown collection' });
  req.collectionName = name;
  req.collection = db.data[name];
  next();
});

router.get('/:collection', (req, res) => res.json({ items: req.collection }));

router.post('/:collection', (req, res) => {
  const spec = COLLECTIONS[req.collectionName];
  const item = Object.assign(
    { id: db.id() },
    spec.defaults,
    pick(req.body || {}, spec.fields),
    { order: req.collection.length, createdAt: new Date().toISOString() }
  );
  req.collection.push(item);
  db.save();
  res.status(201).json({ ok: true, item });
});

router.post('/:collection/reorder', (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  ids.forEach((id, index) => {
    const item = req.collection.find((x) => x.id === id);
    if (item) item.order = index;
  });
  db.save();
  res.json({ ok: true });
});

router.put('/:collection/:id', (req, res) => {
  const spec = COLLECTIONS[req.collectionName];
  const item = req.collection.find((x) => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  Object.assign(item, pick(req.body || {}, spec.fields));
  db.save();
  res.json({ ok: true, item });
});

router.delete('/:collection/:id', (req, res) => {
  const index = req.collection.findIndex((x) => x.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'Not found' });
  const [removed] = req.collection.splice(index, 1);
  // Uploaded images are removed with their gallery entry.
  if (req.collectionName === 'gallery' && removed.url) {
    if (!USE_BLOB && removed.url.startsWith('/uploads/')) {
      fs.rm(path.join(UPLOAD_DIR, path.basename(removed.url)), { force: true }, () => {});
    } else if (USE_BLOB && removed.url.startsWith('https://')) {
      // Only ever fails harmlessly for a URL we didn't upload ourselves (e.g. pasted in manually).
      require('@vercel/blob').del(removed.url).catch(() => {});
    }
  }
  db.save();
  res.json({ ok: true });
});

module.exports = { router, COLLECTIONS, upload, UPLOAD_DIR };
