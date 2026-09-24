/**
 * Tiny JSON document store.
 * Everything the site shows lives in data/db.json, so the admin panel can
 * change any of it at runtime without a rebuild or a database server.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Overridable so a mounted persistent volume (e.g. a Railway Volume) can be
// used instead of the container's ephemeral disk, which is wiped on redeploy.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const id = () => crypto.randomUUID();

function seed() {
  return {
    settings: {
      businessName: 'AquaShine Car Wash',
      tagline: 'Showroom shine, in under 30 minutes',
      logoUrl: '',
      currency: 'AED',
      currencyPosition: 'before', // before | after
      accentColor: '#0ea5e9',
      phone: '+971 50 123 4567',
      whatsapp: '971501234567',
      email: 'hello@aquashine.example',
      address: 'Al Quoz Industrial Area 3, Dubai',
      mapEmbedUrl: 'https://www.google.com/maps?q=Al%20Quoz%20Dubai&output=embed',
      hours: [
        { day: 'Monday', open: '08:00', close: '21:00', closed: false },
        { day: 'Tuesday', open: '08:00', close: '21:00', closed: false },
        { day: 'Wednesday', open: '08:00', close: '21:00', closed: false },
        { day: 'Thursday', open: '08:00', close: '21:00', closed: false },
        { day: 'Friday', open: '14:00', close: '22:00', closed: false },
        { day: 'Saturday', open: '08:00', close: '22:00', closed: false },
        { day: 'Sunday', open: '09:00', close: '20:00', closed: false }
      ],
      social: { facebook: '', instagram: '', tiktok: '', x: '' },
      hero: {
        title: 'A cleaner car, without the wait',
        subtitle:
          'Hand wash, steam clean, polish and full detailing by a team that treats every car like its own.',
        imageUrl: '',
        primaryCta: 'Book a wash',
        secondaryCta: 'See prices'
      },
      about: {
        title: 'Why drivers keep coming back',
        text: 'We have been washing cars for over ten years. Filtered water, pH-neutral foam, clean microfibre on every car, and a team that actually checks the work before handing back your keys.',
        points: [
          'Scratch-free hand wash only',
          'Eco-friendly, water-saving process',
          'Free vacuum with every wash',
          'Walk-ins welcome, booking gets you priority'
        ]
      },
      booking: {
        enabled: true,
        title: 'Book your slot',
        subtitle: 'Tell us when suits you and we will confirm by phone or WhatsApp.',
        successMessage: 'Thanks! Your request is in — we will confirm shortly.',
        timeSlots: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
      },
      vehicleTypes: [
        { name: 'Sedan', multiplier: 1 },
        { name: 'SUV / 4x4', multiplier: 1.3 },
        { name: 'Pickup / Van', multiplier: 1.5 }
      ],
      sections: {
        offers: true,
        services: true,
        about: true,
        gallery: true,
        testimonials: true,
        booking: true,
        contact: true
      },
      seo: {
        metaTitle: '',
        metaDescription: 'Professional hand car wash, steam cleaning, polishing and full detailing.'
      },
      footerNote: ''
    },

    offers: [
      {
        id: id(),
        title: 'Midweek Special',
        description: 'Any exterior wash Monday to Wednesday, before 12:00.',
        badge: '25% OFF',
        code: 'MIDWEEK25',
        startsOn: '',
        endsOn: '',
        imageUrl: '',
        active: true,
        order: 0
      },
      {
        id: id(),
        title: 'Wash Card — Pay 4, Get 5',
        description: 'Buy four premium washes and the fifth one is on us.',
        badge: 'BEST VALUE',
        code: '',
        startsOn: '',
        endsOn: '',
        imageUrl: '',
        active: true,
        order: 1
      },
      {
        id: id(),
        title: 'New Customer Detail',
        description: 'AED 100 off your first full interior + exterior detail.',
        badge: 'NEW',
        code: 'FIRSTDETAIL',
        startsOn: '',
        endsOn: '',
        imageUrl: '',
        active: true,
        order: 2
      }
    ],

    services: [
      {
        id: id(),
        name: 'Express Exterior Wash',
        description: 'Foam pre-soak, hand wash, wheels, tyre shine and a hand dry.',
        price: 35,
        duration: '20 min',
        icon: '💦',
        features: ['Snow foam pre-soak', 'Wheels & tyres', 'Hand dry'],
        popular: false,
        active: true,
        order: 0
      },
      {
        id: id(),
        name: 'Inside & Out',
        description: 'Our most booked wash — exterior hand wash plus a full interior vacuum and wipe-down.',
        price: 60,
        duration: '40 min',
        icon: '✨',
        features: ['Everything in Express', 'Interior vacuum', 'Dashboard & trim wipe', 'Glass inside & out'],
        popular: true,
        active: true,
        order: 1
      },
      {
        id: id(),
        name: 'Steam Clean',
        description: 'High-pressure steam for seats, carpets and hard-to-reach trim. Kills odours.',
        price: 120,
        duration: '1 h 15 min',
        icon: '🌫️',
        features: ['Seats & carpets', 'Door cards & vents', 'Odour treatment'],
        popular: false,
        active: true,
        order: 2
      },
      {
        id: id(),
        name: 'Polish & Wax',
        description: 'Machine polish to lift light swirls, followed by a protective wax layer.',
        price: 250,
        duration: '3 h',
        icon: '🪄',
        features: ['Clay bar decontamination', 'Single-stage machine polish', 'Carnauba wax', '3 months protection'],
        popular: false,
        active: true,
        order: 3
      },
      {
        id: id(),
        name: 'Full Detail',
        description: 'The complete reset — paint correction, deep interior clean, engine bay and glass sealant.',
        price: 550,
        duration: '6 h',
        icon: '🏆',
        features: ['Paint correction', 'Deep interior detail', 'Engine bay clean', 'Glass sealant'],
        popular: false,
        active: true,
        order: 4
      },
      {
        id: id(),
        name: 'Ceramic Coating',
        description: '9H ceramic protection with up to two years of gloss and easy cleaning.',
        price: 1500,
        duration: '1–2 days',
        icon: '🛡️',
        features: ['Full paint correction', '9H ceramic layer', 'Hydrophobic finish', 'Up to 24 months'],
        popular: false,
        active: true,
        order: 5
      }
    ],

    testimonials: [
      {
        id: id(),
        name: 'Rania K.',
        text: 'Booked online at 9am, car was spotless by lunch. The interior smelled brand new.',
        rating: 5,
        role: 'Nissan Patrol owner',
        active: true,
        order: 0
      },
      {
        id: id(),
        name: 'Mahmoud A.',
        text: 'They caught a scratch I had not even noticed and polished it out. Honest team.',
        rating: 5,
        role: 'Regular since 2022',
        active: true,
        order: 1
      },
      {
        id: id(),
        name: 'Chris D.',
        text: 'Fair prices and no upselling. The wash card pays for itself in a month.',
        rating: 4,
        role: 'Toyota Corolla owner',
        active: true,
        order: 2
      }
    ],

    gallery: [],
    bookings: [],
    users: [],
    meta: { createdAt: new Date().toISOString(), version: 1 }
  };
}

/** Fill in keys added after a db.json was first written, so upgrades never crash a page. */
function mergeDefaults(target, defaults) {
  for (const [key, value] of Object.entries(defaults)) {
    if (target[key] === undefined) {
      target[key] = value;
    } else if (
      value && typeof value === 'object' && !Array.isArray(value) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      mergeDefaults(target[key], value);
    }
  }
  return target;
}

