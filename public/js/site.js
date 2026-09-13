/* Public site behaviour: mobile nav, vehicle-type pricing, booking form. */
(function () {
  'use strict';

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
        el.textContent = formatMoney(Math.round(base * mult * 100) / 100);
      });
      if (label) label.textContent = btn.dataset.name;
      var vehicleSelect = document.querySelector('.booking-form [name="vehicle"]');
      if (vehicleSelect) vehicleSelect.value = btn.dataset.name;
    });
  });

  // --- "Book this" buttons preselect the service ---
  document.querySelectorAll('[data-book]').forEach(function (link) {
    link.addEventListener('click', function () {
      var select = document.querySelector('.booking-form [name="service"]');
      if (select) select.value = link.dataset.book;
    });
  });

  // --- booking form ---
  var form = document.getElementById('bookingForm');
  var msg = document.getElementById('bookingMsg');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var payload = Object.fromEntries(new FormData(form).entries());
      if (!payload.name || !payload.phone) {
        msg.className = 'form-msg err';
        msg.textContent = 'Please add your name and phone number.';
        return;
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
