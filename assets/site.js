// Page behaviour: real countdowns, stat count-up, the registration popup and form (stub in review mode, Worker in live mode),
// join button states, checklists, replay state, Cal.com embed. No network request in review mode.
(function () {
  var F = window.FUNNEL || {};
  var params = new URLSearchParams(location.search);
  var state = params.get('state');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WEEK = 7 * 864e5;

  // Recording page: ?state=expired shows the closed replay card.
  if (state === 'expired') document.body.classList.add('is-expired');

  // Thank-you page: greet by first name if the form just ran in this tab.
  var nameSlot = document.querySelector('[data-first-name]');
  if (nameSlot) {
    try {
      var fn = sessionStorage.getItem('tantra_first_name');
      if (fn) { nameSlot.textContent = 'Thanks, ' + fn + '. Your seat is saved.'; nameSlot.hidden = false; }
    } catch (e) {}
  }

  // ---------- Countdowns: only to a real configured date. Weekly cadence rolls a past date to the next session. ----------
  function targetOf(el) {
    var t = Date.parse(el.getAttribute('data-target'));
    if (isNaN(t)) return null;
    if (el.getAttribute('data-weekly') === '1') { while (t < Date.now()) t += WEEK; }
    return t;
  }
  var pad = function (x) { return (x < 10 ? '0' : '') + x; };
  var cds = Array.prototype.slice.call(document.querySelectorAll('.cd[data-target]'));
  var texts = Array.prototype.slice.call(document.querySelectorAll('[data-ttimer][data-target]'));
  function tick() {
    var now = Date.now();
    cds.forEach(function (el) {
      var t = targetOf(el); if (t == null) return;
      var s = Math.max(0, Math.floor((t - now) / 1000));
      var v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
      ['d', 'h', 'm', 's'].forEach(function (u) { var b = el.querySelector('[data-u="' + u + '"]'); if (b) b.textContent = pad(v[u]); });
    });
    texts.forEach(function (el) {
      var t = targetOf(el); if (t == null) return;
      var s = Math.max(0, Math.floor((t - now) / 1000));
      var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
      el.textContent = s === 0 ? 'now' : d > 0 ? d + (d === 1 ? ' day' : ' days') + ' and ' + h + (h === 1 ? ' hour' : ' hours') : h + (h === 1 ? ' hour' : ' hours') + ' and ' + m + (m === 1 ? ' minute' : ' minutes');
    });
  }
  if (cds.length || texts.length) { tick(); setInterval(tick, 1000); }

  // ---------- Stat counters count up once when they come into view ----------
  var counters = document.querySelectorAll('.stats [data-count]');
  function countUp(el) {
    var end = Number(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '', t0 = null;
    if (reduce) { el.textContent = end + suf; return; }
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    counters.forEach(function (c) { c.textContent = '0' + (c.getAttribute('data-suffix') || ''); });
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); co.unobserve(e.target); } }); }, { threshold: 0.4 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // ---------- Join button (thank-you). Review: "link is in your email". The fallback room shows only when configured. ----------
  var join = document.querySelector('[data-join]');
  if (join) {
    var jb = join.querySelector('[data-join-btn]'), jt = join.querySelector('[data-join-text]'), jn = join.querySelector('[data-join-note]');
    var room = join.getAttribute('data-room');
    if (state === 'preparing') { join.setAttribute('data-state', 'preparing'); jt.textContent = 'Preparing your link...'; jn.textContent = 'Looking up your personal join link.'; }
    else if (state === 'unavailable') { join.setAttribute('data-state', 'unavailable'); jt.textContent = 'Link unavailable'; jn.textContent = 'Use the personal link in your email from WebinarJam. Still stuck? Ask in the WhatsApp community.'; }
    else if (room) { jt.textContent = 'Enter the live session'; jn.textContent = 'Your personal link from the WebinarJam email works too.'; }
    if (!room || state) jb.setAttribute('href', '#email');
  }

  // Drop the right-edge fade once a sideways scroller reaches its end.
  document.querySelectorAll('.mx-wrap, .phones').forEach(function (el) {
    var f = function () { el.classList.toggle('at-end', el.scrollLeft + el.clientWidth >= el.scrollWidth - 4); };
    el.addEventListener('scroll', f, { passive: true }); f();
  });

  // ---------- Indoctrination checklists, saved on this device ----------
  document.querySelectorAll('[data-checklist] input[type=checkbox]').forEach(function (box) {
    var k = 'tantra_check_' + box.getAttribute('data-key');
    try { box.checked = localStorage.getItem(k) === '1'; } catch (e) {}
    box.addEventListener('change', function () { try { localStorage.setItem(k, box.checked ? '1' : '0'); } catch (e) {} });
  });

  // ---------- Cal.com inline embed: loads only when the round-robin link is filled in the config ----------
  var cal = document.querySelector('.cal[data-cal-link]');
  if (cal) {
    (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, 'https://app.cal.com/embed/embed.js', 'init');
    window.Cal('init', { origin: 'https://cal.com' });
    cal.id = cal.id || 'cal-inline';
    window.Cal('inline', { elementOrSelector: '#' + cal.id, calLink: cal.getAttribute('data-cal-link'), config: { layout: 'month_view' } });
    window.Cal('ui', { styles: { branding: { brandColor: '#6d4aff' } }, hideEventTypeDetails: false });
  }

  // ---------- Registration popup ----------
  var modal = document.getElementById('register');
  var form = document.getElementById('reg-form');
  if (!modal || !form) return;
  var $ = function (id) { return document.getElementById(id); };
  var lastFocus = null;
  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false; document.body.classList.add('modal-open');
    setTimeout(function () { $('f-first').focus(); }, 30);
  }
  function closeModal() {
    modal.hidden = true; document.body.classList.remove('modal-open');
    if (location.hash === '#register') history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll('[data-open-modal]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); openModal(); }); });
  modal.querySelector('[data-close-modal]').addEventListener('click', function (e) { e.preventDefault(); closeModal(); });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
  if (location.hash === '#register') openModal();

  var serverErr = $('reg-server-error');
  // Visitor's IANA time zone, captured silently: nurture times WhatsApp inside 8am to 8pm local.
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; $('f-tz').value = tz; } catch (e) {}
  // Preselect the WhatsApp country code from the time zone.
  var tzDial = { 'Asia/Kolkata': '+91', 'Asia/Calcutta': '+91', 'Europe/London': '+44', 'Australia/': '+61', 'Asia/Dubai': '+971', 'Asia/Singapore': '+65', 'Europe/Berlin': '+49', 'Europe/Paris': '+33', 'Europe/Amsterdam': '+31', 'Europe/Dublin': '+353', 'Europe/Zurich': '+41', 'Europe/Stockholm': '+46', 'Europe/Madrid': '+34', 'Europe/Rome': '+39', 'Asia/Jerusalem': '+972', 'Africa/Johannesburg': '+27', 'Africa/Lagos': '+234', 'Africa/Nairobi': '+254', 'Asia/Riyadh': '+966', 'Asia/Qatar': '+974', 'Asia/Kuala_Lumpur': '+60', 'Asia/Manila': '+63', 'Asia/Jakarta': '+62', 'Pacific/Auckland': '+64', 'America/Sao_Paulo': '+55', 'America/Mexico_City': '+52', 'Asia/Tokyo': '+81', 'Asia/Hong_Kong': '+852', 'America/': '+1' };
  Object.keys(tzDial).some(function (k) { if (tz.indexOf(k) === 0) { $('f-cc').value = tzDial[k]; return true; } return false; });
  var btn = form.querySelector('button[type=submit]');

  function composePhone() {
    var local = $('f-local').value.trim();
    $('f-phone').value = local ? $('f-cc').value + ' ' + local.replace(/^0+/, '') : '';
  }

  function show(id, inputs, bad) {
    var el = $(id);
    el.hidden = !bad;
    inputs.forEach(function (i) {
      if (bad) { i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', id); }
      else { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); }
    });
    return bad;
  }

  function validate() {
    composePhone();
    var bad = [];
    var first = $('f-first'), email = $('f-email'), company = $('f-company'), local = $('f-local'), optin = $('f-optin'), band = $('f-band');
    var radios = Array.prototype.slice.call(form.querySelectorAll('input[name=invest_12m]'));
    if (show('e-first', [first], !first.value.trim())) bad.push(first);
    if (show('e-email', [email], !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()))) bad.push(email);
    if (show('e-company', [company], !company.value.trim())) bad.push(company);
    var phone = $('f-phone').value, digits = phone.replace(/\D/g, '');
    var phoneBad = (optin.checked || $('f-call').checked || local.value.trim()) && !(/^[\d\s().-]+$/.test(local.value.trim()) && digits.length >= 8 && digits.length <= 15);
    if (show('e-phone', [local], !!phoneBad)) bad.push(local);
    if (show('e-band', [band], !band.value)) bad.push(band);
    if (show('e-invest', radios, !radios.some(function (r) { return r.checked; }))) bad.push(radios[0]);
    return bad;
  }

  function payload() {
    var fd = new FormData(form);
    var data = {
      first_name: fd.get('first_name').trim(),
      company: fd.get('company').trim(),
      phone: fd.get('phone').trim(),
      whatsapp_opt_in: fd.get('whatsapp_opt_in') === 'on',
      call_opt_in: fd.get('call_opt_in') === 'on',
      newsletter_opt_in: fd.get('newsletter_opt_in') === 'on',
      revenue_band: fd.get('revenue_band'),
      invest_12m: fd.get('invest_12m'),
      timezone: fd.get('timezone') || null,
    };
    var last = (fd.get('last_name') || '').trim();
    if (last) data.last_name = last;
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { if (params.get(k)) data[k] = params.get(k); });
    return {
      event: 'webinar.registered',
      email: fd.get('email').trim().toLowerCase(),
      ts: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      source: 'registration_page',
      webinar_date: F.webinar_date || null,
      data: data,
    };
  }

  // Review states: ?state=invalid opens the popup with the inline errors; ?state=error fills sample details and shows the server error.
  if (state === 'invalid') { openModal(); validate(); }
  if (state === 'error') {
    openModal();
    $('f-first').value = 'Sam'; $('f-last').value = 'Lee'; $('f-email').value = 'sam@example.com'; $('f-company').value = 'Example Ltd';
    $('f-band').value = '$25K to $100K a month'; form.querySelector('input[name=invest_12m][value=yes]').checked = true;
    serverErr.hidden = false;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    serverErr.hidden = true;
    var bad = validate();
    if (bad.length) { bad[0].focus(); return; }
    var body = payload();
    btn.disabled = true; btn.textContent = 'Saving your seat...';
    // LIVE: POST to integrations.register_worker_url (the register Worker, item 17), which checks Turnstile, registers the
    // person in WebinarJam for a personal join_url, then posts webinar.registered to the CRM. Never to the CRM directly.
    if (F.live && F.register_worker_url) {
      var fail = function () { if (window.turnstile) window.turnstile.reset(); btn.disabled = false; btn.textContent = 'Save my seat'; serverErr.hidden = false; };
      var tokenEl = form.querySelector('[name="cf-turnstile-response"]');
      var token = tokenEl ? tokenEl.value : '';
      if (!token) { fail(); return; }
      body.turnstile_token = token;
      body.data.timezone = body.data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      fetch(F.register_worker_url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok) throw new Error(j.error || 'failed');
          try { sessionStorage.setItem('tantra_first_name', body.data.first_name); } catch (e) {}
          location.href = j.redirect || F.thank_you_path;
        })
        .catch(fail);
      return;
    }
    // REVIEW: stub, no network. Logs the body the live form would send.
    setTimeout(function () {
      if (state === 'error') {
        btn.disabled = false; btn.textContent = 'Save my seat';
        serverErr.hidden = false; serverErr.setAttribute('tabindex', '-1'); serverErr.focus();
        return;
      }
      console.log('[stub] would POST to integrations.register_worker_url (' + (F.register_worker_url || 'FILL_REGISTER_WORKER_URL') + '):', JSON.stringify(body, null, 2));
      try { sessionStorage.setItem('tantra_first_name', body.data.first_name); } catch (e) {}
      location.href = F.thank_you_path || 'thank-you/';
    }, 700);
  });
})();
