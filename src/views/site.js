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

// Small inline icons (currentColor, so they pick up whatever link color surrounds them).
const WHATSAPP_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5C10 9 9.6 8 9.4 7.5c-.2-.4-.3-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.3s1 2.7 1.1 2.9c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.4 5.2L2 22l4.9-1.3C8.4 21.6 10.1 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.7 0-3.3-.5-4.7-1.3l-.3-.2-3 .8.8-2.9-.2-.3C3.7 14.7 3.2 13.4 3.2 12c0-4.8 3.9-8.8 8.8-8.8s8.8 3.9 8.8 8.8-4 8.8-8.8 8.8z"/></svg>';

const SOCIAL_ICONS = {
  facebook:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.33-.04-1.5-.14-2.8-.14C11.98 2 10 3.66 10 6.7v2.8H7v4h3V22h4z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2c2.7 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.15.55.55.89 1.11 1.15 1.77.25.64.42 1.37.47 2.43.05 1.06.06 1.42.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.64.25-1.37.42-2.43.47-1.06.05-1.42.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.7 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.22 1.15-1.77A4.9 4.9 0 0 1 5.45.53C6.09.28 6.82.11 7.88.06 8.94.01 9.3 0 12 0zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" transform="translate(0 2)"/></svg>',
  tiktok:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16.6 2h-3.2v13.4a2.8 2.8 0 1 1-2-2.68V9.4a6 6 0 1 0 5.2 5.95V8.6a7.6 7.6 0 0 0 4.4 1.4V6.8a4.4 4.4 0 0 1-4.4-4.4z"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6zm-1.2 18h1.7L6.4 3.9H4.6z"/></svg>'
};

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

/** "Starting from ₹X" for services whose final price varies, otherwise just "₹X". */
const priceLabel = (svc, s) => (svc.priceFrom ? `Starting from ${money(svc.price, s)}` : money(svc.price, s));

/** wa.me link with a pre-filled message, or '' if no WhatsApp number is set. */
function waLink(s, text) {
  if (!s.whatsapp) return '';
  return `https://wa.me/${esc(s.whatsapp.replace(/\D/g, ''))}?text=${encodeURIComponent(text)}`;
}

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

