// Thank-you page 1: the ten-question survey. One question per screen (as the reference's Tally form), Next and Back,
// inline errors, conditional fields, and question 10 ranks the funnels live from the answers (TantraPlan.recommend).
// Submit: saves the answers in this browser, builds the Revenue Plan link (answers only, never name or email, in the
// URL fragment so no server ever sees it), sends the payload (live: the register Worker; review: console stub), then
// goes to the VIP page. The plan link is shown only on /confirmed/.
(function () {
  var form = document.getElementById('sv');
  if (!form || !window.TantraPlan) return;
  var T = window.TantraPlan, F = window.FUNNEL || {}, flow = F.flow || {};
  var params = new URLSearchParams(location.search);
  var steps = Array.prototype.slice.call(form.querySelectorAll('.sv-step'));
  var bar = form.querySelector('[data-sv-bar]');
  var cur = 0;
  var NUMS = ['price', 'entry_price', 'goal', 'email_list', 'followers', 'youtube', 'community', 'site', 'ad_budget'];
  var INTS = ['revenue_now', 'revenue_built', 'team_led', 'years', 'clients', 'case_studies', 'brands', 'funnel_exp', 'revops', 'hours', 'team_help'];

  // Thousands separators while typing in number fields.
  form.querySelectorAll('[data-num]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var d = inp.value.replace(/[^\d]/g, '').slice(0, 10);
      inp.value = d ? Number(d).toLocaleString('en-US') : '';
    });
  });

  function answers() {
    var fd = new FormData(form), a = {};
    fd.forEach(function (v, k) {
      if (k === 'channels' || k === 'funnels_built') { (a[k] = a[k] || []).push(v); return; }
      a[k] = v;
    });
    NUMS.forEach(function (k) { if (a[k] != null) a[k] = a[k] === '' ? 0 : Number(String(a[k]).replace(/[^\d.]/g, '')); });
    INTS.forEach(function (k) { if (a[k] != null) a[k] = Number(a[k]); });
    a.channels = a.channels || []; a.funnels_built = a.funnels_built || [];
    // Answers behind a hidden follow-up do not count once the question that opened it changes.
    if (a.channels.indexOf('ads') < 0) a.ad_budget = 0;
    if (!(a.funnel_exp > 0)) a.funnels_built = [];
    return a;
  }

  // Conditional blocks: data-show-if="name:val1,val2"
  function reveal() {
    var a = answers();
    form.querySelectorAll('[data-show-if]').forEach(function (el) {
      var p = el.getAttribute('data-show-if').split(':'), k = p[0], vals = p[1].split(',');
      var v = a[k], on = Array.isArray(v) ? v.some(function (x) { return vals.indexOf(x) > -1; }) : vals.indexOf(String(v)) > -1;
      el.hidden = !on;
    });
  }
  form.addEventListener('change', reveal);

  // Question 10: rank the funnels for this business.
  function ranking() {
    var box = form.querySelector('[data-funnels]'); if (!box) return;
    var keep = (form.querySelector('input[name="funnel"]:checked') || {}).value;
    var list = T.recommend(answers());
    var card = function (r, i) {
      var checked = keep ? keep === r.id : i === 0;
      return '<label class="sv-fn' + (r.recommended ? ' is-rec' : '') + '"><input type="radio" name="funnel" value="' + r.id + '"' + (checked ? ' checked' : '') + ' required>' +
        '<span class="sv-fn__top"><b>' + r.name + '</b>' + (r.recommended ? '<em>' + (i === 0 ? 'Best fit' : 'Recommended') + '</em>' : '') + '<span class="sv-fn__fit">' + r.fit + '% fit</span></span>' +
        '<span class="sv-fn__tag">' + r.tag + '</span>' +
        (r.why.length ? '<span class="sv-fn__why">' + r.why.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</span>' : '') +
        (r.warn.length ? '<span class="sv-fn__warn">' + r.warn[0] + '</span>' : '') + '</label>';
    };
    var top = list.slice(0, 4), rest = list.slice(4);
    var open = keep && rest.some(function (r) { return r.id === keep; });
    box.innerHTML = top.map(card).join('') + '<details class="sv-more"' + (open ? ' open' : '') + '><summary>See the other ' + rest.length + ' funnels</summary><div class="sv-funnels">' + rest.map(function (r, j) { return card(r, j + 4); }).join('') + '</div></details>';
  }

  function valid(step) {
    var ok = true;
    var groups = {};
    step.querySelectorAll('input[required]').forEach(function (inp) {
      if (inp.closest('[hidden]')) return;
      if (inp.type === 'radio') { groups[inp.name] = groups[inp.name] || !!step.querySelector('input[name="' + inp.name + '"]:checked'); }
      else if (!inp.value.trim() || (inp.hasAttribute('data-num') && !(Number(inp.value.replace(/[^\d]/g, '')) > 0))) { ok = false; inp.setAttribute('aria-invalid', 'true'); }
      else inp.removeAttribute('aria-invalid');
    });
    Object.keys(groups).forEach(function (k) { if (!groups[k]) ok = false; });
    var err = step.querySelector('.sv-err'); if (err) err.hidden = ok;
    return ok;
  }

  function show(i, focus) {
    steps.forEach(function (s, j) { s.hidden = j !== i; });
    cur = i;
    if (bar) bar.style.width = Math.round(i / steps.length * 100) + '%';
    if (i === steps.length - 1) ranking();
    reveal();
    if (focus) {
      var lg = steps[i].querySelector('legend'); if (lg) { lg.setAttribute('tabindex', '-1'); lg.focus({ preventScroll: true }); }
      var top = form.getBoundingClientRect().top + window.scrollY - 24;
      if (Math.abs(window.scrollY - top) > 120) window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  form.addEventListener('click', function (e) {
    var n = e.target.closest('[data-next]'), b = e.target.closest('[data-back]');
    if (n) { if (valid(steps[cur])) show(cur + 1, true); }
    if (b) show(cur - 1, true);
  });
  // Enter in a text field moves on instead of submitting early.
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'radio' && e.target.type !== 'checkbox' && cur < steps.length - 1) {
      e.preventDefault(); if (valid(steps[cur])) show(cur + 1, true);
    }
  });

  function b64url(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!valid(steps[cur])) return;
    var a = answers();
    var rec = T.recommend(a);
    var plain = T.normalise(a); delete plain.name;
    var token = b64url(JSON.stringify(plain));
    var reportUrl = new URL((flow.calculator_path || '../calculator/') + '#p=' + token, location.href).href;
    var score = T.leadScore(a);
    try {
      localStorage.setItem('tantra_plan_answers', JSON.stringify(plain));
      localStorage.setItem('tantra_plan_url', reportUrl);
    } catch (err) {}
    var data = { answers: plain, recommended: rec.slice(0, 3).map(function (r) { return r.id; }), chosen_funnel: plain.funnel, fit_tier: score.tier, fit_score: score.score, report_url: reportUrl };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'rid'].forEach(function (k) { if (params.get(k)) data[k] = params.get(k); });
    var email = null; try { email = sessionStorage.getItem('tantra_email'); data.first_name = sessionStorage.getItem('tantra_first_name') || undefined; } catch (err) {}
    var body = { event: 'webinar.survey_completed', email: email, ts: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), source: 'thank_you_survey', data: data };
    steps.forEach(function (s) { s.hidden = true; });
    form.querySelector('[data-sv-done]').hidden = false;
    if (bar) bar.style.width = '100%';
    var next = function () { location.href = flow.vip_path || '../vip/'; };
    if (F.live && F.register_worker_url) {
      fetch(F.register_worker_url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(function () {}).then(next);
      setTimeout(next, 2500);
      return;
    }
    console.log('[stub] would POST to integrations.register_worker_url (' + (F.register_worker_url || 'FILL_REGISTER_WORKER_URL') + '):', JSON.stringify(body, null, 2));
    setTimeout(next, 900);
  });

  // Review states: ?state=q10 opens question 10 with sample answers, ?state=sample fills every answer.
  var st = params.get('state');
  if (st === 'q10' || st === 'sample') {
    var sample = { offer_type: 'consulting', market: 'b2b', price: '9,999', price_model: 'one_time', motion: 'call', cycle: 'weeks', revenue_now: '2', goal: '500,000', revenue_built: '3', team_led: '1', years: '3', clients: '2', case_studies: '2', brands: '1', funnel_exp: '1', revops: '1', email_list: '2,000', followers: '3,000', hours: '1', team_help: '1', ad_budget: '2,000' };
    Object.keys(sample).forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"][value="' + sample[k] + '"]') || form.querySelector('input[name="' + k + '"]:not([type=radio])');
      if (!el) return; if (el.type === 'radio') el.checked = true; else el.value = sample[k];
    });
    ['cold_email', 'linkedin', 'ads'].forEach(function (c) { var el = form.querySelector('[name="channels"][value="' + c + '"]'); if (el) el.checked = true; });
    var fb = form.querySelector('[name="funnels_built"][value="webinar"]'); if (fb) fb.checked = true;
    show(st === 'q10' ? steps.length - 1 : 0, false);
    if (st === 'q10') setTimeout(function () { form.scrollIntoView(); }, 60);
  } else show(0, false);
})();
