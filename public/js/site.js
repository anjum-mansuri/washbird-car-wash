/* Public site behaviour: mobile nav, vehicle-type pricing, booking form. */
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
    '.service-card, .offer-card, .review-grid blockquote, .gallery figure, .points li'
  );
  if (revealTargets.length && 'IntersectionObserver' in window) {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
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
          button.textContent = 'Request booking';
        });
    });
  }
})();
