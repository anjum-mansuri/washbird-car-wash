/* Public site behaviour: motion, mobile nav, vehicle-type pricing, booking form. */
(function () {
  'use strict';

  // --- hero photo slideshow (real gallery photos, when no fixed hero image is set) ---
  var heroSlides = document.querySelectorAll('.hero-slide');
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroSlides.length > 1 && !reducedMotion) {
    var activeSlide = 0;
    setInterval(function () {
      heroSlides[activeSlide].classList.remove('active');
      activeSlide = (activeSlide + 1) % heroSlides.length;
      heroSlides[activeSlide].classList.add('active');
    }, 5000);
  }

  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // --- hero title: words pop in one by one, last two get the animated gradient ---
  var heroTitle = document.querySelector('.hero h1');
  if (heroTitle && !reducedMotion) {
    var words = heroTitle.textContent.trim().split(/\s+/);
    heroTitle.setAttribute('aria-label', heroTitle.textContent.trim());
    heroTitle.innerHTML = words.map(function (w, i) {
      var safe = w.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      var hl = words.length > 2 && i >= words.length - 2 ? ' hl' : '';
      return '<span class="w' + hl + '" aria-hidden="true" style="--i:' + i + '">' + safe + '</span>';
    }).join(' ');
  }

  // --- scroll progress bar ---
  var progress = document.querySelector('.scroll-progress');
  if (progress) {
    var syncProgress = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    syncProgress();
    window.addEventListener('scroll', syncProgress, { passive: true });
  }

  // --- hero rating counts up from 0 ---
  var ratingEl = document.querySelector('.hero-rating strong');
  if (ratingEl && !reducedMotion) {
    var target = parseFloat(ratingEl.textContent) || 0;
    var start = null;
    var tick = function (t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / 1400);
      ratingEl.textContent = (target * (1 - Math.pow(1 - k, 3))).toFixed(1);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // --- service cards: 3D tilt + cursor spotlight (mouse/trackpad only) ---
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.service-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', px * 100 + '%');
        card.style.setProperty('--my', py * 100 + '%');
        card.style.setProperty('--ry', (px - .5) * 8 + 'deg');
        card.style.setProperty('--rx', (.5 - py) * 8 + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });

    // magnetic primary buttons
    document.querySelectorAll('.btn.primary').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * .18;
        var dy = (e.clientY - r.top - r.height / 2) * .3;
        btn.style.translate = dx + 'px ' + dy + 'px';
      });
      btn.addEventListener('pointerleave', function () { btn.style.translate = ''; });
    });
  }

  // --- Diwali: fireworks over the hero + golden sparkle cursor trail ---
  var diwali = document.body.classList.contains('diwali');
  var fwCanvas = document.querySelector('.fireworks');
  if (diwali && fwCanvas && fwCanvas.getContext && !reducedMotion) {
    var ctx = fwCanvas.getContext('2d');
    var heroEl = fwCanvas.parentNode;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, rockets = [], sparks = [], heroVisible = true, lastLaunch = 0;
    var palette = ['#ffd23f', '#ff9f1c', '#ff4d6d', '#e11d74', '#fff3b0', '#ffb400', '#7ee8fa', '#c77dff'];
    var resize = function () {
      W = heroEl.clientWidth; H = heroEl.clientHeight;
      fwCanvas.width = W * dpr; fwCanvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; }).observe(heroEl);
    }
    var launch = function (x, y) {
      rockets.push({
        x: x == null ? W * (.12 + Math.random() * .76) : x, y: H,
        vx: (Math.random() - .5) * 1.2, vy: -(H / 55 + Math.random() * 3),
        ty: y == null ? H * (.12 + Math.random() * .3) : y,
        color: palette[(Math.random() * palette.length) | 0]
      });
    };
    var burst = function (r) {
      var n = 60 + ((Math.random() * 40) | 0);
      var ring = Math.random() < .35;
      var alt = palette[(Math.random() * palette.length) | 0];
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2;
        var sp = ring ? 4.2 : 1 + Math.random() * 4.5;
        sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: .012 + Math.random() * .014, color: i % 3 ? r.color : alt, size: 1.4 + Math.random() * 1.6 });
      }
    };
    var frame = function (t) {
      requestAnimationFrame(frame);
      if (!heroVisible || document.hidden) return;
      if (t - lastLaunch > 900 + Math.random() * 900) { launch(); lastLaunch = t; }
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = rockets.length - 1; i >= 0; i--) {
        var r = rockets[i];
        r.x += r.vx; r.y += r.vy; r.vy *= .985;
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath(); ctx.arc(r.x, r.y, 2, 0, Math.PI * 2); ctx.fill();
        if (r.y <= r.ty || r.vy > -1) { burst(r); rockets.splice(i, 1); }
      }
      for (var j = sparks.length - 1; j >= 0; j--) {
        var p = sparks[j];
        p.x += p.vx; p.y += p.vy; p.vx *= .97; p.vy = p.vy * .97 + .045; p.life -= p.decay;
        if (p.life <= 0) { sparks.splice(j, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    requestAnimationFrame(frame);
    // tap/click the sky to launch your own firework
    heroEl.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      var rect = heroEl.getBoundingClientRect();
      launch(e.clientX - rect.left, e.clientY - rect.top);
    });
  }
  if (diwali && finePointer && !reducedMotion) {
    var lastSpark = 0;
    document.addEventListener('pointermove', function (e) {
      var now = Date.now();
      if (now - lastSpark < 40) return;
      lastSpark = now;
      var s = document.createElement('span');
      s.className = 'spark';
      s.style.left = e.clientX - 3 + 'px';
      s.style.top = e.clientY - 3 + 'px';
      document.body.appendChild(s);
      s.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: 'translate(' + (Math.random() * 20 - 10) + 'px,' + (14 + Math.random() * 16) + 'px) scale(0)', opacity: 0 }
      ], { duration: 700, easing: 'ease-out' }).onfinish = function () { s.remove(); };
    }, { passive: true });
  }

  // --- Washbird mascot: flies in on page load and perches on the header logo ---
  var BIRD_SVG =
    '<svg viewBox="0 0 80 64" aria-hidden="true">' +
    '<defs>' +
      '<linearGradient id="wbBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#0b3d91"/></linearGradient>' +
      '<linearGradient id="wbWing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#cfd8e3"/><stop offset="1" stop-color="#8e9bab"/></linearGradient>' +
    '</defs>' +
    '<g class="wb-wing wb-wing-back"><path d="M38 33 C30 15 18 7 5 5 C13 11 15 15 13 19 C19 19 21 23 19 27 C25 27 30 30 38 35 Z" fill="#9fb0c4" stroke="#1e3a8a" stroke-width="1.2"/></g>' +
    '<path d="M24 36 L5 28 L9 36 L4 43 L24 42 Z" fill="#1e40af" stroke="#0b2a6b" stroke-width="1.2"/>' +
    '<path d="M22 37 L9 33 L12 38" fill="none" stroke="#f2b705" stroke-width="1.5"/>' +
    '<ellipse cx="40" cy="38" rx="19" ry="14" fill="url(#wbBody)" stroke="#0b2a6b" stroke-width="1.4"/>' +
    '<ellipse cx="44" cy="43" rx="11" ry="7" fill="#bfdbfe"/>' +
    '<g class="wb-feet"><path d="M38 51 L36 57 M36 57 L33 58 M36 57 L37 59 M46 51 L46 57 M46 57 L43 58 M46 57 L48 59" stroke="#f97316" stroke-width="2" stroke-linecap="round" fill="none"/></g>' +
    '<g class="wb-head">' +
      '<circle cx="57" cy="26" r="11.5" fill="url(#wbBody)" stroke="#0b2a6b" stroke-width="1.4"/>' +
      '<path d="M46 23 C47 13 64 11 68 20 L76 21 C76 24 70 24 66 23 Z" fill="#1d4ed8" stroke="#0b2a6b" stroke-width="1.2"/>' +
      '<text x="56.5" y="20.5" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="7" fill="#fff" text-anchor="middle">W</text>' +
      '<g class="wb-eye"><circle cx="61" cy="27" r="3.4" fill="#fff"/><circle cx="62" cy="27.3" r="1.8" fill="#0d0d1a"/><circle cx="62.6" cy="26.5" r=".6" fill="#fff"/></g>' +
      '<path d="M67 28 L77 31 L67 33 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1"/>' +
      '<circle cx="55" cy="31" r="2.2" fill="#f472b6" opacity=".55"/>' +
    '</g>' +
    '<g class="wb-garland">' +
      '<circle cx="47" cy="35" r="2.6" fill="#ff8c00"/><circle cx="51" cy="37" r="2.6" fill="#ffd23f"/><circle cx="55" cy="37.5" r="2.6" fill="#ff8c00"/><circle cx="59" cy="36" r="2.6" fill="#ffd23f"/><circle cx="62" cy="33" r="2.4" fill="#ff8c00"/>' +
    '</g>' +
    '<g class="wb-wing wb-wing-front"><path d="M40 34 C32 14 20 5 6 3 C14 9 16 13 14 17 C20 17 22 21 20 25 C26 25 31 29 40 36 Z" fill="url(#wbWing)" stroke="#1e3a8a" stroke-width="1.3"/>' +
      '<path d="M6 3 C18 6 30 14 37 30" fill="none" stroke="#f2b705" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M16 18 C24 20 30 25 35 31 M21 26 C27 27 31 30 35 33" fill="none" stroke="#8e9bab" stroke-width="1"/></g>' +
    '</svg>';

  var brand = document.querySelector('.topbar .brand');
  var brandLogo = brand ? brand.querySelector('img, .mark') : null;
  if (brand && brandLogo && !reducedMotion && document.body.animate) {
    var BW = 56, BH = 45, PERCH_W = 34; // flight size, and size while perched on the logo
    var ps = PERCH_W / BW;
    var bird = document.createElement('div');
    bird.innerHTML = BIRD_SVG;
    bird.title = 'Tap me!';
    var busy = false;

    var at = function (x, y, face, s, rot) {
      return 'translate(' + x + 'px,' + y + 'px) rotate(' + (rot || 0) + 'deg) scale(' + face * s + ',' + s + ')';
    };
    // centre of the bird when perched on the top-right rim of the round logo (viewport coords)
    var perchPoint = function () {
      var lr = brandLogo.getBoundingClientRect();
      return { x: lr.left + lr.width / 2 + PERCH_W / 2 - 6, y: lr.top - PERCH_W * (BH / BW) / 2 + 11 };
    };
    // last three keyframes of every flight: swoop in, turn around, settle on the logo
    var landing = function (p) {
      return [
        { transform: at(p.x + 70, p.y + 50, -1, .78, -6), offset: .84 },
        { transform: at(p.x + 6, p.y - 22, -1, .66, 4), offset: .94 },
        { transform: at(p.x, p.y, 1, ps, 0), offset: 1 }
      ];
    };

    /** Fly the bird along `frames` (fixed to the viewport), then perch it back on the logo. */
    var fly = function (frames, duration, delay) {
      busy = true;
      bird.remove();
      bird.className = 'wb-bird flying';
      bird.removeAttribute('style');
      document.body.appendChild(bird);
      var flight = bird.animate(frames, { duration: duration, delay: delay || 0, easing: 'ease-in-out', fill: 'both' });

      // sparkle (Diwali) or water-droplet trail while flying
      var trail = setInterval(function () {
        var r = bird.getBoundingClientRect();
        if (r.right < 0 || r.left > window.innerWidth) return;
        var d = document.createElement('span');
        d.className = document.body.classList.contains('diwali') ? 'spark' : 'wb-drop';
        d.style.left = r.left + r.width / 2 + 'px';
        d.style.top = r.top + r.height * .6 + 'px';
        document.body.appendChild(d);
        d.animate([
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: 'translate(' + (Math.random() * 16 - 8) + 'px,' + (24 + Math.random() * 20) + 'px) scale(.2)', opacity: 0 }
        ], { duration: 800, easing: 'ease-out' }).onfinish = function () { d.remove(); };
      }, 45);

      flight.onfinish = function () {
        clearInterval(trail);
        // re-home the bird inside the header so it scrolls with the logo
        bird.remove();
        flight.cancel();
        bird.className = 'wb-bird perched';
        bird.style.width = PERCH_W + 'px';
        bird.style.left = brandLogo.offsetLeft + brandLogo.offsetWidth / 2 - 6 + 'px';
        bird.style.top = brandLogo.offsetTop - PERCH_W * (BH / BW) + 11 + 'px';
        brand.appendChild(bird);
        bird.animate([{ translate: '0 -6px' }, { translate: '0 0' }, { translate: '0 -3px' }, { translate: '0 0' }], { duration: 500, easing: 'ease-out' });
        brandLogo.classList.remove('wb-glow');
        void brandLogo.offsetWidth;
        brandLogo.classList.add('wb-glow');
        confettiBurst(brandLogo, 12);
        busy = false;
      };
    };

    // entrance: swoop in from the right across the hero
    (function () {
      var vw = window.innerWidth, vh = window.innerHeight, p = perchPoint();
      var big = vw > 700 ? 1.9 : 1.3; // bigger while flying across the hero
      fly([
        { transform: at(vw + 120, vh * .62, -1, big, 8), offset: 0 },
        { transform: at(vw * .66, vh * .3, -1, big * 1.05, -10), offset: .22 },
        { transform: at(vw * .42, vh * .55, -1, big * 1.1, 12), offset: .46 },
        { transform: at(Math.min(vw * .3, p.x + 220), vh * .34, -1, big * .85, -14), offset: .66 }
      ].concat(landing(p)), 3600, 500);
    })();

    // tap the perched bird: it takes off, loops around the screen and comes back
    bird.addEventListener('click', function (e) {
      e.preventDefault(); // it sits inside the logo's home link
      e.stopPropagation();
      if (busy) return;
      var vw = window.innerWidth, vh = window.innerHeight, p = perchPoint();
      var big = vw > 700 ? 1.7 : 1.25;
      // little startled hop + chirp bubble before take-off
      var chirp = document.createElement('span');
      chirp.className = 'wb-chirp';
      chirp.textContent = ['Wheee! 💨', 'Shine time! ✨', 'Tweet tweet! 🎶', 'Happy Diwali! 🪔'][(Math.random() * (document.body.classList.contains('diwali') ? 4 : 3)) | 0];
      chirp.style.left = p.x + 24 + 'px';
      chirp.style.top = p.y - 4 + 'px';
      document.body.appendChild(chirp);
      chirp.animate([
        { transform: 'translate(0, 6px) scale(.6)', opacity: 0 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: .2 },
        { transform: 'translate(4px, -4px) scale(1)', opacity: 1, offset: .75 },
        { transform: 'translate(8px, -10px) scale(.9)', opacity: 0 }
      ], { duration: 1600, easing: 'ease-out' }).onfinish = function () { chirp.remove(); };

      fly([
        { transform: at(p.x, p.y, 1, ps, 0), offset: 0 },
        { transform: at(p.x + 10, p.y - 26, 1, .8, -20), offset: .05 },
        { transform: at(p.x + 160, p.y + 120, 1, big * .9, 18), offset: .16 },
        { transform: at(vw * .62, vh * .3, 1, big, -12), offset: .3 },
        { transform: at(vw * .86, vh * .55, 1, big * 1.05, 30), offset: .42 },
        { transform: at(vw * .66, vh * .78, -1, big * 1.1, -8), offset: .54 },
        { transform: at(vw * .4, vh * .6, -1, big, 14), offset: .64 },
        { transform: at(Math.min(vw * .32, p.x + 240), vh * .36, -1, big * .85, -14), offset: .74 }
      ].concat(landing(p)), 4200);
    });
  }

  // small sparkle burst (used when the bird lands)
  function confettiBurst(el, n) {
    var r = el.getBoundingClientRect();
    var gold = document.body.classList.contains('diwali');
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      s.className = gold ? 'spark' : 'wb-drop';
      s.style.left = r.left + r.width / 2 + 'px';
      s.style.top = r.top + r.height / 2 + 'px';
      document.body.appendChild(s);
      var a = (i / n) * Math.PI * 2;
      s.animate([
        { transform: 'translate(0,0) scale(1.2)', opacity: 1 },
        { transform: 'translate(' + Math.cos(a) * 40 + 'px,' + Math.sin(a) * 40 + 'px) scale(.2)', opacity: 0 }
      ], { duration: 700, easing: 'ease-out' }).onfinish = (function (node) { return function () { node.remove(); }; })(s);
    }
  }

  // --- emoji confetti burst from an element ---
  function confetti(fromEl) {
    if (reducedMotion || !fromEl || !fromEl.animate) return;
    var r = fromEl.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var bits = document.body.classList.contains('diwali')
      ? ['🪔', '✨', '🎆', '🌼', '💛', '🎇', '🚗', '🪔']
      : ['🫧', '✨', '🚗', '💦', '⭐', '🎉', '💙', '🫧'];
    for (var i = 0; i < 32; i++) {
      var el = document.createElement('span');
      el.className = 'confetti';
      el.textContent = bits[i % bits.length];
      el.style.left = cx + 'px';
      el.style.top = cy + 'px';
      document.body.appendChild(el);
      var angle = Math.random() * Math.PI * 2;
      var dist = 90 + Math.random() * 220;
      var dx = Math.cos(angle) * dist;
      var dy = Math.sin(angle) * dist - 120;
      el.animate([
        { transform: 'translate(-50%, -50%) scale(.4) rotate(0deg)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(1.1) rotate(' + (Math.random() * 540 - 270) + 'deg)', opacity: 1, offset: .6 },
        { transform: 'translate(calc(-50% + ' + dx * 1.15 + 'px), calc(-50% + ' + (dy + 260) + 'px)) scale(.9) rotate(' + (Math.random() * 720 - 360) + 'deg)', opacity: 0 }
      ], { duration: 1400 + Math.random() * 600, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = (function (node) {
        return function () { node.remove(); };
      })(el);
    }
  }

  // --- gallery lightbox ---
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCaption = document.getElementById('lightboxCaption');
  var lightboxClose = document.getElementById('lightboxClose');
  if (lightbox && lightboxImg) {
    var closeLightbox = function () {
      lightbox.hidden = true;
      lightboxImg.src = '';
    };
    document.querySelectorAll('.lightbox-trigger').forEach(function (btn) {
      btn.addEventListener('click', function () {
        lightboxImg.src = btn.dataset.lightboxSrc;
        lightboxImg.alt = btn.dataset.lightboxCaption || '';
        lightboxCaption.textContent = btn.dataset.lightboxCaption || '';
        lightbox.hidden = false;
      });
    });
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
    });
  }

  // --- header shadow on scroll ---
  var topbar = document.querySelector('.topbar');
  if (topbar) {
    var syncTopbar = function () {
      topbar.classList.toggle('scrolled', window.scrollY > 4);
    };
    syncTopbar();
    window.addEventListener('scroll', syncTopbar, { passive: true });
  }

  // --- scroll-reveal animation on cards/sections ---
  var revealTargets = document.querySelectorAll(
    '.section-head, .service-card, .offer-card, .review-grid blockquote, .gallery figure, .points li, .booking-form, .booking-copy, .contact-grid > *'
  );
  if (revealTargets.length && 'IntersectionObserver' in window && !reducedMotion) {
    revealTargets.forEach(function (el) {
      el.classList.add('reveal');
      // stagger siblings so grids cascade in
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.transitionDelay = (idx % 4) * 90 + 'ms';
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: .12, rootMargin: '0px 0px -40px 0px' }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  // --- mobile nav ---
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') nav.classList.remove('open');
    });
  }

  // --- price recalculation per vehicle type ---
  var currency = document.body.dataset.currency || '';
  var currencyAfter = document.body.dataset.currencyPos === 'after';

  function formatMoney(n) {
    var value = Number.isInteger(n) ? String(n) : n.toFixed(2);
    return currencyAfter ? value + ' ' + currency : currency + ' ' + value;
  }

  var switches = document.querySelectorAll('.vehicle-switch .vt');
  var label = document.querySelector('[data-vt-label]');
  switches.forEach(function (btn) {
    btn.addEventListener('click', function () {
      switches.forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
      var mult = parseFloat(btn.dataset.mult) || 1;
      document.querySelectorAll('.price[data-base]').forEach(function (el) {
        var base = parseFloat(el.dataset.base) || 0;
        var text = formatMoney(Math.round(base * mult * 100) / 100);
        el.textContent = el.dataset.from ? 'Starting from ' + text : text;
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
      });
      if (label) label.textContent = btn.dataset.name;
      var vehicleSelect = document.querySelector('.booking-form [name="vehicle"]');
      if (vehicleSelect) {
        vehicleSelect.value = btn.dataset.name;
        updatePriceEstimate();
      }
    });
  });

  // --- "Book this" buttons preselect the service (and its card's chosen time, if any) ---
  document.querySelectorAll('[data-book]').forEach(function (link) {
    link.addEventListener('click', function () {
      var select = document.querySelector('.booking-form [name="service"]');
      if (select) {
        select.value = link.dataset.book;
        updateTimeSlotsForService();
        var card = link.closest('.service-card');
        var cardTime = card ? card.querySelector('[data-svc-time]') : null;
        if (timeSelect && cardTime && cardTime.value) {
          var available = Array.prototype.map.call(timeSelect.options, function (o) { return o.value; });
          if (available.indexOf(cardTime.value) !== -1) timeSelect.value = cardTime.value;
        }
        updatePriceEstimate();
      }
    });
  });

  // --- booking form: per-service time slots, live price estimate, coupon codes ---
  var form = document.getElementById('bookingForm');
  var msg = document.getElementById('bookingMsg');
  var serviceSelect = document.getElementById('bookingService');
  var vehicleSelect2 = document.getElementById('bookingVehicle');
  var timeSelect = document.getElementById('bookingTime');
  var timeLabel = document.getElementById('bookingTimeLabel');
  var estimateBox = document.getElementById('priceEstimate');
  var estimateValue = document.getElementById('priceEstimateValue');
  var couponInput = document.getElementById('couponCode');
  var couponApplyBtn = document.getElementById('couponApply');
  var couponMsg = document.getElementById('couponMsg');
  var appliedCoupon = null; // { title, discountType, discountValue }

  function selectedServiceOption() {
    return serviceSelect ? serviceSelect.options[serviceSelect.selectedIndex] : null;
  }

  /** Swap the general time list for a service-specific one, when the service has any set. */
  function updateTimeSlotsForService() {
    if (!timeSelect) return;
    var opt = selectedServiceOption();
    var slots = [];
    try { slots = opt ? JSON.parse(opt.dataset.slots || '[]') : []; } catch (e) { slots = []; }
    var general = [];
    try { general = JSON.parse(timeSelect.dataset.general || '[]'); } catch (e) { general = []; }
    var useSlots = slots.length ? slots : general;
    if (timeLabel) timeLabel.textContent = slots.length ? 'Preferred Service Time' : 'Time';
    var current = timeSelect.value;
    timeSelect.innerHTML = '<option value="">Any time</option>' + useSlots.map(function (t) {
      return '<option>' + t.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</option>';
    }).join('');
    if (useSlots.indexOf(current) !== -1) timeSelect.value = current;
  }

  /** Recompute and show the estimated price for the selected service + vehicle, minus any applied coupon. */
  function updatePriceEstimate() {
    if (!estimateBox) return;
    var opt = selectedServiceOption();
    var base = opt ? parseFloat(opt.dataset.price) || 0 : 0;
    if (!base) { estimateBox.hidden = true; return; }
    var mult = 1;
    if (vehicleSelect2) {
      var vOpt = vehicleSelect2.options[vehicleSelect2.selectedIndex];
      mult = vOpt ? parseFloat(vOpt.dataset.mult) || 1 : 1;
    }
    var price = Math.round(base * mult * 100) / 100;
    var prefix = opt && opt.dataset.from ? 'Starting from ' : '';
    estimateBox.hidden = false;

    if (appliedCoupon) {
      var discounted = appliedCoupon.discountType === 'flat'
        ? Math.max(0, price - appliedCoupon.discountValue)
        : Math.round(price * (1 - appliedCoupon.discountValue / 100) * 100) / 100;
      estimateValue.innerHTML =
        '<s class="pe-was">' + prefix + formatMoney(price) + '</s> ' +
        '<strong class="pe-now">' + prefix + formatMoney(discounted) + '</strong>' +
        '<span class="pe-save">' + appliedCoupon.title + ' applied</span>';
    } else {
      estimateValue.innerHTML = prefix + formatMoney(price);
    }
  }

  if (serviceSelect) {
    serviceSelect.addEventListener('change', function () {
      updateTimeSlotsForService();
      updatePriceEstimate();
    });
    updateTimeSlotsForService();
    updatePriceEstimate();
  }
  if (vehicleSelect2) vehicleSelect2.addEventListener('change', updatePriceEstimate);

  if (couponApplyBtn) {
    couponApplyBtn.addEventListener('click', function () {
      var code = (couponInput.value || '').trim();
      couponMsg.className = 'form-msg';
      if (!code) {
        couponMsg.className = 'form-msg err';
        couponMsg.textContent = 'Enter a code first.';
        return;
      }
      couponApplyBtn.disabled = true;
      couponApplyBtn.textContent = 'Checking…';
      fetch('/api/coupons/' + encodeURIComponent(code))
        .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.body.error || 'That code is not valid.');
          appliedCoupon = res.body;
          var amount = appliedCoupon.discountType === 'flat' ? formatMoney(appliedCoupon.discountValue) : appliedCoupon.discountValue + '%';
          couponMsg.className = 'form-msg ok';
          couponMsg.textContent = '✓ "' + code.toUpperCase() + '" applied — ' + amount + ' off (' + appliedCoupon.title + ').';
          updatePriceEstimate();
        })
        .catch(function (err) {
          appliedCoupon = null;
          couponMsg.className = 'form-msg err';
          couponMsg.textContent = err.message;
          updatePriceEstimate();
        })
        .finally(function () {
          couponApplyBtn.disabled = false;
          couponApplyBtn.textContent = 'Apply';
        });
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var payload = Object.fromEntries(new FormData(form).entries());
      if (!payload.name || !payload.phone) {
        msg.className = 'form-msg err';
        msg.textContent = 'Please add your name and phone number.';
        return;
      }
      delete payload.couponCode;
      if (appliedCoupon) {
        var opt = selectedServiceOption();
        var summary = 'Coupon applied: ' + couponInput.value.trim().toUpperCase() + ' (' + appliedCoupon.title + ')';
        if (estimateValue && !estimateBox.hidden) summary += ' — ' + estimateValue.textContent.replace(/\s+/g, ' ').trim();
        payload.notes = summary + (payload.notes ? '\n\n' + payload.notes : '');
      }
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = 'Sending…';
      msg.className = 'form-msg';
      msg.textContent = '';

      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.body.error || 'Something went wrong');
          msg.className = 'form-msg ok';
          msg.textContent = res.body.message || 'Thanks! We will be in touch.';
          confetti(button);
          form.reset();
          appliedCoupon = null;
          couponMsg.className = 'form-msg';
          couponMsg.textContent = '';
          updateTimeSlotsForService();
          updatePriceEstimate();
        })
        .catch(function (err) {
          msg.className = 'form-msg err';
          msg.textContent = err.message + ' — please call us instead.';
        })
        .finally(function () {
          button.disabled = false;
          button.textContent = 'Lock in my slot 🚀';
        });
    });
  }
})();
