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

  // --- emoji confetti burst from an element ---
  function confetti(fromEl) {
    if (reducedMotion || !fromEl || !fromEl.animate) return;
    var r = fromEl.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var bits = ['🫧', '✨', '🚗', '💦', '⭐', '🎉', '💙', '🫧'];
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
