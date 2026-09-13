/**
 * Server-rendered public site. Every string here comes from data/db.json,
 * so the admin panel is the only place anyone needs to edit content.
 */

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Multi-line admin text -> paragraphs. */
const paras = (v) =>
  String(v ?? '')
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');

const money = (amount, s) => {
  const n = Number(amount) || 0;
  const value = Number.isInteger(n) ? n.toString() : n.toFixed(2);
  return s.currencyPosition === 'after' ? `${value} ${esc(s.currency)}` : `${esc(s.currency)} ${value}`;
};

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
const live = (list) => list.filter((x) => x.active !== false).sort(byOrder);

/** An offer is shown only inside its date window (blank dates = always on). */
function offerRunning(offer, today) {
  if (offer.startsOn && offer.startsOn > today) return false;
  if (offer.endsOn && offer.endsOn < today) return false;
  return true;
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function stars(n) {
  const r = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
  return '★'.repeat(r) + '<span class="dim">' + '★'.repeat(5 - r) + '</span>';
}

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function renderHours(s) {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = names[new Date().getDay()];
  return s.hours
    .map(
      (h) => `<li class="${h.day === todayName ? 'today' : ''}">
        <span>${esc(h.day)}</span>
        <span>${h.closed ? 'Closed' : `${esc(h.open)} – ${esc(h.close)}`}</span>
      </li>`
    )
    .join('');
}

function renderOffers(offers, s) {
  if (!offers.length) return '';
  return `
  <section id="offers" class="section offers">
    <div class="wrap">
      <div class="section-head">
        <span class="eyebrow">Running now</span>
        <h2>Current offers</h2>
      </div>
      <div class="offer-grid">
        ${offers
          .map(
            (o) => `
        <article class="offer-card"${o.imageUrl ? ` style="--offer-img:url('${esc(o.imageUrl)}')"` : ''}>
          ${o.badge ? `<span class="offer-badge">${esc(o.badge)}</span>` : ''}
          <h3>${esc(o.title)}</h3>
          <p>${esc(o.description)}</p>
          <div class="offer-foot">
            ${o.code ? `<span class="code" title="Promo code">${esc(o.code)}</span>` : '<span></span>'}
            ${o.endsOn ? `<span class="until">Until ${esc(o.endsOn)}</span>` : ''}
          </div>
          <a class="offer-link" href="#booking">Claim this offer →</a>
        </article>`
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

function renderServices(services, s) {
  if (!services.length) return '';
  const vt = s.vehicleTypes || [];
  return `
  <section id="services" class="section">
    <div class="wrap">
      <div class="section-head">
        <span class="eyebrow">Menu &amp; prices</span>
        <h2>What we do</h2>
        ${
          vt.length > 1
            ? `<div class="vehicle-switch" role="group" aria-label="Vehicle type">
                ${vt
                  .map(
                    (v, i) =>
                      `<button type="button" class="vt${i === 0 ? ' on' : ''}" data-mult="${Number(v.multiplier) || 1}" data-name="${esc(v.name)}">${esc(v.name)}</button>`
                  )
                  .join('')}
              </div>`
            : ''
        }
      </div>
      <div class="service-grid">
        ${services
          .map(
            (svc) => `
        <article class="service-card${svc.popular ? ' popular' : ''}">
          ${svc.popular ? '<span class="tag">Most booked</span>' : ''}
          <div class="icon" aria-hidden="true">${esc(svc.icon || '🚿')}</div>
          <h3>${esc(svc.name)}</h3>
          <p>${esc(svc.description)}</p>
          ${
            (svc.features || []).length
              ? `<ul class="ticks">${svc.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`
              : ''
          }
          <div class="service-foot">
            <span class="price" data-base="${Number(svc.price) || 0}">${money(svc.price, s)}</span>
            ${svc.duration ? `<span class="dur">${esc(svc.duration)}</span>` : ''}
          </div>
          <a class="btn ghost sm" href="#booking" data-book="${esc(svc.name)}">Book this</a>
        </article>`
          )
          .join('')}
      </div>
      ${vt.length > 1 ? '<p class="note">Prices shown for <strong data-vt-label>' + esc(vt[0].name) + '</strong>. Final quote confirmed on arrival.</p>' : ''}
    </div>
  </section>`;
}

function renderAbout(s) {
  return `
  <section id="about" class="section about">
    <div class="wrap about-grid">
      <div>
        <span class="eyebrow">About us</span>
        <h2>${esc(s.about.title)}</h2>
        ${paras(s.about.text)}
      </div>
      <ul class="points">
        ${(s.about.points || []).map((p) => `<li>${esc(p)}</li>`).join('')}
      </ul>
    </div>
  </section>`;
}

function renderGallery(items) {
  if (!items.length) return '';
  return `
  <section id="gallery" class="section">
    <div class="wrap">
      <div class="section-head">
        <span class="eyebrow">Our work</span>
        <h2>Straight from the bay</h2>
      </div>
      <div class="gallery">
        ${items
          .map(
            (g) =>
              `<figure><img src="${esc(g.url)}" alt="${esc(g.caption || 'Car wash result')}" loading="lazy">${
                g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''
              }</figure>`
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

function renderTestimonials(items) {
  if (!items.length) return '';
  return `
  <section id="reviews" class="section reviews">
    <div class="wrap">
      <div class="section-head">
        <span class="eyebrow">Reviews</span>
        <h2>What customers say</h2>
      </div>
      <div class="review-grid">
        ${items
          .map(
            (t) => `
        <blockquote>
          <div class="stars">${stars(t.rating)}</div>
          <p>${esc(t.text)}</p>
          <footer><span class="avatar">${esc(initials(t.name))}</span><span><strong>${esc(t.name)}</strong>${
            t.role ? `<em>${esc(t.role)}</em>` : ''
          }</span></footer>
        </blockquote>`
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

function renderBooking(s, services) {
  const b = s.booking;
  return `
  <section id="booking" class="section booking">
    <div class="wrap booking-grid">
      <div class="booking-copy">
        <span class="eyebrow">Booking</span>
        <h2>${esc(b.title)}</h2>
        <p>${esc(b.subtitle)}</p>
        <ul class="contact-list">
          ${s.phone ? `<li><span>Call</span><a href="tel:${esc(s.phone.replace(/\s/g, ''))}">${esc(s.phone)}</a></li>` : ''}
          ${s.whatsapp ? `<li><span>WhatsApp</span><a href="https://wa.me/${esc(s.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener">Message us</a></li>` : ''}
          ${s.email ? `<li><span>Email</span><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>` : ''}
        </ul>
      </div>
      <form class="booking-form" id="bookingForm" novalidate>
        <div class="row">
          <label>Your name<input name="name" required autocomplete="name" placeholder="Full name"></label>
          <label>Phone<input name="phone" required autocomplete="tel" placeholder="05x xxx xxxx"></label>
        </div>
        <label>Email <span class="opt">(optional)</span><input type="email" name="email" autocomplete="email" placeholder="you@example.com"></label>
        <div class="row">
          <label>Service<select name="service">${services
            .map((x) => `<option>${esc(x.name)}</option>`)
            .join('')}<option>Not sure yet</option></select></label>
          <label>Vehicle<select name="vehicle">${(s.vehicleTypes || [])
            .map((v) => `<option>${esc(v.name)}</option>`)
            .join('')}</select></label>
        </div>
        <div class="row">
          <label>Date<input type="date" name="date" min="${todayISO()}"></label>
          <label>Time<select name="time"><option value="">Any time</option>${(b.timeSlots || [])
            .map((t) => `<option>${esc(t)}</option>`)
            .join('')}</select></label>
        </div>
        <label>Notes <span class="opt">(optional)</span><textarea name="notes" rows="3" placeholder="Car model, plate, anything we should know"></textarea></label>
        <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button class="btn primary" type="submit">Request booking</button>
        <p class="form-msg" id="bookingMsg" role="status"></p>
      </form>
    </div>
  </section>`;
}

function renderContact(s) {
  return `
  <section id="contact" class="section contact">
    <div class="wrap contact-grid">
      <div>
        <span class="eyebrow">Find us</span>
        <h2>Opening hours &amp; location</h2>
        <ul class="hours">${renderHours(s)}</ul>
        ${s.address ? `<p class="addr">${esc(s.address)}</p>` : ''}
        <div class="cta-row">
          ${s.phone ? `<a class="btn primary sm" href="tel:${esc(s.phone.replace(/\s/g, ''))}">Call ${esc(s.phone)}</a>` : ''}
          ${s.whatsapp ? `<a class="btn ghost sm" href="https://wa.me/${esc(s.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        </div>
      </div>
      ${
        s.mapEmbedUrl
          ? `<div class="map"><iframe src="${esc(s.mapEmbedUrl)}" loading="lazy" title="Map" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`
          : ''
      }
    </div>
  </section>`;
}

function render(data) {
  const s = data.settings;
  const sec = s.sections;
  const today = todayISO();

  const services = sec.services ? live(data.services) : [];
  const allServices = live(data.services);
  const offers = sec.offers ? live(data.offers).filter((o) => offerRunning(o, today)) : [];
  const gallery = sec.gallery ? live(data.gallery) : [];
  const reviews = sec.testimonials ? live(data.testimonials) : [];
  const showBooking = sec.booking && s.booking.enabled;

  const nav = [
    offers.length && ['#offers', 'Offers'],
    services.length && ['#services', 'Services'],
    sec.about && ['#about', 'About'],
    reviews.length && ['#reviews', 'Reviews'],
    sec.contact && ['#contact', 'Contact']
  ].filter(Boolean);

  const title = s.seo.metaTitle || `${s.businessName} — ${s.tagline}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(s.seo.metaDescription)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(s.seo.metaDescription)}">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚗</text></svg>">
<link rel="stylesheet" href="/css/site.css">
<style>:root{--accent:${esc(s.accentColor || '#0ea5e9')}}</style>
</head>
<body data-currency="${esc(s.currency)}" data-currency-pos="${esc(s.currencyPosition)}">
<header class="topbar">
  <div class="wrap bar">
    <a class="brand" href="/">
      ${s.logoUrl ? `<img src="${esc(s.logoUrl)}" alt="${esc(s.businessName)}">` : '<span class="mark">🚗</span>'}
      <span>${esc(s.businessName)}</span>
    </a>
    <nav class="nav" id="nav">
      ${nav.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('')}
      ${showBooking ? '<a class="btn primary sm" href="#booking">Book now</a>' : ''}
    </nav>
    <button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
</header>

<main>
  <section class="hero"${s.hero.imageUrl ? ` style="--hero-img:url('${esc(s.hero.imageUrl)}')"` : ''}>
    <div class="wrap hero-inner">
      <span class="eyebrow light">${esc(s.tagline)}</span>
      <h1>${esc(s.hero.title)}</h1>
      <p>${esc(s.hero.subtitle)}</p>
      <div class="cta-row">
        ${showBooking ? `<a class="btn primary" href="#booking">${esc(s.hero.primaryCta)}</a>` : ''}
        ${services.length ? `<a class="btn ghost light" href="#services">${esc(s.hero.secondaryCta)}</a>` : ''}
      </div>
      ${
        offers.length
          ? `<div class="hero-strip">🎉 <strong>${esc(offers[0].badge || 'Offer')}</strong> — ${esc(offers[0].title)} <a href="#offers">see all offers</a></div>`
          : ''
      }
    </div>
  </section>

  ${renderOffers(offers, s)}
  ${renderServices(services, s)}
  ${sec.about ? renderAbout(s) : ''}
  ${renderGallery(gallery)}
  ${renderTestimonials(reviews)}
  ${showBooking ? renderBooking(s, allServices) : ''}
  ${sec.contact ? renderContact(s) : ''}
</main>

<footer class="footer">
  <div class="wrap foot-grid">
    <div>
      <strong>${esc(s.businessName)}</strong>
      <p>${esc(s.tagline)}</p>
      ${s.footerNote ? `<p class="dim">${esc(s.footerNote)}</p>` : ''}
    </div>
    <div>
      ${s.address ? `<p>${esc(s.address)}</p>` : ''}
      ${s.phone ? `<p><a href="tel:${esc(s.phone.replace(/\s/g, ''))}">${esc(s.phone)}</a></p>` : ''}
      ${s.email ? `<p><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>` : ''}
    </div>
    <div class="socials">
      ${Object.entries(s.social || {})
        .filter(([, url]) => url)
        .map(([k, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(k)}</a>`)
        .join('')}
    </div>
  </div>
  <div class="wrap foot-bottom">
    <span>© ${new Date().getFullYear()} ${esc(s.businessName)}</span>
    <a href="/admin">Admin</a>
  </div>
</footer>
<script src="/js/site.js"></script>
</body>
</html>`;
}

module.exports = { render, esc };
