// The Revenue Plan page: renders TantraPlan.plan() for the funnel picked, with every KPI editable.
// State: answers (from #p=... or this browser), the funnel, edits (typed-over KPIs), goal, price, path and mode.
// Edits are saved in this browser and carried in the plan link (#p=...&e=...). Never name or email in the link.
(function () {
  var T = window.TantraPlan; if (!T) return;
  var $ = function (s) { return document.querySelector(s); };
  var KEY = 'tantra_plan_state_v1';
  var SAMPLE = { offer_type: 'consulting', market: 'b2b', price: 9999, price_model: 'one_time', motion: 'call', cycle: 'weeks', revenue_now: 2, goal: 500000, revenue_built: 3, team_led: 1, years: 3, clients: 2, case_studies: 2, brands: 1, funnel_exp: 1, revops: 1, email_list: 2000, followers: 3000, channels: ['cold_email', 'linkedin', 'ads'], ad_budget: 2000, hours: 1, team_help: 1, funnel: 'webinar' };

  function unb64(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); }
  function b64(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function readHash() { var h = new URLSearchParams(location.hash.slice(1)), o = {}; try { if (h.get('p')) o.a = unb64(h.get('p')); if (h.get('e')) o.e = unb64(h.get('e')); } catch (e) {} return o; }

  var fromHash = readHash(), saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  var stored = null; try { stored = JSON.parse(localStorage.getItem('tantra_plan_answers') || 'null'); } catch (e) {}
  var answers = fromHash.a || stored || null;
  var sample = !answers;
  if (sample) answers = SAMPLE;
  var A = T.normalise(answers);
  var sig = b64(A).slice(0, 40);
  var S = (fromHash.e) || (saved && saved.sig === sig ? saved.s : null) || {};
  S.funnel = S.funnel || A.funnel || T.recommend(A)[0].id;
  S.over = S.over || {};
  S.mode = S.mode || 'goal';

  var fmtN = function (x) { x = +x || 0; return Math.abs(x) >= 100 ? Math.round(x).toLocaleString('en-US') : Math.abs(x) >= 10 ? (Math.round(x * 10) / 10).toLocaleString('en-US') : (Math.round(x * 100) / 100).toLocaleString('en-US'); };
  var fmtU = function (x) { return '$' + Math.round(+x || 0).toLocaleString('en-US'); };
  var fmtP = function (x) { return (x >= 1 ? (Math.round(x * 10) / 10) : (Math.round(x * 100) / 100)) + '%'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var numIn = function (el) { return Number(String(el.value).replace(/[^\d.]/g, '')) || 0; };

  function answersNow() { var a = Object.assign({}, A); if (S.price) a.price = S.price; if (S.model) a.price_model = S.model; return a; }
  function opts() { return { over: S.over[S.funnel] || {}, goal: S.goal || 0, call: S.path ? S.path === 'call' : null, visits: S.mode === 'traffic' ? S.visits || 0 : 0 }; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ sig: sig, s: S })); } catch (e) {}
    if (!sample) history.replaceState(null, '', '#p=' + b64(A) + (Object.keys(S).length ? '&e=' + b64(S) : ''));
  }

  /* ---------- Header chips ---------- */
  function chips() {
    var O = T.OPTIONS, lab = function (k, v) { var o = O[k].find(function (x) { return x[0] === v; }); return o ? o[1] : v; };
    var c = [lab('offer_type', A.offer_type), lab('market', A.market), fmtU(A.price) + (A.price_model === 'monthly' ? ' a month' : A.price_model === 'annual' ? ' a year' : ''), 'Revenue now: ' + O.revenue_now[A.revenue_now] + ' a month', 'Case studies: ' + O.case_studies[A.case_studies], A.channels.length ? 'Channels: ' + A.channels.map(function (x) { return T.CHANNELS[x].name; }).join(', ') : 'No outreach channels picked'];
    $('[data-cx-chips]').innerHTML = c.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    if (sample) { $('[data-cx-sample]').hidden = false; $('[data-cx-eyebrow]').textContent = 'Worked example'; $('[data-cx-lede]').textContent = 'A worked example. Every number below is editable: change a rate and the whole plan recalculates.'; }
  }

  /* ---------- Funnel tabs, ranked for this business ---------- */
  function tabs() {
    var rec = T.recommend(answersNow());
    $('[data-cx-tabs]').innerHTML = rec.map(function (r) {
      return '<button type="button" role="tab" class="cx-tab' + (r.recommended ? ' is-rec' : '') + '" aria-selected="' + (r.id === S.funnel) + '" data-f="' + r.id + '"><b>' + esc(r.name) + '</b><span>' + r.fit + '% fit' + (r.rank === 1 ? ' · best' : '') + '</span></button>';
    }).join('');
  }

  /* ---------- Stages ---------- */
  function rangeBar(k) {
    var lo = Math.min(k.lo, k.hi), hi = Math.max(k.lo, k.hi), span = hi - lo || 1;
    var pos = function (x) { return Math.max(0, Math.min(100, (x - lo) / span * 100)); };
    return '<span class="cx-range" aria-hidden="true"><i class="cx-range__band" style="left:' + pos(Math.min(k.ty, k.hi)) + '%;right:' + (100 - pos(Math.max(k.ty, k.hi))) + '%"></i><i class="cx-range__dot" style="left:' + pos(k.value) + '%"></i></span>' +
      '<span class="cx-range__l"><span>Low ' + fmtP(k.lo) + '</span><span>Typical ' + fmtP(k.ty) + '</span><span>Strong ' + fmtP(k.hi) + '</span></span>';
  }
  function trafficBlock(p) {
    var t = p.traffic, per = p.cadence.per, h = '';
    h += '<div class="cx-kpi cx-kpi--calc"><span class="cx-code">PV</span><div class="cx-kl"><b>' + (p.funnel === 'social' ? 'People who see an offer post' : 'Page visits') + '</b><span>' + esc(p.entry) + ' a month' + (p.cycles !== 12 ? ' (' + fmtN(p.visits) + ' per ' + per + ', ' + p.cycles + ' ' + per + 's a year)' : '') + '</span></div><span class="cx-val">' + fmtN(p.perMonth) + '</span></div>';
    if (t.owned.length) {
      h += '<h4>From the audience you own</h4>';
      t.owned.forEach(function (o) { h += '<div class="cx-kpi cx-kpi--calc"><span class="cx-code"></span><div class="cx-kl"><b>' + esc(o.name) + ': ' + fmtN(o.size) + '</b><span>' + esc(o.how) + '</span><small>' + esc(o.src) + '</small></div><span class="cx-val">' + fmtN(o.used) + '<em>visits</em></span></div>'; });
    }
    if (t.lines.length) {
      h += '<h4>' + (p.funnel === 'social' ? 'From your posts' : p.funnel === 'slo' ? 'From paid ads (an SLO runs on ads)' : 'From your outreach and ads') + '</h4>';
      t.lines.forEach(function (l) {
        var reach = p.funnel === 'social' && l.id === 'content' ? '' : (l.money ? fmtU(l.reach) : fmtN(l.reach));
        h += '<div class="cx-kpi cx-kpi--calc"><span class="cx-code"></span><div class="cx-kl"><b>' + esc(l.name) + (reach ? ': ' + reach + ' ' + esc(l.unit) : '') + '</b><span>' + esc(l.how) + '</span>' + (l.seats ? '<span class="cx-seat">That is about <b>' + fmtN(l.seats) + '</b> ' + esc(l.seatUnit) + '.</span>' : '') + '<small>' + esc(l.src) + (l.seatSrc ? '; ' + esc(l.seatSrc) : '') + '</small></div><span class="cx-val">' + fmtN(l.visits) + '<em>visits</em></span></div>';
      });
    }
    if (p.funnel === 'social' && t.followerReach < p.perMonth * 10) h += '<p class="cx-warn">Your following reaches about ' + fmtN(t.followerReach) + ' people a month. The plan needs ' + fmtN(p.perMonth * 10) + ': grow the following, post more, or add a second funnel.</p>';
    if (t.gap > 0) h += '<p class="cx-warn">' + fmtN(t.gap) + ' visits a month have no channel yet. Pick a channel in the survey or plan from your traffic instead.</p>';
    return h;
  }
  function stages(p) {
    var host = $('[data-cx-stages]'), html = '';
    for (var st = 1; st <= 6; st++) {
      var ks = p.kpis.filter(function (k) { return k.stage === st; });
      var rows = p.rows.filter(function (r) { return r.stage === st; });
      if (st !== 1 && !ks.length && !rows.length) continue;
      var main = st === 5 ? rows[rows.length - 1] : rows[0];
      var head = st === 1 ? fmtN(p.perMonth) + ' visits a month' : main ? fmtN(main.n) + ' ' + main.label.toLowerCase() + ' per ' + p.cadence.per : '';
      if (st === 6) head = '+' + fmtN(p.later) + ' customers in the following 52 weeks';
      html += '<details class="cx-st" ' + (st <= 4 ? 'open' : '') + '><summary><span class="cx-st__n">' + st + '</span><span class="cx-st__t">' + T.STAGES[st] + '</span><span class="cx-st__m">' + head + '</span></summary><div class="cx-st__b">';
      if (st === 1) html += trafficBlock(p);
      ks.forEach(function (k) {
        html += '<div class="cx-kpi' + (k.over ? ' is-over' : '') + '"><span class="cx-code">' + k.id + '</span><div class="cx-kl"><b>' + esc(k.name) + '</b><span>' + esc(k.def) + '</span>' + rangeBar(k) + '<small>' + esc(k.src) + '</small></div>' +
          '<span class="cx-field"><input type="number" step="0.1" min="0" max="100" inputmode="decimal" aria-label="' + esc(k.name) + ' in percent" data-k="' + k.id + '" value="' + (Math.round(k.value * 10) / 10) + '"><i>%</i></span>' +
          (k.over ? '<button type="button" class="cx-auto" data-auto="' + k.id + '" title="Back to the value from your answers (' + fmtP(k.planned) + ')">Auto</button>' : '') + '</div>';
      });
      if (rows.length) html += '<ol class="cx-rows">' + rows.map(function (r) { return '<li><span>' + esc(r.label) + '</span><b>' + fmtN(r.n) + '</b></li>'; }).join('') + '</ol>';
      if (st === 5) {
        html += '<ol class="cx-rows cx-rows--rev"><li><span>Revenue per customer inside these 12 months' + (p.churn ? ' (customers join through the year and ' + fmtP(p.churn * 100) + ' leave each month)' : '') + '</span><b>' + fmtU(p.value12) + '</b></li>' +
          (p.extraLabel ? '<li><span>Plus ' + esc(p.extraLabel) + ', a year</span><b>' + fmtU(p.extra12) + '</b></li>' : '') +
          '<li><span>Revenue per ' + p.cadence.per + '</span><b>' + fmtU(p.revCycle) + '</b></li><li><span>Revenue in 12 months</span><b>' + fmtU(p.rev12) + '</b></li></ol>';
      }
      if (st === 6) html += '<p class="cx-note">' + fmtN(p.listLeft) + ' people a year join your list and do not buy at first. A year of weekly email, WhatsApp and check-in calls turns some of them into customers: about ' + fmtN(p.later) + ' more in the following 52 weeks. A planning figure, never counted in your goal.</p>';
      html += '</div></details>';
    }
    host.innerHTML = html;
  }

  /* ---------- Right side: the consolidated plan ---------- */
  function summary(p) {
    var t = p.traffic, cust = p.customers * p.cycles;
    var h = '<p class="cx-k">Your plan at a glance: ' + esc(p.name) + (p.call ? ', call offer' : ', buy online') + '</p>' +
      '<div class="cx-big"><b>' + fmtU(p.rev12) + '</b><span>revenue in the next 12 months' + (S.mode === 'goal' ? ' (your goal)' : ' from this traffic') + '</span></div>' +
      '<dl class="cx-dl">' +
      '<div><dt>Traffic needed</dt><dd>' + fmtN(p.perMonth) + ' <small>' + (p.funnel === 'social' ? 'offer post viewers' : 'page visits') + ' a month</small></dd></div>' +
      '<div><dt>New customers</dt><dd>' + fmtN(cust) + ' <small>a year, ' + fmtN(cust / 12) + ' a month</small></dd></div>' +
      (p.call && callsHeld(p) > 0 ? '<div><dt>Calls to hold</dt><dd>' + fmtN(callsHeld(p) * p.cycles / 12) + ' <small>a month</small></dd></div>' : '') +
      (t.adSpend > 0 ? '<div><dt>Ad spend</dt><dd>' + fmtU(t.adSpend) + ' <small>a month' + (p.roas ? ', ' + p.roas.toFixed(2) + 'x front-end return' : '') + '</small></dd></div>' : '') +
      '</dl>';
    var reach = t.lines.filter(function (l) { return !l.money && l.reach > 0; });
    if (reach.length || t.owned.length) h += '<p class="cx-k cx-k--sub">Where the traffic comes from, a month</p><ul class="cx-list">' +
      t.owned.map(function (o) { return '<li><span>' + esc(o.name) + '</span><b>' + fmtN(o.used) + ' visits</b></li>'; }).join('') +
      t.lines.map(function (l) { return '<li><span>' + esc(l.name) + (l.money ? ' (' + fmtU(l.reach) + ')' : ' (' + fmtN(l.reach) + ' ' + esc(l.unit.replace(' a month', '')) + (l.seats ? ', ' + fmtN(l.seats) + ' ' + esc(l.seatUnit.split(' at ')[0]) : '') + ')') + '</span><b>' + fmtN(l.visits) + (p.funnel === 'social' ? ' viewers' : ' visits') + '</b></li>'; }).join('') + '</ul>';
    if (p.unreachable) h += '<p class="cx-warn">With these rates the funnel makes no customers, so no amount of traffic reaches the goal. Put back a KPI you set to 0 (click Auto).</p>';
    if (t.gap > 0) h += '<p class="cx-warn">' + fmtN(t.gap) + ' visits a month still need a channel. Raise the ad budget in your answers, add a channel, or plan from your traffic.</p>';
    if (t.budgetShort > 0) h += '<p class="cx-warn">The SLO needs ' + fmtU(t.adSpend) + ' a month of ads, ' + fmtU(t.budgetShort) + ' more than your budget.</p>';
    if (p.roas && p.roas < 1) h += '<p class="cx-warn">The front-end sales cover ' + Math.round(p.roas * 100) + '% of the ad spend. To self-liquidate, lift the offer conversion or the bump and backend take rates, or raise the entry price.</p>';
    h += '<p class="cx-k cx-k--sub">The funnel, per ' + p.cadence.per + '</p><ol class="cx-funnel">' +
      [{ label: p.funnel === 'social' ? 'Offer post viewers' : 'Page visits', n: p.visits }].concat(p.rows).map(function (r, i, all) {
        var w = all[0].n > 0 ? Math.max(3, Math.log10(r.n + 1) / Math.log10(all[0].n + 1) * 100) : 3;
        return '<li><span>' + esc(r.label) + '</span><b>' + fmtN(r.n) + '</b><i style="width:' + w.toFixed(1) + '%"></i></li>';
      }).join('') + '</ol>';
    $('[data-cx-summary]').innerHTML = h;
  }
  function callsHeld(p) { var r = p.rows.find(function (x) { return /held/i.test(x.label); }); return r ? r.n : 0; }

  function targets(p) {
    var h = '<p class="cx-k">The KPI to hit at each stage</p><table class="cx-tbl"><thead><tr><th>Stage and KPI</th><th>Plan</th><th>Target</th></tr></thead><tbody>';
    p.kpis.filter(function (k) { return k.stage < 6; }).forEach(function (k) {
      h += '<tr><td><span class="cx-tbl__s">' + k.stage + '</span>' + esc(k.name) + '</td><td>' + fmtP(k.value) + '</td><td>' + fmtP(k.ty) + ' to ' + fmtP(k.hi) + '</td></tr>';
    });
    h += '</tbody></table><p class="cx-foot">Plan: the rate your plan assumes. Target: typical to strong for this funnel. Hit the target band and the same traffic makes more than your goal.</p>';
    $('[data-cx-targets]').innerHTML = h;
  }

  // The three things that move this plan most: the KPIs sitting lowest inside their range, with the lever behind them.
  var LEVER_TIP = {
    landing: 'Add proof above the form: a named result, a logo strip and one specific testimonial. Proof lifts page conversion 5% to 35% (A/B tests in the benchmark report).',
    nurture: 'Remind on more than one channel: email, WhatsApp and a call the day before. Multi-channel reminders and a personal agenda raise show-up.',
    convert: 'Make one clear offer with a reason to act now, and show a case study right before it.',
    close: 'Qualify before the call (budget, authority, need, timeline) and follow up on day 3, 7 and 12 after the proposal.',
    retain: 'Keep every non-buyer on a weekly email and a monthly WhatsApp note for 52 weeks.'
  };
  function levers(p) {
    // Test every KPI at its strong value, keep the biggest win per lever, show the top three.
    var base = p, best = {};
    p.kpis.filter(function (k) { return k.stage < 6 && k.hi > k.value + 0.05; }).forEach(function (k) {
      var o = Object.assign({}, opts().over); o[k.id] = k.hi;
      var test = T.plan(S.funnel, answersNow(), Object.assign(opts(), { over: o }));
      var gain = S.mode === 'goal' ? (base.perMonth - test.perMonth) / Math.max(1, base.perMonth) * 100 : (test.rev12 - base.rev12) / Math.max(1, base.rev12) * 100;
      if (!best[k.lever] || gain > best[k.lever].gain) best[k.lever] = { k: k, gain: gain };
    });
    var pick = Object.keys(best).map(function (l) { return best[l]; }).sort(function (a, b) { return b.gain - a.gain; }).slice(0, 3);
    var h = '<p class="cx-k">What moves your numbers most</p><ol class="cx-levers">';
    pick.forEach(function (x) {
      h += '<li><b>' + esc(x.k.name) + ' from ' + fmtP(x.k.value) + ' to ' + fmtP(x.k.hi) + '</b><span>' + (S.mode === 'goal' ? 'Cuts the traffic you need by ' + Math.round(x.gain) + '%.' : 'Adds ' + Math.round(x.gain) + '% to your revenue.') + ' ' + LEVER_TIP[x.k.lever] + '</span></li>';
    });
    $('[data-cx-levers]').innerHTML = h + (pick.length ? '' : '<li>Every KPI is already at its strong value.</li>') + '</ol>';
  }

  function compare(p) {
    var rec = T.recommend(answersNow()).slice(0, 4), a = answersNow();
    var h = '<p class="cx-k">Your top funnels, side by side</p><table class="cx-tbl"><thead><tr><th>Funnel</th><th>Visits a month for your goal</th><th>Revenue from ' + fmtN(p.perMonth) + ' visits a month</th></tr></thead><tbody>';
    rec.forEach(function (r) {
      var g = T.plan(r.id, a, { goal: S.goal || 0 });
      var f = T.FUNNELS[r.id];
      var same = T.plan(r.id, a, { visits: p.perMonth * 12 / f.cadence.perYear });
      h += '<tr' + (r.id === S.funnel ? ' class="is-on"' : '') + '><td><button type="button" class="cx-link" data-f="' + r.id + '">' + esc(r.name) + '</button></td><td>' + fmtN(g.perMonth) + '</td><td>' + fmtU(same.rev12) + '</td></tr>';
    });
    $('[data-cx-compare]').innerHTML = h + '</tbody></table><p class="cx-foot">Same answers, each funnel with its own KPIs. Visits for the social funnel are people who see an offer post.</p>';
  }
  /* ---------- Render ---------- */
  function render() {
    var f = T.FUNNELS[S.funnel], p = T.plan(S.funnel, answersNow(), opts());
    $('[data-cx-blurb]').innerHTML = '<b>' + esc(f.name) + ':</b> ' + esc(f.blurb);
    $('[data-cx-pathwrap]').hidden = !!f.callOnly;
    $('[data-cx-path]').value = p.call ? 'call' : 'checkout';
    if (document.activeElement !== $('[data-cx-goal]')) $('[data-cx-goal]').value = Math.round(p.goal).toLocaleString('en-US');
    if (document.activeElement !== $('[data-cx-price]')) $('[data-cx-price]').value = Math.round(answersNow().price).toLocaleString('en-US');
    $('[data-cx-model]').value = answersNow().price_model;
    $('[data-cx-mode]').value = S.mode;
    $('[data-cx-visitswrap]').hidden = S.mode !== 'traffic';
    $('[data-cx-visitslabel]').textContent = (S.funnel === 'social' ? 'Offer post viewers' : 'Page visits') + ' per ' + p.cadence.per;
    if (S.mode === 'traffic' && document.activeElement !== $('[data-cx-visits]')) $('[data-cx-visits]').value = Math.round(p.visits).toLocaleString('en-US');
    tabs(); stages(p); summary(p); targets(p); levers(p); compare(p);
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-f]'); if (t) { S.funnel = t.getAttribute('data-f'); save(); render(); return; }
    var au = e.target.closest('[data-auto]'); if (au) { delete (S.over[S.funnel] || {})[au.getAttribute('data-auto')]; save(); render(); return; }
    if (e.target.closest('[data-cx-reset]')) { S = { funnel: S.funnel, over: {}, mode: 'goal' }; save(); render(); return; }
    if (e.target.closest('[data-cx-print]')) { document.querySelectorAll('details.cx-st').forEach(function (d) { d.open = true; }); window.print(); return; }
    var cp = e.target.closest('[data-cx-copy]');
    if (cp) {
      var url = location.origin + location.pathname + '#p=' + b64(A) + '&e=' + b64(S);
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { cp.textContent = 'Link copied'; }, function () { window.prompt('Copy your plan link', url); });
      setTimeout(function () { cp.textContent = 'Copy my plan link'; }, 1800);
    }
  });
  document.addEventListener('change', function (e) {
    var k = e.target.getAttribute('data-k');
    if (k) { var v = parseFloat(e.target.value); S.over[S.funnel] = S.over[S.funnel] || {}; if (isFinite(v) && v >= 0) S.over[S.funnel][k] = Math.min(100, v); else delete S.over[S.funnel][k]; save(); render(); return; }
    if (e.target.matches('[data-cx-goal]')) { S.goal = numIn(e.target); save(); render(); }
    if (e.target.matches('[data-cx-price]')) { S.price = numIn(e.target) || null; save(); render(); }
    if (e.target.matches('[data-cx-model]')) { S.model = e.target.value; save(); render(); }
    if (e.target.matches('[data-cx-path]')) { S.path = e.target.value; save(); render(); }
    if (e.target.matches('[data-cx-mode]')) { S.mode = e.target.value; if (S.mode === 'traffic') S.visits = T.plan(S.funnel, answersNow(), Object.assign(opts(), { visits: 0 })).visits; save(); render(); }
    if (e.target.matches('[data-cx-visits]')) { S.visits = numIn(e.target); save(); render(); }
  });
  document.querySelectorAll('[data-cx-goal],[data-cx-price],[data-cx-visits]').forEach(function (inp) {
    inp.addEventListener('input', function () { var d = inp.value.replace(/[^\d]/g, '').slice(0, 11); inp.value = d ? Number(d).toLocaleString('en-US') : ''; });
  });

  /* ---------- How-to guides ---------- */
  // Open on the first visit, then remember the visitor closed it. Any "How to" link opens its guide and scrolls to it.
  var guide = $('[data-cx-guide]');
  if (guide) {
    var seen = null; try { seen = localStorage.getItem('tantra_plan_guide_seen'); } catch (e) {}
    if (!seen) guide.open = true;
    guide.addEventListener('toggle', function () { if (!guide.open) { try { localStorage.setItem('tantra_plan_guide_seen', '1'); } catch (e) {} } });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-guide]'); if (!a) return;
      e.preventDefault();
      var g = document.getElementById('guide-' + a.getAttribute('data-guide'));
      guide.open = true;
      if (g) {
        g.open = true;
        g.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        g.classList.remove('is-flash'); void g.offsetWidth; g.classList.add('is-flash');
        var s = g.querySelector('summary'); if (s) s.focus({ preventScroll: true });
      }
    });
  }

  chips(); render();
})();
