/* Admin panel — single-page controller for every editable part of the site. */
(function () {
  'use strict';

  var state = null;
  var tab = 'dashboard';

  var view = document.getElementById('view');
  var pageTitle = document.getElementById('pageTitle');
  var modal = document.getElementById('modal');
  var modalTitle = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');

  var TITLES = {
    dashboard: 'Dashboard', bookings: 'Bookings', services: 'Services', offers: 'Offers',
    gallery: 'Gallery', reviews: 'Reviews', content: 'Website content', settings: 'Settings', account: 'Account'
  };

  // ---------------------------------------------------------------- helpers
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(text, isError) {
    var t = document.getElementById('toast');
    t.textContent = text;
    t.className = 'toast show' + (isError ? ' err' : '');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.className = 'toast'; }, 2600);
  }

  function flagSaved() {
    var f = document.getElementById('savedFlag');
    f.classList.add('show');
    clearTimeout(f._timer);
    f._timer = setTimeout(function () { f.classList.remove('show'); }, 1400);
  }

  function api(method, path, body) {
    return fetch(path, {
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (r.status === 401) { location.href = '/admin/login'; throw new Error('Signed out'); }
      return r.json().then(function (data) {
        if (!r.ok) throw new Error(data.error || 'Request failed');
        return data;
      });
    });
  }

  function load() {
    return api('GET', '/api/all').then(function (data) {
      state = data;
      document.getElementById('sideName').textContent = data.settings.businessName;
      var mark = document.getElementById('sideMark');
      if (data.settings.logoUrl) {
        mark.innerHTML = '<img src="' + esc(data.settings.logoUrl) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px">';
      }
      document.documentElement.style.setProperty('--accent', data.settings.accentColor || '#0ea5e9');
      var newCount = data.bookings.filter(function (b) { return b.status === 'new'; }).length;
      var pill = document.getElementById('newCount');
      pill.textContent = newCount;
      pill.hidden = newCount === 0;
      return data;
    });
  }

  function save(patch) {
    return api('PUT', '/api/settings', patch).then(function (res) {
      state.settings = res.settings;
      flagSaved();
      return res;
    });
  }

  function sorted(list) {
    return list.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  function money(n) {
    var s = state.settings;
    var v = Number(n) || 0;
    return s.currencyPosition === 'after' ? v + ' ' + s.currency : s.currency + ' ' + v;
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) + ' ' +
      d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  // Collect a form into a plain object (checkboxes -> booleans, number inputs -> numbers)
  function formData(form) {
    var out = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'number') out[el.name] = el.value === '' ? 0 : Number(el.value);
      else out[el.name] = el.value;
    });
    return out;
  }

  function openModal(title, html, onSubmit) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.hidden = false;
    var form = modalBody.querySelector('form');
    if (form) {
      var first = form.querySelector('input, textarea, select');
      if (first) first.focus();
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        onSubmit(formData(form), form);
      });
    }
  }
  function closeModal() { modal.hidden = true; modalBody.innerHTML = ''; }
  document.getElementById('modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  /** Generic CRUD list handling shared by services / offers / reviews / gallery. */
  function collection(name) {
    return {
      list: function () { return sorted(state[name]); },
      create: function (item) {
        return api('POST', '/api/' + name, item).then(function (r) { state[name].push(r.item); return r.item; });
      },
      update: function (id, patch) {
        return api('PUT', '/api/' + name + '/' + id, patch).then(function (r) {
          var i = state[name].findIndex(function (x) { return x.id === id; });
          state[name][i] = r.item;
          return r.item;
        });
      },
      remove: function (id) {
        return api('DELETE', '/api/' + name + '/' + id).then(function () {
          state[name] = state[name].filter(function (x) { return x.id !== id; });
        });
      },
      move: function (id, dir) {
        var items = sorted(state[name]);
        var i = items.findIndex(function (x) { return x.id === id; });
        var j = i + dir;
        if (j < 0 || j >= items.length) return Promise.resolve();
        var tmp = items[i]; items[i] = items[j]; items[j] = tmp;
        var ids = items.map(function (x) { return x.id; });
        return api('POST', '/api/' + name + '/reorder', { ids: ids }).then(function () {
          items.forEach(function (x, k) {
            var ref = state[name].find(function (y) { return y.id === x.id; });
            ref.order = k;
          });
        });
      }
    };
  }

  // ------------------------------------------------------------- dashboard
  function viewDashboard() {
    var b = state.bookings;
    var today = new Date().toISOString().slice(0, 10);
    var todayCount = b.filter(function (x) { return (x.createdAt || '').slice(0, 10) === today; }).length;
    var newCount = b.filter(function (x) { return x.status === 'new'; }).length;
    var activeOffers = state.offers.filter(function (x) { return x.active; }).length;
    var activeServices = state.services.filter(function (x) { return x.active; }).length;
    var recent = b.slice().reverse().slice(0, 6);
    var sec = state.settings.sections;

    view.innerHTML =
      '<div class="stats">' +
        stat(newCount, 'New booking requests', true) +
        stat(todayCount, 'Requests today') +
        stat(activeServices, 'Live services') +
        stat(activeOffers, 'Live offers') +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="card"><h2>Latest requests</h2><p class="sub">Newest first.</p>' +
          (recent.length
            ? '<div class="items">' + recent.map(function (x) {
                return '<div class="item"><div class="body"><strong>' + esc(x.name) +
                  (x.status === 'new' ? ' <span class="badge new">new</span>' : '') +
                  '</strong><small>' + esc(x.service || '—') + ' · ' + esc(x.phone) + ' · ' + esc(fmtDate(x.createdAt)) +
                  '</small></div></div>';
              }).join('') + '</div>'
            : '<div class="empty">No bookings yet.</div>') +
          '<div class="btn-row" style="margin-top:14px"><button class="btn sm" data-goto="bookings">Open bookings</button></div>' +
        '</div>' +
        '<div class="card"><h2>Show / hide sections</h2><p class="sub">Turn parts of the website on or off instantly.</p>' +
          '<div class="stack">' + Object.keys(sec).map(function (key) {
            return '<label class="switch"><input type="checkbox" data-section="' + key + '"' + (sec[key] ? ' checked' : '') +
              '><span>' + esc(key.charAt(0).toUpperCase() + key.slice(1)) + '</span></label>';
          }).join('') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card"><h2>Quick links</h2><div class="btn-row">' +
        '<button class="btn" data-goto="services">Edit services &amp; prices</button>' +
        '<button class="btn" data-goto="offers">Manage offers</button>' +
        '<button class="btn" data-goto="content">Edit homepage text</button>' +
        '<a class="btn" href="/" target="_blank" rel="noopener">Preview website ↗</a>' +
      '</div></div>';

    view.querySelectorAll('[data-section]').forEach(function (input) {
      input.addEventListener('change', function () {
        var patch = { sections: {} };
        patch.sections[input.dataset.section] = input.checked;
        save(patch).then(function () { toast('Section updated'); });
      });
    });
    view.querySelectorAll('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () { go(btn.dataset.goto); });
    });
  }

  function stat(n, label, accent) {
    return '<div class="stat' + (accent && n ? ' accent' : '') + '"><div class="n">' + n + '</div><div class="l">' + esc(label) + '</div></div>';
  }

  // -------------------------------------------------------------- bookings
  var bookingFilter = 'all';

  function viewBookings() {
    var STATUSES = ['new', 'confirmed', 'done', 'cancelled'];
    var all = state.bookings.slice().reverse();
    var rows = bookingFilter === 'all' ? all : all.filter(function (b) { return b.status === bookingFilter; });

    view.innerHTML =
      '<div class="card">' +
        '<div class="row-between" style="margin-bottom:16px">' +
          '<div class="btn-row">' +
            ['all'].concat(STATUSES).map(function (s) {
              var count = s === 'all' ? all.length : all.filter(function (b) { return b.status === s; }).length;
              return '<button class="btn sm' + (bookingFilter === s ? ' primary' : '') + '" data-filter="' + s + '">' +
                esc(s.charAt(0).toUpperCase() + s.slice(1)) + ' (' + count + ')</button>';
            }).join('') +
          '</div>' +
          '<div class="btn-row"><a class="btn sm" href="/api/bookings/export.csv">Export CSV</a>' +
          '<button class="btn sm danger" id="clearDone">Delete cancelled &amp; done</button></div>' +
        '</div>' +
        (rows.length
          ? '<div class="table-wrap"><table><thead><tr>' +
            '<th>Customer</th><th>Service</th><th>When</th><th>Received</th><th>Status</th><th></th>' +
            '</tr></thead><tbody>' +
            rows.map(function (b) {
              return '<tr class="' + (b.status === 'new' ? 'unread' : '') + '">' +
                '<td><strong>' + esc(b.name) + '</strong><div class="sub">' + esc(b.phone) +
                  (b.email ? ' · ' + esc(b.email) : '') + '</div></td>' +
                '<td>' + esc(b.service || '—') + '<div class="sub">' + esc(b.vehicle || '') + '</div></td>' +
                '<td>' + esc(b.date || 'Any day') + '<div class="sub">' + esc(b.time || 'Any time') + '</div></td>' +
                '<td class="sub">' + esc(fmtDate(b.createdAt)) + '</td>' +
                '<td><select class="status" data-id="' + b.id + '">' +
                  STATUSES.map(function (s) {
                    return '<option value="' + s + '"' + (b.status === s ? ' selected' : '') + '>' + s + '</option>';
                  }).join('') + '</select></td>' +
                '<td><div class="btn-row">' +
                  (b.notes ? '<button class="btn sm" data-note="' + b.id + '">Notes</button>' : '') +
                  '<button class="btn sm danger" data-del="' + b.id + '">Delete</button>' +
                '</div></td></tr>';
            }).join('') + '</tbody></table></div>'
          : '<div class="empty">No bookings in this view.</div>') +
      '</div>';

    view.querySelectorAll('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () { bookingFilter = btn.dataset.filter; viewBookings(); });
    });
    view.querySelectorAll('select.status').forEach(function (sel) {
      sel.addEventListener('change', function () {
        api('PUT', '/api/bookings/' + sel.dataset.id, { status: sel.value }).then(function () {
          var b = state.bookings.find(function (x) { return x.id === sel.dataset.id; });
          b.status = sel.value;
          toast('Status updated');
          load().then(viewBookings);
        });
      });
    });
    view.querySelectorAll('[data-note]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var b = state.bookings.find(function (x) { return x.id === btn.dataset.note; });
        openModal('Notes from ' + b.name, '<div style="padding:22px"><p>' + esc(b.notes) + '</p></div>');
      });
    });
    view.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Delete this booking?')) return;
        api('DELETE', '/api/bookings/' + btn.dataset.del).then(function () {
          state.bookings = state.bookings.filter(function (x) { return x.id !== btn.dataset.del; });
          toast('Booking deleted');
          load().then(viewBookings);
        });
      });
    });
    document.getElementById('clearDone').addEventListener('click', function () {
      if (!confirm('Delete every booking marked done or cancelled?')) return;
      api('POST', '/api/bookings/cleanup').then(function () { load().then(viewBookings); toast('Cleaned up'); });
    });
  }

  // -------------------------------------------------------------- services
  function viewServices() {
    var c = collection('services');
    view.innerHTML =
      '<div class="card"><div class="row-between"><div><h2>Services &amp; prices</h2>' +
      '<p class="sub" style="margin:0">These build the price list on the homepage. Drag order with the arrows.</p></div>' +
      '<button class="btn primary" id="add">+ Add service</button></div></div>' +
      '<div class="items">' + c.list().map(function (s) {
        return '<div class="item' + (s.active ? '' : ' off') + '">' +
          '<span style="font-size:1.5rem">' + esc(s.icon || '🚿') + '</span>' +
          '<div class="body"><strong>' + esc(s.name) +
            (s.popular ? ' <span class="badge hot">popular</span>' : '') +
            (s.active ? '' : ' <span class="badge off">hidden</span>') +
          '</strong><small>' + esc(s.description) + '</small></div>' +
          '<div style="text-align:right;flex:none"><strong>' + esc(money(s.price)) + '</strong>' +
            '<div class="sub" style="color:var(--muted);font-size:.8rem">' + esc(s.duration || '') + '</div></div>' +
          '<div class="actions">' +
            '<button class="btn sm" data-up="' + s.id + '">↑</button>' +
            '<button class="btn sm" data-down="' + s.id + '">↓</button>' +
            '<button class="btn sm" data-edit="' + s.id + '">Edit</button>' +
            '<button class="btn sm danger" data-del="' + s.id + '">✕</button>' +
          '</div></div>';
      }).join('') + '</div>' +
      (c.list().length ? '' : '<div class="empty">No services yet — add your first one.</div>');

    function form(s) {
      s = s || {};
      return '<form>' +
        '<div class="grid-2">' +
          field('Name', '<input type="text" name="name" required value="' + esc(s.name) + '">') +
          field('Icon (emoji)', '<input type="text" name="icon" maxlength="4" value="' + esc(s.icon || '🚿') + '">') +
        '</div>' +
        field('Short description', '<textarea name="description" rows="2">' + esc(s.description) + '</textarea>') +
        '<div class="grid-2">' +
          field('Price (' + esc(state.settings.currency) + ')', '<input type="number" name="price" min="0" step="0.01" value="' + (s.price || 0) + '">') +
          field('Duration', '<input type="text" name="duration" placeholder="30 min" value="' + esc(s.duration) + '">') +
        '</div>' +
        field('What is included <span class="hint">one per line</span>',
          '<textarea name="features" rows="4">' + esc((s.features || []).join('\n')) + '</textarea>') +
        '<div class="grid-2">' +
          '<label class="switch"><input type="checkbox" name="popular"' + (s.popular ? ' checked' : '') + '><span>Mark as “Most booked”</span></label>' +
          '<label class="switch"><input type="checkbox" name="active"' + (s.active !== false ? ' checked' : '') + '><span>Show on website</span></label>' +
        '</div>' +
        '<div class="modal-foot"><button type="button" class="btn" data-cancel>Cancel</button>' +
        '<button class="btn primary" type="submit">Save service</button></div></form>';
    }

    function submit(existing) {
      return function (values) {
        values.features = values.features.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
        var p = existing ? c.update(existing.id, values) : c.create(values);
        p.then(function () { closeModal(); toast('Saved'); viewServices(); }).catch(function (e) { toast(e.message, true); });
      };
    }

    document.getElementById('add').addEventListener('click', function () {
      openModal('New service', form(), submit(null));
      wireCancel();
    });
    view.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var s = state.services.find(function (x) { return x.id === btn.dataset.edit; });
        openModal('Edit service', form(s), submit(s));
        wireCancel();
      });
    });
    wireListActions(c, viewServices, 'Delete this service?');
  }

  // ---------------------------------------------------------------- offers
  function viewOffers() {
    var c = collection('offers');
    view.innerHTML =
      '<div class="card"><div class="row-between"><div><h2>Offers &amp; promotions</h2>' +
      '<p class="sub" style="margin:0">Offers appear in the banner and the offers section. Leave dates blank to run indefinitely.</p></div>' +
      '<button class="btn primary" id="add">+ Add offer</button></div></div>' +
      '<div class="items">' + c.list().map(function (o) {
        var expired = o.endsOn && o.endsOn < new Date().toISOString().slice(0, 10);
        return '<div class="item' + (o.active && !expired ? '' : ' off') + '">' +
          (o.imageUrl ? '<img class="thumb" src="' + esc(o.imageUrl) + '" alt="">' : '<span style="font-size:1.4rem">🏷️</span>') +
          '<div class="body"><strong>' + esc(o.title) +
            (o.badge ? ' <span class="badge hot">' + esc(o.badge) + '</span>' : '') +
            (expired ? ' <span class="badge off">expired</span>' : (o.active ? '' : ' <span class="badge off">hidden</span>')) +
          '</strong><small>' + esc(o.description) +
            (o.code ? ' · code ' + esc(o.code) : '') +
            (o.endsOn ? ' · until ' + esc(o.endsOn) : '') + '</small></div>' +
          '<div class="actions">' +
            '<button class="btn sm" data-up="' + o.id + '">↑</button>' +
            '<button class="btn sm" data-down="' + o.id + '">↓</button>' +
            '<button class="btn sm" data-edit="' + o.id + '">Edit</button>' +
            '<button class="btn sm danger" data-del="' + o.id + '">✕</button>' +
          '</div></div>';
      }).join('') + '</div>' +
      (c.list().length ? '' : '<div class="empty">No offers yet.</div>');

    function form(o) {
      o = o || {};
      return '<form>' +
        field('Title', '<input type="text" name="title" required value="' + esc(o.title) + '">') +
        field('Description', '<textarea name="description" rows="2">' + esc(o.description) + '</textarea>') +
        '<div class="grid-2">' +
          field('Badge <span class="hint">e.g. 25% OFF</span>', '<input type="text" name="badge" value="' + esc(o.badge) + '">') +
          field('Promo code <span class="hint">optional</span>', '<input type="text" name="code" value="' + esc(o.code) + '">') +
        '</div>' +
        '<div class="grid-2">' +
          field('Starts on <span class="hint">optional</span>', '<input type="date" name="startsOn" value="' + esc(o.startsOn) + '">') +
          field('Ends on <span class="hint">optional</span>', '<input type="date" name="endsOn" value="' + esc(o.endsOn) + '">') +
        '</div>' +
        imageField('imageUrl', 'Background image', o.imageUrl) +
        '<label class="switch"><input type="checkbox" name="active"' + (o.active !== false ? ' checked' : '') + '><span>Show on website</span></label>' +
        '<div class="modal-foot"><button type="button" class="btn" data-cancel>Cancel</button>' +
        '<button class="btn primary" type="submit">Save offer</button></div></form>';
    }

    function submit(existing) {
      return function (values) {
        var p = existing ? c.update(existing.id, values) : c.create(values);
        p.then(function () { closeModal(); toast('Saved'); viewOffers(); }).catch(function (e) { toast(e.message, true); });
      };
    }

    document.getElementById('add').addEventListener('click', function () {
      openModal('New offer', form(), submit(null)); wireCancel(); wireUpload();
    });
    view.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var o = state.offers.find(function (x) { return x.id === btn.dataset.edit; });
        openModal('Edit offer', form(o), submit(o)); wireCancel(); wireUpload();
      });
    });
    wireListActions(c, viewOffers, 'Delete this offer?');
  }

  // --------------------------------------------------------------- gallery
  function viewGallery() {
    var c = collection('gallery');
    view.innerHTML =
      '<div class="card"><h2>Gallery</h2><p class="sub">Upload before/after shots. They appear in the “Our work” section.</p>' +
        '<div class="dropzone" id="drop">Drop images here or click to choose<br><small>JPG / PNG / WebP, up to 6 MB each</small>' +
        '<input type="file" id="file" accept="image/*" multiple hidden></div>' +
      '</div>' +
      (c.list().length
        ? '<div class="tiles">' + c.list().map(function (g) {
            return '<div class="tile"><img src="' + esc(g.url) + '" alt="">' +
              '<div class="tile-foot"><input type="text" data-caption="' + g.id + '" value="' + esc(g.caption) + '" placeholder="Caption…">' +
              '<button class="btn sm" data-up="' + g.id + '">↑</button>' +
              '<button class="btn sm" data-down="' + g.id + '">↓</button>' +
              '<button class="btn sm danger" data-del="' + g.id + '">✕</button></div></div>';
          }).join('') + '</div>'
        : '<div class="empty">No photos yet.</div>');

    var drop = document.getElementById('drop');
    var file = document.getElementById('file');
    drop.addEventListener('click', function () { file.click(); });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('hot'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('hot'); });
    });
    drop.addEventListener('drop', function (e) { uploadMany(e.dataTransfer.files); });
    file.addEventListener('change', function () { uploadMany(file.files); });

    function uploadMany(files) {
      var list = Array.prototype.slice.call(files);
      if (!list.length) return;
      toast('Uploading ' + list.length + ' image(s)…');
      list.reduce(function (chain, f) {
        return chain.then(function () {
          return upload(f).then(function (res) { return c.create({ url: res.url, caption: '' }); });
        });
      }, Promise.resolve())
        .then(function () { toast('Uploaded'); viewGallery(); })
        .catch(function (e) { toast(e.message, true); });
    }

    view.querySelectorAll('[data-caption]').forEach(function (input) {
      input.addEventListener('change', function () {
        c.update(input.dataset.caption, { caption: input.value }).then(function () { flagSaved(); });
      });
    });
    wireListActions(c, viewGallery, 'Remove this photo?');
  }

  // --------------------------------------------------------------- reviews
  function viewReviews() {
    var c = collection('testimonials');
    view.innerHTML =
      '<div class="card"><div class="row-between"><div><h2>Customer reviews</h2>' +
      '<p class="sub" style="margin:0">Shown in the reviews section of the homepage.</p></div>' +
      '<button class="btn primary" id="add">+ Add review</button></div></div>' +
      '<div class="items">' + c.list().map(function (t) {
        return '<div class="item' + (t.active ? '' : ' off') + '">' +
          '<span style="color:#f59e0b;flex:none">' + '★'.repeat(Math.max(0, Math.min(5, t.rating || 0))) + '</span>' +
          '<div class="body"><strong>' + esc(t.name) + (t.active ? '' : ' <span class="badge off">hidden</span>') +
          '</strong><small>' + esc(t.text) + '</small></div>' +
          '<div class="actions">' +
            '<button class="btn sm" data-up="' + t.id + '">↑</button>' +
            '<button class="btn sm" data-down="' + t.id + '">↓</button>' +
            '<button class="btn sm" data-edit="' + t.id + '">Edit</button>' +
            '<button class="btn sm danger" data-del="' + t.id + '">✕</button>' +
          '</div></div>';
      }).join('') + '</div>' +
      (c.list().length ? '' : '<div class="empty">No reviews yet.</div>');

    function form(t) {
      t = t || {};
      return '<form>' +
        '<div class="grid-2">' +
          field('Customer name', '<input type="text" name="name" required value="' + esc(t.name) + '">') +
          field('Rating', '<select name="rating">' + [5, 4, 3, 2, 1].map(function (n) {
            return '<option value="' + n + '"' + (Number(t.rating) === n ? ' selected' : '') + '>' + '★'.repeat(n) + '</option>';
          }).join('') + '</select>') +
        '</div>' +
        field('Review text', '<textarea name="text" rows="3">' + esc(t.text) + '</textarea>') +
        field('Label <span class="hint">e.g. “Regular since 2022”</span>', '<input type="text" name="role" value="' + esc(t.role) + '">') +
        '<label class="switch"><input type="checkbox" name="active"' + (t.active !== false ? ' checked' : '') + '><span>Show on website</span></label>' +
        '<div class="modal-foot"><button type="button" class="btn" data-cancel>Cancel</button>' +
        '<button class="btn primary" type="submit">Save review</button></div></form>';
    }

    function submit(existing) {
      return function (values) {
        values.rating = Number(values.rating);
        var p = existing ? c.update(existing.id, values) : c.create(values);
        p.then(function () { closeModal(); toast('Saved'); viewReviews(); }).catch(function (e) { toast(e.message, true); });
      };
    }

    document.getElementById('add').addEventListener('click', function () {
      openModal('New review', form(), submit(null)); wireCancel();
    });
    view.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = state.testimonials.find(function (x) { return x.id === btn.dataset.edit; });
        openModal('Edit review', form(t), submit(t)); wireCancel();
      });
    });
    wireListActions(c, viewReviews, 'Delete this review?');
  }

  // --------------------------------------------------------------- content
  function viewContent() {
    var s = state.settings;
    view.innerHTML =
      '<form id="contentForm">' +
      '<div class="card"><h2>Hero section</h2><p class="sub">The first thing visitors see.</p>' +
        field('Headline', '<input type="text" name="hero.title" value="' + esc(s.hero.title) + '">') +
        field('Sub-headline', '<textarea name="hero.subtitle" rows="2">' + esc(s.hero.subtitle) + '</textarea>') +
        '<div class="grid-2">' +
          field('Primary button text', '<input type="text" name="hero.primaryCta" value="' + esc(s.hero.primaryCta) + '">') +
          field('Secondary button text', '<input type="text" name="hero.secondaryCta" value="' + esc(s.hero.secondaryCta) + '">') +
        '</div>' +
        imageField('hero.imageUrl', 'Background photo', s.hero.imageUrl) +
      '</div>' +
      '<div class="card"><h2>About section</h2>' +
        field('Heading', '<input type="text" name="about.title" value="' + esc(s.about.title) + '">') +
        field('Text <span class="hint">blank line = new paragraph</span>', '<textarea name="about.text" rows="4">' + esc(s.about.text) + '</textarea>') +
        field('Selling points <span class="hint">one per line</span>', '<textarea name="about.points" rows="4">' + esc((s.about.points || []).join('\n')) + '</textarea>') +
      '</div>' +
      '<div class="card"><h2>Booking form</h2>' +
        '<label class="switch" style="margin-bottom:14px"><input type="checkbox" name="booking.enabled"' + (s.booking.enabled ? ' checked' : '') + '><span>Accept bookings through the website</span></label>' +
        '<div class="grid-2">' +
          field('Heading', '<input type="text" name="booking.title" value="' + esc(s.booking.title) + '">') +
          field('Sub-text', '<input type="text" name="booking.subtitle" value="' + esc(s.booking.subtitle) + '">') +
        '</div>' +
        field('Thank-you message', '<input type="text" name="booking.successMessage" value="' + esc(s.booking.successMessage) + '">') +
        field('Bookable time slots <span class="hint">one per line</span>', '<textarea name="booking.timeSlots" rows="4">' + esc((s.booking.timeSlots || []).join('\n')) + '</textarea>') +
      '</div>' +
      '<div class="card"><h2>Search engine listing</h2>' +
        field('Page title <span class="hint">leave blank to use business name + tagline</span>', '<input type="text" name="seo.metaTitle" value="' + esc(s.seo.metaTitle) + '">') +
        field('Meta description', '<textarea name="seo.metaDescription" rows="2">' + esc(s.seo.metaDescription) + '</textarea>') +
        field('Footer note', '<input type="text" name="footerNote" value="' + esc(s.footerNote) + '">') +
      '</div>' +
      '<button class="btn primary" type="submit">Save changes</button></form>';

    wireUpload();
    document.getElementById('contentForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = formData(e.target);
      save({
        hero: {
          title: v['hero.title'], subtitle: v['hero.subtitle'], imageUrl: v['hero.imageUrl'],
          primaryCta: v['hero.primaryCta'], secondaryCta: v['hero.secondaryCta']
        },
        about: {
          title: v['about.title'], text: v['about.text'],
          points: lines(v['about.points'])
        },
        booking: {
          enabled: v['booking.enabled'], title: v['booking.title'], subtitle: v['booking.subtitle'],
          successMessage: v['booking.successMessage'], timeSlots: lines(v['booking.timeSlots'])
        },
        seo: { metaTitle: v['seo.metaTitle'], metaDescription: v['seo.metaDescription'] },
        footerNote: v.footerNote
      }).then(function () { toast('Content saved'); }).catch(function (err) { toast(err.message, true); });
    });
  }

  // -------------------------------------------------------------- settings
  function viewSettings() {
    var s = state.settings;
    view.innerHTML =
      '<form id="settingsForm">' +
      '<div class="card"><h2>Business details</h2>' +
        '<div class="grid-2">' +
          field('Business name', '<input type="text" name="businessName" value="' + esc(s.businessName) + '">') +
          field('Tagline', '<input type="text" name="tagline" value="' + esc(s.tagline) + '">') +
          field('Phone', '<input type="text" name="phone" value="' + esc(s.phone) + '">') +
          field('WhatsApp number <span class="hint">digits only, with country code</span>', '<input type="text" name="whatsapp" value="' + esc(s.whatsapp) + '">') +
          field('Email', '<input type="email" name="email" value="' + esc(s.email) + '">') +
          field('Address', '<input type="text" name="address" value="' + esc(s.address) + '">') +
        '</div>' +
        field('Google Maps embed URL <span class="hint">Maps → Share → Embed → copy the src link</span>',
          '<input type="text" name="mapEmbedUrl" value="' + esc(s.mapEmbedUrl) + '">') +
        imageField('logoUrl', 'Logo', s.logoUrl) +
      '</div>' +

      '<div class="card"><h2>Look &amp; currency</h2>' +
        '<div class="grid-3">' +
          field('Accent colour', '<input type="color" name="accentColor" value="' + esc(s.accentColor) + '">') +
          field('Currency', '<input type="text" name="currency" value="' + esc(s.currency) + '">') +
          field('Symbol position', '<select name="currencyPosition">' +
            '<option value="before"' + (s.currencyPosition === 'before' ? ' selected' : '') + '>Before (AED 50)</option>' +
            '<option value="after"' + (s.currencyPosition === 'after' ? ' selected' : '') + '>After (50 AED)</option></select>') +
        '</div>' +
      '</div>' +

      '<div class="card"><h2>Opening hours</h2>' +
        '<div class="stack">' + s.hours.map(function (h, i) {
          return '<div class="row-between" style="gap:10px">' +
            '<strong style="width:110px;font-size:.9rem">' + esc(h.day) + '</strong>' +
            '<input type="time" name="hours.' + i + '.open" value="' + esc(h.open) + '" style="max-width:140px">' +
            '<input type="time" name="hours.' + i + '.close" value="' + esc(h.close) + '" style="max-width:140px">' +
            '<label class="switch"><input type="checkbox" name="hours.' + i + '.closed"' + (h.closed ? ' checked' : '') + '><span>Closed</span></label>' +
          '</div>';
        }).join('') + '</div>' +
      '</div>' +

      '<div class="card"><h2>Vehicle types &amp; price multipliers</h2>' +
        '<p class="sub">Visitors switch between these on the price list. 1 = base price, 1.3 = +30%.</p>' +
        field('One per line — <code>Name | multiplier</code>',
          '<textarea name="vehicleTypes" rows="4">' +
          esc((s.vehicleTypes || []).map(function (v) { return v.name + ' | ' + v.multiplier; }).join('\n')) +
          '</textarea>') +
      '</div>' +

      '<div class="card"><h2>Social links</h2><div class="grid-2">' +
        ['facebook', 'instagram', 'tiktok', 'x'].map(function (k) {
          return field(k.charAt(0).toUpperCase() + k.slice(1), '<input type="text" name="social.' + k + '" placeholder="https://…" value="' + esc((s.social || {})[k]) + '">');
        }).join('') +
      '</div></div>' +

      '<button class="btn primary" type="submit">Save settings</button>' +
      '</form>' +

      '<div class="card" style="margin-top:18px"><h2>Data</h2><p class="sub">Everything lives in <code>data/db.json</code>.</p>' +
        '<div class="btn-row"><a class="btn" href="/api/export" download>Download backup</a>' +
        '<button class="btn" id="backupBtn">Save a backup on the server</button></div></div>';

    wireUpload();
    document.getElementById('backupBtn').addEventListener('click', function () {
      api('POST', '/api/backup').then(function (r) { toast('Backup saved: ' + r.file); });
    });

    document.getElementById('settingsForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = formData(e.target);
      var hours = s.hours.map(function (h, i) {
        return { day: h.day, open: v['hours.' + i + '.open'], close: v['hours.' + i + '.close'], closed: v['hours.' + i + '.closed'] };
      });
      var vehicleTypes = lines(v.vehicleTypes).map(function (line) {
        var parts = line.split('|');
        return { name: parts[0].trim(), multiplier: Number((parts[1] || '1').trim()) || 1 };
      }).filter(function (x) { return x.name; });

      save({
        businessName: v.businessName, tagline: v.tagline, phone: v.phone, whatsapp: v.whatsapp,
        email: v.email, address: v.address, mapEmbedUrl: v.mapEmbedUrl, logoUrl: v.logoUrl,
        accentColor: v.accentColor, currency: v.currency, currencyPosition: v.currencyPosition,
        hours: hours, vehicleTypes: vehicleTypes,
        social: { facebook: v['social.facebook'], instagram: v['social.instagram'], tiktok: v['social.tiktok'], x: v['social.x'] }
      }).then(function () {
        toast('Settings saved');
        return load();
      }).catch(function (err) { toast(err.message, true); });
    });
  }

  // --------------------------------------------------------------- account
  function viewAccount() {
    view.innerHTML =
      '<div class="card" style="max-width:520px"><h2>Change password</h2>' +
        '<p class="sub">Use something long. Anyone with this password can edit the website.</p>' +
        '<form id="pwForm" class="stack">' +
          field('Current password', '<input type="password" name="current" required autocomplete="current-password">') +
          field('New password <span class="hint">at least 8 characters</span>', '<input type="password" name="next" required minlength="8" autocomplete="new-password">') +
          field('Repeat new password', '<input type="password" name="confirm" required minlength="8" autocomplete="new-password">') +
          '<button class="btn primary" type="submit">Update password</button>' +
        '</form>' +
      '</div>';

    document.getElementById('pwForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = formData(e.target);
      if (v.next !== v.confirm) return toast('New passwords do not match', true);
      api('POST', '/api/password', { current: v.current, next: v.next })
        .then(function () { toast('Password updated'); e.target.reset(); })
        .catch(function (err) { toast(err.message, true); });
    });
  }

  // -------------------------------------------------------- shared widgets
  function field(label, control) {
    return '<label class="field"><span>' + label + '</span>' + control + '</label>';
  }

  function imageField(name, label, value) {
    return '<div class="field"><span style="font-size:.82rem;font-weight:620;color:#33445c">' + esc(label) + '</span>' +
      '<div class="row-between" style="gap:8px;margin-top:5px">' +
        '<input type="text" name="' + name + '" placeholder="Paste a URL or upload" value="' + esc(value) + '" style="flex:1">' +
        '<button type="button" class="btn sm" data-upload="' + name + '">Upload</button>' +
        (value ? '<img class="thumb" src="' + esc(value) + '" alt="">' : '') +
      '</div></div>';
  }

  function upload(file) {
    var fd = new FormData();
    fd.append('image', file);
    return fetch('/api/upload', { method: 'POST', body: fd }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) throw new Error(d.error || 'Upload failed');
        return d;
      });
    });
  }

  /** Wires every [data-upload] button rendered in the current view/modal. */
  function wireUpload() {
    document.querySelectorAll('[data-upload]').forEach(function (btn) {
      if (btn._wired) return;
      btn._wired = true;
      btn.addEventListener('click', function () {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', function () {
          if (!input.files[0]) return;
          toast('Uploading…');
          upload(input.files[0]).then(function (res) {
            var target = btn.parentNode.querySelector('input[type=text]');
            target.value = res.url;
            var img = btn.parentNode.querySelector('img.thumb');
            if (img) img.src = res.url;
            toast('Uploaded — remember to save');
          }).catch(function (e) { toast(e.message, true); });
        });
        input.click();
      });
    });
  }

  function wireCancel() {
    var btn = modalBody.querySelector('[data-cancel]');
    if (btn) btn.addEventListener('click', closeModal);
  }

  /** Up / down / delete buttons for any collection list. */
  function wireListActions(c, rerender, confirmText) {
    view.querySelectorAll('[data-up]').forEach(function (b) {
      b.addEventListener('click', function () { c.move(b.dataset.up, -1).then(rerender); });
    });
    view.querySelectorAll('[data-down]').forEach(function (b) {
      b.addEventListener('click', function () { c.move(b.dataset.down, 1).then(rerender); });
    });
    view.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm(confirmText)) return;
        c.remove(b.dataset.del).then(function () { toast('Deleted'); rerender(); });
      });
    });
  }

  function lines(text) {
    return String(text || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  // ------------------------------------------------------------- navigation
  var VIEWS = {
    dashboard: viewDashboard, bookings: viewBookings, services: viewServices, offers: viewOffers,
    gallery: viewGallery, reviews: viewReviews, content: viewContent, settings: viewSettings, account: viewAccount
  };

  function go(name) {
    tab = name;
    pageTitle.textContent = TITLES[name];
    document.querySelectorAll('.side-nav button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.tab === name);
    });
    location.hash = name;
    VIEWS[name]();
  }

  document.querySelectorAll('.side-nav button').forEach(function (b) {
    b.addEventListener('click', function () { go(b.dataset.tab); });
  });

  load()
    .then(function () { go(VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard'); })
    .catch(function (e) { view.innerHTML = '<div class="alert err">' + esc(e.message) + '</div>'; });
})();
