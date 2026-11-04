// Review build behaviour: form validation and a stub submit (no network), checklists, replay state, Cal.com embed.
(function () {
  var F = window.FUNNEL || {};
  var params = new URLSearchParams(location.search);
  var state = params.get('state');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Recording page: ?state=expired shows the closed replay window.
  if (state === 'expired') document.body.classList.add('is-expired');

  // Thank-you page: greet by first name if the form just ran in this tab.
  var nameSlot = document.querySelector('[data-first-name]');
  if (nameSlot) {
    try {
      var fn = sessionStorage.getItem('tantra_first_name');
      if (fn) { nameSlot.textContent = 'Thanks, ' + fn + '.'; nameSlot.hidden = false; }
    } catch (e) {}
  }

  // Funnel ledger bars grow once when they come into view.
  var ledgers = document.querySelectorAll('.ledger, .pairs');
  if (!reduce && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('anim');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    ledgers.forEach(function (l) { io.observe(l); });
  }

  // Indoctrination checklists, saved on this device.
  document.querySelectorAll('[data-checklist] input[type=checkbox]').forEach(function (box) {
    var k = 'tantra_check_' + box.getAttribute('data-key');
    try { box.checked = localStorage.getItem(k) === '1'; } catch (e) {}
    box.addEventListener('change', function () { try { localStorage.setItem(k, box.checked ? '1' : '0'); } catch (e) {} });
  });

  // Cal.com inline embed: loads only when the round-robin link is filled in the config.
  var cal = document.querySelector('.cal[data-cal-link]');
  if (cal) {
    (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, 'https://app.cal.com/embed/embed.js', 'init');
    window.Cal('init', { origin: 'https://cal.com' });
    cal.id = cal.id || 'cal-inline';
    window.Cal('inline', { elementOrSelector: '#' + cal.id, calLink: cal.getAttribute('data-cal-link'), config: { layout: 'month_view' } });
    window.Cal('ui', { styles: { branding: { brandColor: '#6d4aff' } }, hideEventTypeDetails: false });
  }

  // Registration form.
  var form = document.getElementById('register');
  if (!form) return;
  var sticky = document.querySelector('.sticky-cta');
  if (sticky && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { sticky.hidden = es[0].isIntersecting; }, { threshold: 0.05 }).observe(form);
  }
  var $ = function (id) { return document.getElementById(id); };
  var serverErr = $('reg-server-error');
  var btn = form.querySelector('button[type=submit]');

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
    var bad = [];
    var first = $('f-first'), email = $('f-email'), company = $('f-company'), phone = $('f-phone'), optin = $('f-optin'), band = $('f-band');
    var radios = Array.prototype.slice.call(form.querySelectorAll('input[name=invest_12m]'));
    if (show('e-first', [first], !first.value.trim())) bad.push(first);
    if (show('e-email', [email], !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()))) bad.push(email);
    if (show('e-company', [company], !company.value.trim())) bad.push(company);
    var digits = phone.value.replace(/\D/g, '');
    var phoneBad = (optin.checked || phone.value.trim()) && !(/^\+?[\d\s().-]+$/.test(phone.value.trim()) && digits.length >= 8 && digits.length <= 15 && phone.value.trim().charAt(0) === '+');
    if (show('e-phone', [phone], !!phoneBad)) bad.push(phone);
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
      revenue_band: fd.get('revenue_band'),
      invest_12m: fd.get('invest_12m'),
    };
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

  // Review states: ?state=invalid shows the inline errors; ?state=error fills sample details and shows the server error.
  if (state === 'invalid') validate();
  if (state === 'error') {
    $('f-first').value = 'Sam'; $('f-email').value = 'sam@example.com'; $('f-company').value = 'Example Ltd';
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
    // Stub: no network. Live, this POSTs body as JSON to integrations.crm_webhook_url (CRM_CONTRACT.md).
    setTimeout(function () {
      if (state === 'error') {
        btn.disabled = false; btn.textContent = 'Save my seat';
        serverErr.hidden = false; serverErr.focus && serverErr.setAttribute('tabindex', '-1'); serverErr.focus();
        return;
      }
      console.log('[stub] would POST to ' + (F.form_endpoint || 'crm_webhook_url') + ':', JSON.stringify(body, null, 2));
      try { sessionStorage.setItem('tantra_first_name', body.data.first_name); } catch (e) {}
      location.href = F.thank_you_path || 'thank-you/';
    }, 700);
  });
})();