function renderServices(services, s, showBooking) {
  if (!services.length) return '';
  const vt = s.vehicleTypes || [];
  const generalSlots = (s.booking && s.booking.timeSlots) || [];
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
          .map((svc) => {
            const slots = svc.timeSlots && svc.timeSlots.length ? svc.timeSlots : generalSlots;
            const timePicker =
              showBooking && slots.length
                ? `<label class="svc-time"><span>Preferred time</span><select data-svc-time="${esc(svc.name)}"><option value="">Any time</option>${slots
                    .map((t) => `<option>${esc(t)}</option>`)
                    .join('')}</select></label>`
                : '';
            return `
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
            <span class="price" data-base="${Number(svc.price) || 0}" data-from="${svc.priceFrom ? '1' : ''}">${priceLabel(svc, s)}</span>
            ${svc.duration ? `<span class="dur">${esc(svc.duration)}</span>` : ''}
          </div>
          ${timePicker}
          <div class="service-actions">
            <a class="btn ghost sm" href="#booking" data-book="${esc(svc.name)}">Book this</a>
            ${
              s.whatsapp
                ? `<a class="btn whatsapp sm" href="${waLink(s, `Hi! I'd like to book ${svc.name} (${priceLabel(svc, s)}${svc.duration ? ', ' + svc.duration : ''}).`)}" target="_blank" rel="noopener">${WHATSAPP_ICON} WhatsApp</a>`
                : ''
            }
          </div>
        </article>`;
          })
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
              `<figure><button type="button" class="lightbox-trigger" data-lightbox-src="${esc(g.url)}" data-lightbox-caption="${esc(g.caption || '')}"><img src="${esc(g.url)}" alt="${esc(g.caption || 'Car wash result')}" loading="lazy"></button>${
                g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''
              }</figure>`
          )
          .join('')}
      </div>
    </div>
  </section>
  <div class="lightbox" id="lightbox" hidden>
    <button type="button" class="lightbox-close" id="lightboxClose" aria-label="Close">&times;</button>
    <img src="" alt="" id="lightboxImg">
    <p class="lightbox-caption" id="lightboxCaption"></p>
  </div>`;
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
          <label>Service<select name="service" id="bookingService">${services
            .map(
              (x) =>
                `<option data-price="${Number(x.price) || 0}" data-from="${x.priceFrom ? '1' : ''}" data-slots='${JSON.stringify(x.timeSlots || []).replace(/'/g, '&#39;')}'>${esc(x.name)}</option>`
            )
            .join('')}<option data-price="0">Not sure yet</option></select></label>
          <label>Vehicle<select name="vehicle" id="bookingVehicle">${(s.vehicleTypes || [])
            .map((v) => `<option data-mult="${Number(v.multiplier) || 1}">${esc(v.name)}</option>`)
            .join('')}</select></label>
        </div>
        <div class="row">
          <label>Date<input type="date" name="date" min="${todayISO()}"></label>
          <label><span id="bookingTimeLabel">Time</span><select name="time" id="bookingTime" data-general='${JSON.stringify(b.timeSlots || [])}'><option value="">Any time</option>${(b.timeSlots || [])
            .map((t) => `<option>${esc(t)}</option>`)
            .join('')}</select></label>
        </div>
        <div class="row">
          <label>Coupon code <span class="opt">(optional)</span>
            <span class="coupon-row"><input type="text" name="couponCode" id="couponCode" placeholder="e.g. MIDWEEK25" autocapitalize="characters"><button type="button" class="btn ghost sm" id="couponApply">Apply</button></span>
          </label>
          <div class="price-estimate" id="priceEstimate" hidden>
            <span class="pe-label">Estimated price</span>
            <span class="pe-value" id="priceEstimateValue"></span>
          </div>
        </div>
        <p class="form-msg" id="couponMsg" role="status"></p>
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
  const avgRating = reviews.length ? reviews.reduce((sum, t) => sum + (Number(t.rating) || 0), 0) / reviews.length : 0;

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
${s.logoUrl ? `<meta property="og:image" content="${esc(s.logoUrl)}">` : ''}
<link rel="icon" href="${s.logoUrl ? esc(s.logoUrl) : `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚗</text></svg>`}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css">
<style>:root{--accent:${esc(s.accentColor || '#0ea5e9')}}</style>
</head>
<body data-currency="${esc(s.currency)}" data-currency-pos="${esc(s.currencyPosition)}">
${
  s.phone || s.email
    ? `<div class="utility-bar">
        <div class="wrap utility-inner">
          <div class="utility-contact">
            ${s.email ? `<a href="mailto:${esc(s.email)}">✉ ${esc(s.email)}</a>` : ''}
            ${s.phone ? `<a href="tel:${esc(s.phone.replace(/\s/g, ''))}">☎ ${esc(s.phone)}</a>` : ''}
          </div>
          <div class="utility-socials">
            ${Object.entries(s.social || {})
              .filter(([, url]) => url)
              .map(
                ([k, url]) =>
                  `<a href="${esc(url)}" target="_blank" rel="noopener" class="social-badge" title="${esc(k)}" aria-label="${esc(k)}">${SOCIAL_ICONS[k] || esc(k)}</a>`
              )
              .join('')}
          </div>
        </div>
      </div>`
    : ''
}
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
    ${
      !s.hero.imageUrl && gallery.length
        ? `<div class="hero-slides" aria-hidden="true">${gallery
            .slice(0, 5)
            .map((g, i) => `<div class="hero-slide${i === 0 ? ' active' : ''}" style="background-image:url('${esc(g.url)}')"></div>`)
            .join('')}</div>`
        : ''
    }
    <span class="hero-blob a" aria-hidden="true"></span>
    <span class="hero-blob b" aria-hidden="true"></span>
    <div class="wrap hero-inner">
      <span class="eyebrow light">${esc(s.tagline)}</span>
      <h1>${esc(s.hero.title)}</h1>
      <p>${esc(s.hero.subtitle)}</p>
      <div class="cta-row">
        ${showBooking ? `<a class="btn primary" href="#booking">${esc(s.hero.primaryCta)}</a>` : ''}
        ${services.length ? `<a class="btn ghost light" href="#services">${esc(s.hero.secondaryCta)}</a>` : ''}
      </div>
      ${
        reviews.length || (sec.about && (s.about.points || []).length)
          ? `<div class="hero-badges">
              ${
                reviews.length
                  ? `<div class="hero-rating"><span class="stars">${stars(avgRating)}</span><strong>${avgRating.toFixed(1)}</strong><span class="dim">from ${reviews.length} review${reviews.length > 1 ? 's' : ''}</span></div>`
                  : ''
              }
              ${
                sec.about && (s.about.points || []).length
                  ? `<ul class="hero-chips">${s.about.points
                      .slice(0, 3)
                      .map((p) => `<li>${esc(p)}</li>`)
                      .join('')}</ul>`
                  : ''
              }
            </div>`
          : ''
      }
      ${
        offers.length
          ? `<div class="hero-strip">🎉 <strong>${esc(offers[0].badge || 'Offer')}</strong> — ${esc(offers[0].title)} <a href="#offers">see all offers</a></div>`
          : ''
      }
    </div>
  </section>

  ${renderOffers(offers, s)}
  ${renderServices(services, s, showBooking)}
  ${sec.about ? renderAbout(s) : ''}
  ${renderGallery(gallery)}
  ${renderTestimonials(reviews)}
  ${showBooking ? renderBooking(s, allServices) : ''}
  ${sec.contact ? renderContact(s) : ''}