/**
 * Storage backend: local JSON file for normal/local runs, or Upstash Redis
 * when its env vars are present (that's how this runs on Vercel, which has
 * no persistent disk). Everything above and everything calling this module
 * stays the same either way — only load/save change.
 */
const USE_REDIS = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const REDIS_KEY = 'washbird:db';
let redis = null;
if (USE_REDIS) {
  const { Redis } = require('@upstash/redis');
  redis = Redis.fromEnv();
}

let data;
let ready_ = false;
let loadPromise = null;
let lastLoad = 0;
const STALE_MS = 8000; // re-check Redis if this instance's copy is older than this

function loadFileSync() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    data = seed();
    persistFile();
  } else {
    data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    mergeDefaults(data, seed());
  }
}

async function loadFromRedis() {
  const stored = await redis.get(REDIS_KEY);
  if (stored) {
    data = stored;
    mergeDefaults(data, seed());
  } else {
    data = seed();
    await redis.set(REDIS_KEY, data);
  }
  lastLoad = Date.now();
}

let writeTimer = null;
function persistFile() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

/**
 * Must resolve before any request is handled — call this from Express
 * middleware. On the file backend it's a one-time sync load. On Redis it
 * loads once per cold start and refreshes if this instance's copy is stale,
 * so a second serverless instance picks up edits made through another one.
 */
async function ready() {
  if (USE_REDIS) {
    if (!loadPromise) loadPromise = loadFromRedis();
    await loadPromise;
    if (Date.now() - lastLoad > STALE_MS) await loadFromRedis();
  } else if (!ready_) {
    loadFileSync();
    ready_ = true;
  }
}

/**
 * Save. On the file backend this is debounced (fire-and-forget is safe —
 * the process keeps running, so a pending timer always gets to fire).
 * On Redis it writes immediately and returns the promise: a serverless
 * function can be frozen the instant it sends its response, so anything
 * "scheduled for later" can simply never run. Callers should await this.
 */
function save() {
  if (USE_REDIS) {
    lastLoad = Date.now();
    return redis.set(REDIS_KEY, data);
  }
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    persistFile();
  }, 120);
  return Promise.resolve();
}

async function saveNow() {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  if (USE_REDIS) {
    lastLoad = Date.now();
    await redis.set(REDIS_KEY, data);
  } else {
    persistFile();
  }
}

/** Snapshot for safekeeping — a timestamped file locally, a timestamped key on Redis. */
async function backup() {
  await saveNow();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  if (USE_REDIS) {
    const key = `washbird:backup:${stamp}`;
    await redis.set(key, data);
    return key;
  }
  const dest = path.join(DATA_DIR, `backup-${stamp}.json`);
  fs.copyFileSync(DB_FILE, dest);
  return dest;
}

if (!USE_REDIS) {
  process.on('exit', () => {
    if (writeTimer) persistFile();
  });
}

module.exports = {
  get data() {
    return data;
  },
  ready,
  save,
  saveNow,
  backup,
  id,
  seed,
  DB_FILE,
  DATA_DIR,
  USE_REDIS
};
