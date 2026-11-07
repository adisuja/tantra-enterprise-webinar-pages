// The Revenue Plan page (round 2): funnel tabs, a calculator of editable KPIs grouped by stage, and the plan on the
// right (the goal, then what each stage needs a month). Typing updates the plan live; the left side redraws only when
// the funnel or the offer changes, so focus never jumps. State is saved in this browser and carried in the plan link
// (#p=answers&e=edits). Never a name or email in the link.
(function () {
  var T = window.TantraPlan; if (!T) return;
  var $ = function (s) { return document.querySelector(s); };
  var KEY = 'tantra_plan_state_v2';
  var SAMPLE = { offer_type: 'consulting', market: 'b2b', price: 9999, price_model: 'one_time', motion: 'call', revenue_now: 2, goal: 500000, revenue_built: 3, years: 3, clients: 2, case_studies: 2, brands: 1, funnel_exp: 1, revops: 1, email_list: 2000, followers: 3000, channels: ['calendar', 'linkedin', 'ads'], ad_budget: 2000, hours: 1, team_help: 1, funnel: 'webinar' };

  function unb64(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); }
  function b64(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  var hash = new URLSearchParams(location.hash.slice(1)), fromHash = {};
  try { if (hash.get('p')) fromHash.a = unb64(hash.get('p')); if (hash.get('e')) fromHash.e = unb64(hash.get('e')); } catch (e) {}
  var stored = null, saved = null;
  try { stored = JSON.parse(localStorage.getItem('tantra_plan_answers') || 'null'); saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  var answers = fromHash.a || stored, sample = !answers;
  var A = T.normalise(answers || SAMPLE);
  var sig = b64(A).slice(0, 48);
  var S = fromHash.e || (saved && saved.sig === sig ? saved.s : null) || {};
  S.funnel = S.funnel && T.FUNNELS[S.funnel] ? S.funnel : (A.funnel || T.recommend(A)[0].id);
  S.over = S.over || {}; S.mix = S.mix || {};

  var fmtN = function (x) { x = +x || 0; var a = Math.abs(x); if (a >= 1e6) return (Math.round(x / 1e5) / 10).toLocaleString('en-US') + 'M'; return a >= 100 ? Math.round(x).toLocaleString('en-US') : a >= 10 ? (Math.round(x * 10) / 10).toLocaleString('en-US') : (Math.round(x * 100) / 100).toLocaleString('en-US'); };
  var fmtU = function (x) { return '$' + Math.round(+x || 0).toLocaleString('en-US'); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var digits = function (v) { return Number(String(v).replace(/[^\d.]/g, '')) || 0; };
  var round = function (x) { return x >= 1 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100; };

  function opts() { return { over: S.over[S.funnel] || {}, mix: S.mix[S.funnel] || null, goal: S.goal || 0, call: S.path ? S.path === 'call' : null, price: S.price || 0, price_model: S.model || null }; }
  function plan() { return T.plan(S.funnel, A, opts()); }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ sig: sig, s: S })); } catch (e) {}
    if (!sample) history.replaceState(null, '', '#p=' + b64(A) + '&e=' + b64(S));
  }

  /* ---------- Tabs ---------- */
  function tabs() {
    $('[data-cx-tabs]').innerHTML = T.recommend(A).map(function (r) {
      return '<button type="button" role="tab" class="cx-tab' + (r.recommended ? ' is-rec' : '') + '" aria-selected="' + (r.id === S.funnel) + '" data-f="' + r.id + '"><b>' + esc(r.name) + '</b><span>' + r.fit + '% fit</span></button>';
    }).join('');
  }

  /* ---------- Left: the calculator ---------- */
  function field(attr, val, unit, label, cls) {
    var pre = unit === '$' ? '<i class="pre">$</i>' : '';
    var post = unit === '%' ? '<i class="post">%</i>' : '';
    return '<span class="cx-f' + (unit === '$' ? ' cx-f--usd' : '') + (cls || '') + '">' + pre + '<input type="text" inputmode="decimal" autocomplete="off" aria-label="' + esc(label) + '" ' + attr + ' value="' + val + '">' + post + '</span>';
  }
  var undo = function (attr, on) { return '<button type="button" class="cx-undo" ' + attr + ' aria-label="Back to the value from your answers" title="Back to the value from your answers"' + (on ? '' : ' hidden') + '>&#8634;</button>'; };
  function row(k) {
    var unit = k.fmt === 'usd' ? '$' : '%';
    var val = k.fmt === 'usd' ? Math.round(k.value).toLocaleString('en-US') : round(k.value);
    return '<div class="cx-r' + (k.over ? ' is-over' : '') + '"><span class="cx-r__n">' + esc(k.name) + '</span>' + field('data-k="' + k.id + '"', val, unit, k.name) + undo('data-undo="' + k.id + '"', k.over) + '</div>';
  }
  function left() {
    var p = plan(), f = T.FUNNELS[S.funnel], a = p.a, h = '';
    h += '<section class="cx-st"><h2 class="cx-st__h"><span class="cx-st__n">$</span>Your offer</h2>' +
      '<div class="cx-r' + (S.price ? ' is-over' : '') + '"><span class="cx-r__n">Price of your main offer</span>' + field('data-o="price"', Math.round(a.price).toLocaleString('en-US'), '$', 'Price of your main offer') + undo('data-undo-o="price"', !!S.price) + '</div>' +
      '<div class="cx-r"><span class="cx-r__n">How it is paid</span><span class="cx-f cx-f--sel"><select data-o="model" aria-label="How it is paid"><option value="one_time">One-time</option><option value="monthly">Monthly</option><option value="annual">Annual</option></select></span></div>' +
      (f.callOnly ? '' : '<div class="cx-r"><span class="cx-r__n">Clients buy</span><span class="cx-f cx-f--sel"><select data-o="path" aria-label="Clients buy"><option value="call">After a sales call</option><option value="checkout">Online, no call</option></select></span></div>') +
      '</section>';
    for (var st = 1; st <= 6; st++) {
      var ks = p.kpis.filter(function (k) { return k.stage === st; });
      if (st === 1 && f.organic) { h += '<section class="cx-st"><h2 class="cx-st__h"><span class="cx-st__n">1</span>' + T.STAGES[1] + '</h2><p class="cx-st__note">Your own posts. About 1 post in 10 is an offer post.</p></section>'; continue; }
      if (st === 1 && !ks.length) { h += '<section class="cx-st"><h2 class="cx-st__h"><span class="cx-st__n">1</span>' + T.STAGES[1] + '</h2><p class="cx-st__note">No outreach channel picked in the survey.</p></section>'; continue; }
      if (!ks.length) continue;
      h += '<section class="cx-st"><h2 class="cx-st__h"><span class="cx-st__n">' + st + '</span>' + T.STAGES[st] + '</h2>';
      if (st === 1) {
        if (!f.adsOnly) h += '<div class="cx-r cx-r--ch cx-r--head" aria-hidden="true"><span></span><span>Rate</span><span>Share</span><span></span></div>';
        ks.forEach(function (k) {
          var line = p.lines.find(function (l) { return l.id === k.channel; }) || {};
          var share = (S.mix[S.funnel] || {})[k.channel];
          var val = k.fmt === 'usd' ? (Math.round(k.value * 100) / 100).toFixed(2) : round(k.value);
          h += '<div class="cx-r cx-r--ch' + (k.over ? ' is-over' : '') + '"><span class="cx-r__n">' + esc(T.CH[k.channel].name) + '<small>' + esc(k.name) + '</small></span>' +
            field('data-k="' + k.id + '"', val, k.fmt === 'usd' ? '$' : '%', k.name) +
            (f.adsOnly ? '' : field('data-mix="' + k.channel + '"', share != null ? share : (line.share > 0 && line.share < 1 ? Math.round(line.share * 10) / 10 : Math.round(line.share || 0)), '%', T.CH[k.channel].name + ' share of sign-ups', share != null ? ' is-share is-set' : ' is-share')) +
            undo('data-undo="' + k.id + '"', k.over) + '</div>';
        });
      } else ks.forEach(function (k) { h += row(k); });
      h += '</section>';
    }
    h += '<div class="cx-foot"><button type="button" class="cx-link" data-copy>Copy plan link</button><button type="button" class="cx-link cx-link--mute" data-reset>Reset my changes</button></div>';
    $('[data-cx-form]').innerHTML = h;
    var m = $('[data-o="model"]'); if (m) m.value = a.price_model;
    var pa = $('[data-o="path"]'); if (pa) pa.value = p.call ? 'call' : 'checkout';
  }

  /* ---------- Right: the goal and what each stage needs a month ---------- */
  function right() {
    var p = plan(), f = T.FUNNELS[S.funnel];
    var stage = function (n, title, items) { return items.length ? '<li class="cx-s"><span class="cx-s__n">' + n + '</span><div class="cx-s__b"><p class="cx-s__t">' + title + '</p>' + items.join('') + '</div></li>' : ''; };
    var it = function (label, val, key) { return '<p class="cx-s__i' + (key ? ' is-key' : '') + '"><span>' + esc(label) + '</span><b>' + val + '</b></p>'; };
    var s1 = p.lines.map(function (l) {
      if (l.id === 'owned') return it('Sign-ups from your own audience', fmtN(l.signups));
      if (l.money) return it('Ad spend', fmtU(l.reach), true);
      if (l.id === 'content' && f.organic) return it('People your posts reach', fmtN(l.reach), true);
      return it(l.unit.charAt(0).toUpperCase() + l.unit.slice(1), fmtN(l.reach), true);
    });
    var by = function (st) { return p.rows.filter(function (r) { return r.stage === st; }).map(function (r) { return it(r.label, fmtN(r.n), r.label === 'Customers' || r.label === 'Calls booked' || r.label === 'Main-offer customers' || r.label === 'Paid members'); }); };
    var s2 = [it(p.signup, fmtN(p.signupsMonth), true)];
    if (p.coldVisits > 0) s2.unshift(it(f.organic ? 'Offer post viewers' : 'Page visits', fmtN(p.coldVisits)));
    var warn = '';
    if (p.unreachable) warn += '<p class="cx-warn">With these rates the funnel makes no customers. Put back a rate you set to 0 with its arrow.</p>';
    if (p.gap > 0) warn += '<p class="cx-warn">' + fmtN(p.gap) + ' sign-ups a month have no channel. Raise a share in Traffic.</p>';
    if (p.budgetShort > 0) warn += '<p class="cx-warn">The ads need ' + fmtU(p.adSpend) + ' a month, ' + fmtU(p.budgetShort) + ' more than your budget.</p>';
    var fname = f.name.replace(' Funnel', '');
    $('[data-cx-side]').innerHTML = '<div class="cx-plan">' +
      '<label class="cx-goal"><span>Your 12-month revenue goal</span><span class="cx-goal__f"><i>$</i><input type="text" inputmode="numeric" data-goal value="' + Math.round(p.goal).toLocaleString('en-US') + '" aria-label="Your 12-month revenue goal"></span></label>' +
      '<p class="cx-plan__k">What it takes each month: ' + esc(fname) + '</p>' + warn +
      '<ol class="cx-stages">' + stage(1, 'Traffic', s1) + stage(2, 'Sign-ups', s2) + stage(3, 'Nurture', by(3)) + stage(4, 'Conversion', by(4)) +
      stage(5, 'Revenue', by(5).concat([it('Revenue a month', fmtU(p.revMonth), true)])) + '</ol>' +
      '<p class="cx-plan__later">Plus about ' + fmtN(p.later) + ' customers in the following 52 weeks from people who did not buy at first.</p></div>';
  }
  function rightKeep() {
    var a = document.activeElement, isGoal = a && a.hasAttribute && a.hasAttribute('data-goal'), pos = isGoal ? a.selectionStart : 0, v = isGoal ? a.value : null;
    right();
    if (isGoal) { var g = $('[data-goal]'); g.value = v; g.focus(); try { g.setSelectionRange(pos, pos); } catch (e) {} }
  }
  function render() { tabs(); left(); right(); $('[data-cx-sample]').hidden = !sample; }

  /* ---------- Events ---------- */
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.hasAttribute('data-goal')) { var d = t.value.replace(/[^\d]/g, '').slice(0, 11); t.value = d ? Number(d).toLocaleString('en-US') : ''; S.goal = Number(d) || 0; save(); rightKeep(); return; }
    var k = t.getAttribute('data-k');
    if (k) {
      var raw = t.value.replace(/[^\d.]/g, ''); S.over[S.funnel] = S.over[S.funnel] || {};
      if (raw === '' || !isFinite(+raw)) delete S.over[S.funnel][k]; else S.over[S.funnel][k] = +raw;
      var r = t.closest('.cx-r'); r.classList.toggle('is-over', raw !== ''); r.querySelector('.cx-undo').hidden = raw === '';
      save(); right(); return;
    }
    var mx = t.getAttribute('data-mix');
    if (mx) {
      var p = plan(); S.mix[S.funnel] = S.mix[S.funnel] || {};
      p.lines.forEach(function (l) { if (l.id !== 'owned' && S.mix[S.funnel][l.id] == null) S.mix[S.funnel][l.id] = Math.round(l.share || 0); });
      S.mix[S.funnel][mx] = Math.min(100, digits(t.value)); t.parentNode.classList.add('is-set');
      save(); right(); return;
    }
    if (t.getAttribute('data-o') === 'price') { var dp = t.value.replace(/[^\d]/g, '').slice(0, 9); t.value = dp ? Number(dp).toLocaleString('en-US') : ''; S.price = Number(dp) || 0; t.closest('.cx-r').classList.toggle('is-over', !!S.price); save(); right(); }
  });
  document.addEventListener('change', function (e) {
    var o = e.target.getAttribute('data-o');
    if (o === 'model') { S.model = e.target.value; save(); left(); right(); return; }
    if (o === 'path') { S.path = e.target.value; save(); left(); right(); return; }
    if (o === 'price') { left(); right(); } // the close rate follows the price band once typing ends
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-f]'); if (t) { S.funnel = t.getAttribute('data-f'); save(); render(); return; }
    var u = e.target.closest('[data-undo]'); if (u) { delete (S.over[S.funnel] || {})[u.getAttribute('data-undo')]; save(); left(); right(); return; }
    if (e.target.closest('[data-undo-o]')) { S.price = 0; save(); left(); right(); return; }
    if (e.target.closest('[data-reset]')) { S = { funnel: S.funnel, over: {}, mix: {} }; save(); left(); right(); return; }
    var c = e.target.closest('[data-copy]');
    if (c) {
      var url = location.origin + location.pathname + '#p=' + b64(A) + '&e=' + b64(S);
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { c.textContent = 'Link copied'; }, function () { window.prompt('Copy your plan link', url); });
      setTimeout(function () { c.textContent = 'Copy plan link'; }, 1800);
    }
  });

  /* ---------- Guide drawer ---------- */
  var dlg = $('[data-guide]');
  if (dlg) {
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-guide-open]')) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
      if (e.target.closest('[data-guide-close]') || e.target === dlg) dlg.close();
    });
    try { if (!localStorage.getItem('tantra_plan_guide_seen')) { $('[data-guide-open]').classList.add('is-new'); localStorage.setItem('tantra_plan_guide_seen', '1'); } } catch (e) {}
  }

  render();
})();