</main>

<footer class="footer">
  <div class="builder-credit">
    <img src="/img/anjum-logo.jpeg" alt="Dr. Anjum — Web Design · AI Consulting">
    <span>Site by Dr. Anjum</span>
  </div>
  <div class="wrap foot-grid">
    <div class="foot-brand">
      ${s.logoUrl ? `<img src="${esc(s.logoUrl)}" alt="${esc(s.businessName)}" class="foot-logo">` : ''}
      <div>
        <strong>${esc(s.businessName)}</strong>
        <p>${esc(s.tagline)}</p>
        ${s.footerNote ? `<p class="dim">${esc(s.footerNote)}</p>` : ''}
      </div>
    </div>
    ${
      nav.length
        ? `<div class="foot-links"><strong>Quick Links</strong><ul>${nav
            .map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`)
            .join('')}</ul></div>`
        : ''
    }
    <div>
      <strong>Get in touch</strong>
      ${s.address ? `<p>${esc(s.address)}</p>` : ''}
      ${s.phone ? `<p><a href="tel:${esc(s.phone.replace(/\s/g, ''))}">${esc(s.phone)}</a></p>` : ''}
      ${s.email ? `<p><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>` : ''}
      <div class="socials">
        ${Object.entries(s.social || {})
          .filter(([, url]) => url)
          .map(
            ([k, url]) =>
              `<a href="${esc(url)}" target="_blank" rel="noopener" class="social-badge" title="${esc(k)}" aria-label="${esc(k)}">${SOCIAL_ICONS[k] || esc(k)}</a>`
          )
          .join('')}
      </div>
    </div>
  </div>
  <div class="wrap foot-bottom">
    <span>© ${new Date().getFullYear()} ${esc(s.businessName)}</span>
    <a href="/admin">Admin</a>
  </div>
</footer>
${
  s.whatsapp
    ? `<a class="whatsapp-fab" href="${waLink(s, `Hi ${s.businessName}, I'd like to know more about your services.`)}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" title="Chat on WhatsApp">${WHATSAPP_ICON}</a>`
    : ''
}
<script src="/js/site.js"></script>
</body>
</html>`;
}

module.exports = { render, esc };
