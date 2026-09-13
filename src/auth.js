/**
 * Password hashing (scrypt) + signed session cookies. No external auth deps.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const COOKIE = 'cw_session';
const SESSION_DAYS = 7;
const SECRET_FILE = path.join(db.DATA_DIR, '.secret');

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (!fs.existsSync(SECRET_FILE)) {
    fs.writeFileSync(SECRET_FILE, crypto.randomBytes(48).toString('hex'), { mode: 0o600 });
  }
  return fs.readFileSync(SECRET_FILE, 'utf8').trim();
}
const SECRET = sessionSecret();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

/** Creates the default admin on first boot. */
function ensureAdmin() {
  if (db.data.users.length === 0) {
    const username = process.env.ADMIN_USER || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    db.data.users.push({
      id: db.id(),
      username,
      password: hashPassword(password),
      mustChangePassword: !process.env.ADMIN_PASSWORD,
      createdAt: new Date().toISOString()
    });
    db.saveNow();
    console.log(`\n  Admin account created — username: ${username}  password: ${password}`);
    console.log('  Change it from the admin panel (Account tab) before going live.\n');
  }
}

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('base64url');
}

function makeToken(user) {
  const expires = Date.now() + SESSION_DAYS * 864e5;
  const payload = `${user.id}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

function readToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expires, sig] = parts;
  const payload = `${userId}.${expires}`;
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(expires) < Date.now()) return null;
  return db.data.users.find((u) => u.id === userId) || null;
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** Attaches req.user when a valid session cookie is present. */
function attachUser(req, _res, next) {
  const cookies = parseCookies(req.headers.cookie);
  req.user = readToken(cookies[COOKIE]);
  next();
}

function setSession(res, user) {
  res.cookie(COOKIE, makeToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 864e5,
    secure: process.env.NODE_ENV === 'production' && process.env.HTTPS !== 'false'
  });
}

function clearSession(res) {
  res.clearCookie(COOKIE);
}

/** Guard for admin pages — redirects to the login screen. */
function requirePage(req, res, next) {
  if (req.user) return next();
  res.redirect('/admin/login');
}

/** Guard for admin APIs — returns JSON 401. */
function requireApi(req, res, next) {
  if (req.user) return next();
  res.status(401).json({ error: 'Not signed in' });
}

// --- crude but effective brute-force brake on the login route ---
const attempts = new Map();
function loginThrottle(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const rec = attempts.get(key) || { count: 0, until: 0 };
  if (rec.until > now) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
  }
  req.loginFailed = () => {
    rec.count += 1;
    if (rec.count >= 6) {
      rec.count = 0;
      rec.until = now + 60_000;
    }
    attempts.set(key, rec);
  };
  req.loginOk = () => attempts.delete(key);
  next();
}

module.exports = {
  ensureAdmin,
  hashPassword,
  verifyPassword,
  attachUser,
  setSession,
  clearSession,
  requirePage,
  requireApi,
  loginThrottle
};
