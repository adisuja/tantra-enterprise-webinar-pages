// Thank-you page 1: the survey, Typeform-style (Adi 2026-11-08, round 2). One question per screen with a vertical
// slide between them; single choices move on by themselves; letter keys pick a choice, Enter continues, the arrows go
// back and forth. Two follow-ups appear only when needed. The last screen ranks the ten funnels live from the answers.
// Submit: saves the answers in this browser, builds the Revenue Plan link (answers only, never a name or email, in the
// URL fragment), sends the payload (live: the register Worker; review: console stub), then goes to the VIP page.
(function () {
  var form = document.getElementById('tf');
  if (!form || !window.TantraPlan) return;
  var T = window.TantraPlan, F = window.FUNNEL || {}, flow = F.flow || {}, ICON = window.TF_FUNNEL_ICONS || {};
  var params = new URLSearchParams(location.search);
  var slides = Array.prototype.slice.call(form.querySelectorAll('[data-slide]'));
  var bar = form.querySelector('[data-tf-bar]'), counter = form.querySelector('[data-tf-count]');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, busy = false;
  var NUMS = ['price', 'entry_price', 'goal', 'email_list', 'followers', 'youtube', 'community', 'ad_budget'];
  var INTS = ['revenue_now', 'revenue_built', 'years', 'clients', 'case_studies', 'brands', 'funnel_exp', 'revops', 'hours', 'team_help'];

  form.querySelectorAll('[data-num]').forEach(function (inp) {
    inp.addEventListener('input', function () { var d = inp.value.replace(/[^\d]/g, '').slice(0, 10); inp.value = d ? Number(d).toLocaleString('en-US') : ''; });
  });

  function answers() {
    var fd = new FormData(form), a = {};
    fd.forEach(function (v, k) { if (k === 'channels' || k === 'funnels_built') (a[k] = a[k] || []).push(v); else a[k] = v; });
    NUMS.forEach(function (k) { if (a[k] != null) a[k] = Number(String(a[k]).replace(/[^\d.]/g, '')) || 0; });
    INTS.forEach(function (k) { if (a[k] != null) a[k] = Number(a[k]); });
    a.channels = a.channels || []; a.funnels_built = a.funnels_built || [];
    if (a.channels.indexOf('ads') < 0) a.ad_budget = 0;
    if (!(a.funnel_exp > 0)) a.funnels_built = [];
    return a;
  }
  function shown(s) {
    var w = s.getAttribute('data-when'); if (!w) return true;
    var a = answers();
    if (w.indexOf('>') > -1) { var p = w.split('>'); return (a[p[0]] || 0) > Number(p[1]); }
    var q = w.split(':'); return (a[q[0]] || []).indexOf(q[1]) > -1;
  }
  function nextIndex(i, dir) { var j = i + dir; while (j >= 0 && j < slides.length && !shown(slides[j])) j += dir; return j; }
  function progress() {
    var vis = slides.filter(shown), at = vis.indexOf(slides[cur]);
    if (bar) bar.style.width = Math.round(Math.max(0, at) / Math.max(1, vis.length - 1) * 100) + '%';
    if (counter) counter.textContent = 'Question ' + slides[cur].querySelector('.tf-num').textContent.trim() + ' of 10';
    form.querySelector('[data-prev]').disabled = nextIndex(cur, -1) < 0;
    form.querySelector('[data-next]').disabled = nextIndex(cur, 1) >= slides.length;
  }

  function valid(s) {
    var type = s.getAttribute('data-type'), ok = true;
    if (type === 'choice' || type === 'pick') ok = !!s.querySelector('input:checked');
    if (type === 'money' && s.hasAttribute('data-req')) { var inp = s.querySelector('input'); ok = Number(inp.value.replace(/[^\d]/g, '')) > 0; }
    var err = s.querySelector('.tf-err'); if (err) err.hidden = ok;
    if (!ok) { s.classList.remove('is-shake'); void s.offsetWidth; s.classList.add('is-shake'); }
    return ok;
  }

  function go(to, dir, focus) {
    if (to < 0 || to >= slides.length || to === cur || busy) return;
    var from = slides[cur], next = slides[to];
    if (next.getAttribute('data-type') === 'pick') ranking();
    var done = function () {
      from.hidden = true; from.className = from.className.replace(/ ?tf-(out|in)-\w+/g, '');
      next.hidden = false; cur = to; progress();
      busy = false;
      if (!reduce) { next.classList.add(dir > 0 ? 'tf-in-up' : 'tf-in-down'); setTimeout(function () { next.className = next.className.replace(/ ?tf-in-\w+/g, ''); }, 380); }
      if (focus !== false) {
        var t = next.querySelector('input[type=text]') || next.querySelector('input:checked') || next.querySelector('input');
        if (t) t.focus({ preventScroll: true });
      }
    };
    busy = true;
    if (reduce) { done(); return; }
    from.classList.add(dir > 0 ? 'tf-out-up' : 'tf-out-down');
    setTimeout(done, 220);
  }
  function ok() { if (valid(slides[cur])) go(nextIndex(cur, 1), 1); }

  // A single choice moves on by itself after a short blink, as Typeform does.
  form.addEventListener('change', function (e) {
    var s = e.target.closest('[data-slide]'); if (!s) return;
    var err = s.querySelector('.tf-err'); if (err) err.hidden = true;
    if (e.target.type === 'radio') {
      var c = e.target.closest('.tf-c'); c.classList.remove('is-blink'); void c.offsetWidth; c.classList.add('is-blink');
      if (s.getAttribute('data-type') === 'choice') setTimeout(function () { if (slides[cur] === s) ok(); }, reduce ? 0 : 420);
    }
  });
  form.addEventListener('click', function (e) {
    if (e.target.closest('[data-ok]')) ok();
    if (e.target.closest('[data-prev]')) go(nextIndex(cur, -1), -1);
    if (e.target.closest('[data-next]')) ok();
  });
  // Keyboard: letters pick a choice, Enter continues. Works when the survey is on screen even before it has focus.
  document.addEventListener('keydown', function (e) {
    if (form.contains(e.target) || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    var r = form.getBoundingClientRect(); if (r.bottom < 120 || r.top > innerHeight - 120) return;
    onKey(e);
  });
  form.addEventListener('keydown', onKey);
  function onKey(e) {
    var s = slides[cur], inText = e.target.tagName === 'INPUT' && e.target.type === 'text';
    if (e.key === 'Enter') {
      if (s.getAttribute('data-type') === 'pick') return; // submits
      e.preventDefault(); ok(); return;
    }
    if (inText || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    var i = 'abcdefghij'.indexOf(e.key.toLowerCase()); if (i < 0) return;
    var inputs = s.querySelectorAll('.tf-c input'); if (!inputs[i]) return;
    e.preventDefault();
    if (inputs[i].type === 'checkbox') inputs[i].checked = !inputs[i].checked; else inputs[i].checked = true;
    inputs[i].focus({ preventScroll: true });
    inputs[i].dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Question 10: the ten funnels, ranked for this business, each with its icon and up to two reasons.
  function ranking() {
    var box = form.querySelector('[data-funnels]'); if (!box) return;
    var keep = (form.querySelector('input[name="funnel"]:checked') || {}).value;
    var list = T.recommend(answers()), K = 'ABCDEFGHIJ';
    box.innerHTML = list.map(function (r, i) {
      var on = keep ? keep === r.id : i === 0;
      return '<label class="tf-c tf-c--fn' + (r.recommended ? ' is-rec' : '') + '"><input type="radio" name="funnel" value="' + r.id + '"' + (on ? ' checked' : '') + '>' +
        '<span class="tf-key">' + K[i] + '</span><span class="tf-ico">' + (ICON[r.id] || '') + '</span>' +
        '<span class="tf-l"><span class="tf-fn__top"><b>' + r.name + '</b>' + (r.recommended ? '<em>' + (i === 0 ? 'Best fit' : 'Recommended') + '</em>' : '') + '<span class="tf-fn__fit">' + r.fit + '% fit</span></span>' +
        (r.why.length ? '<span class="tf-fn__why">' + r.why.slice(0, 2).join('. ') + '.</span>' : '<span class="tf-fn__why">' + r.tag + '.</span>') + '</span></label>';
    }).join('');
  }

  function b64url(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!valid(slides[cur])) return;
    var a = answers(), rec = T.recommend(a), plain = T.normalise(a);
    var reportUrl = new URL((flow.calculator_path || '../calculator/') + '#p=' + b64url(JSON.stringify(plain)), location.href).href;
    var score = T.leadScore(a);
    try { localStorage.setItem('tantra_plan_answers', JSON.stringify(plain)); localStorage.setItem('tantra_plan_url', reportUrl); } catch (err) {}
    var data = { answers: plain, recommended: rec.slice(0, 3).map(function (r) { return r.id; }), chosen_funnel: plain.funnel, fit_tier: score.tier, fit_score: score.score, report_url: reportUrl };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'rid'].forEach(function (k) { if (params.get(k)) data[k] = params.get(k); });
    var email = null; try { email = sessionStorage.getItem('tantra_email'); data.first_name = sessionStorage.getItem('tantra_first_name') || undefined; } catch (err) {}
    var body = { event: 'webinar.survey_completed', email: email, ts: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), source: 'thank_you_survey', data: data };
    slides[cur].hidden = true; form.querySelector('[data-done]').hidden = false; form.querySelector('.tf-foot').hidden = true;
    if (bar) bar.style.width = '100%';
    var next = function () { location.href = flow.vip_path || '../funnelos/'; };
    if (F.live && F.register_worker_url) {
      fetch(F.register_worker_url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(function () {}).then(next);
      setTimeout(next, 2500); return;
    }
    console.log('[stub] would POST to integrations.register_worker_url (' + (F.register_worker_url || 'FILL_REGISTER_WORKER_URL') + '):', JSON.stringify(body, null, 2));
    setTimeout(next, 1100);
  });

  // Review states: ?state=q10 opens the last question with sample answers; ?state=sample fills every answer.
  var st = params.get('state');
  if (st === 'q10' || st === 'sample') {
    var sample = { offer_type: 'consulting', market: 'b2b', price: '9,999', price_model: 'one_time', motion: 'call', revenue_now: '2', goal: '500,000', revenue_built: '3', years: '3', clients: '2', case_studies: '2', brands: '1', funnel_exp: '1', revops: '1', email_list: '2,000', followers: '3,000', hours: '1', team_help: '1', ad_budget: '2,000' };
    Object.keys(sample).forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"][value="' + sample[k] + '"]') || form.querySelector('input[name="' + k + '"][type=text]');
      if (!el) return; if (el.type === 'radio') el.checked = true; else el.value = sample[k];
    });
    ['calendar', 'linkedin', 'ads'].forEach(function (c) { var el = form.querySelector('[name="channels"][value="' + c + '"]'); if (el) el.checked = true; });
    var fb = form.querySelector('[name="funnels_built"][value="webinar"]'); if (fb) fb.checked = true;
    if (st === 'q10') { slides[0].hidden = true; cur = slides.length - 1; ranking(); slides[cur].hidden = false; setTimeout(function () { form.scrollIntoView(); }, 60); }
  }
  progress();
})();
