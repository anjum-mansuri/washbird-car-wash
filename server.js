/**
 * Car wash website + admin panel.
 *   Website : http://localhost:3000
 *   Admin   : http://localhost:3000/admin
 */
const path = require('path');
const express = require('express');

const db = require('./src/db');
const auth = require('./src/auth');
const site = require('./src/views/site');
const adminViews = require('./src/views/admin');
const { router: apiRouter } = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(auth.attachUser);

app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0
  })
);

auth.ensureAdmin();

// ------------------------------------------------------------- public site
app.get('/', (_req, res) => {
  res.set('Cache-Control', 'no-store'); // admin edits must show up immediately
  res.send(site.render(db.data));
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /admin\n');
});

// ------------------------------------------------------------------- admin
app.get('/admin/login', (req, res) => {
  if (req.user) return res.redirect('/admin');
  res.send(adminViews.loginPage(req.query.error ? 'Wrong username or password.' : ''));
});

app.post('/admin/login', auth.loginThrottle, (req, res) => {
  const { username, password } = req.body || {};
  const user = db.data.users.find((u) => u.username === String(username || '').trim());
  if (!user || !auth.verifyPassword(String(password || ''), user.password)) {
    req.loginFailed();
    return res.redirect('/admin/login?error=1');
  }
  req.loginOk();
  auth.setSession(res, user);
  res.redirect('/admin');
});

app.post('/admin/logout', (_req, res) => {
  auth.clearSession(res);
  res.redirect('/admin/login');
});

app.get('/admin', auth.requirePage, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.send(adminViews.panelPage(req.user));
});

// --------------------------------------------------------------------- api
app.use('/api', apiRouter);

// ---------------------------------------------------------------- fallback
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.status(404).send(
    `<!doctype html><meta charset="utf-8"><title>Not found</title>
     <div style="font:16px system-ui;padding:80px;text-align:center">
       <h1 style="font-size:2rem">Page not found</h1>
       <p><a href="/">Back to ${site.esc(db.data.settings.businessName)}</a></p>
     </div>`
  );
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

app.listen(PORT, () => {
  console.log(`\n  ${db.data.settings.businessName}`);
  console.log(`  Website  →  http://localhost:${PORT}`);
  console.log(`  Admin    →  http://localhost:${PORT}/admin\n`);
});
