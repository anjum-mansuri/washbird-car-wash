/** Admin shell pages: login screen and the panel container. */

function loginPage(error) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in — Admin</title>
<link rel="stylesheet" href="/css/admin.css">
</head>
<body class="login-body">
  <form class="login-card" method="post" action="/admin/login">
    <div class="login-mark">🚗</div>
    <h1>Admin sign in</h1>
    <p class="muted">Manage services, offers, bookings and site content.</p>
    ${error ? `<div class="alert err">${error}</div>` : ''}
    <label>Username<input name="username" autocomplete="username" autofocus required></label>
    <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
    <button class="btn primary" type="submit">Sign in</button>
    <a class="back" href="/">← Back to website</a>
  </form>
</body>
</html>`;
}

function panelPage(user) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin — Car Wash</title>
<link rel="stylesheet" href="/css/admin.css">
</head>
<body>
<div class="shell">
  <aside class="side">
    <div class="side-top">
      <span class="mark" id="sideMark">🚗</span>
      <div>
        <strong id="sideName">Admin</strong>
        <small>Control panel</small>
      </div>
    </div>
    <nav class="side-nav">
      <button data-tab="dashboard" class="on">📊 Dashboard</button>
      <button data-tab="bookings">📥 Bookings <span class="pill" id="newCount" hidden>0</span></button>
      <button data-tab="services">🧼 Services</button>
      <button data-tab="offers">🏷️ Offers</button>
      <button data-tab="gallery">🖼️ Gallery</button>
      <button data-tab="reviews">⭐ Reviews</button>
      <button data-tab="content">📝 Content</button>
      <button data-tab="settings">⚙️ Settings</button>
      <button data-tab="account">🔐 Account</button>
    </nav>
    <div class="side-foot">
      <a href="/" target="_blank" rel="noopener">View website ↗</a>
      <form method="post" action="/admin/logout"><button class="linkish" type="submit">Sign out</button></form>
    </div>
  </aside>

  <main class="main">
    <header class="main-head">
      <h1 id="pageTitle">Dashboard</h1>
      <div class="head-actions">
        <span class="saved" id="savedFlag">Saved</span>
        <span class="who">${user.username}</span>
      </div>
    </header>
    <div id="view" class="view"><p class="muted">Loading…</p></div>
  </main>
</div>

<div class="toast" id="toast"></div>
<div class="modal" id="modal" hidden>
  <div class="modal-card">
    <header><h2 id="modalTitle">Edit</h2><button class="x" id="modalClose" aria-label="Close">✕</button></header>
    <div id="modalBody"></div>
  </div>
</div>

<script src="/js/admin.js"></script>
</body>
</html>`;
}

module.exports = { loginPage, panelPage };
