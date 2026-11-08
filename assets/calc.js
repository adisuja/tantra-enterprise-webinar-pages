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
  S.over = S.over || {}; S.mix = S.mix || {}; S.bench = S.bench || {};

  var fmtN = function (x) { x = +x || 0; var a = Math.abs(x); if (a >= 1e6) return (Math.round(x / 1e5) / 10).toLocaleString('en-US') + 'M'; return a >= 100 ? Math.round(x).toLocaleString('en-US') : a >= 10 ? (Math.round(x * 10) / 10).toLocaleString('en-US') : (Math.round(x * 100) / 100).toLocaleString('en-US'); };
  var fmtU = function (x) { return '$' + Math.round(+x || 0).toLocaleString('en-US'); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var digits = function (v) { return Number(String(v).replace(/[^\d.]/g, '')) || 0; };
  var round = function (x) { return x >= 1 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100; };

  function opts() { return { bench: S.bench[S.funnel] || {}, over: S.over[S.funnel] || {}, mix: S.mix[S.funnel] || null, goal: S.goal || 0, call: S.path ? S.path === 'call' : null, price: S.price || 0, price_model: S.model || null }; }
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
      '<ol class="cx-stages">' + stage(1, 'Traffic generation engine', s1) + stage(2, 'Landing and registration', s2) + stage(3, 'Multi-channel nurture', by(3)) + stage(4, 'Conversion mechanism', by(4)) +
      stage(5, 'Revenue engine', by(5).concat([it('Revenue a month', fmtU(p.revMonth), true)])) + '</ol>' +
      '<p class="cx-plan__later">Plus about ' + fmtN(p.later) + ' customers in the following 52 weeks from people who did not buy at first.</p></div>';
  }
  function rightKeep() {
    var a = document.activeElement, isGoal = a && a.hasAttribute && a.hasAttribute('data-goal'), pos = isGoal ? a.selectionStart : 0, v = isGoal ? a.value : null;
    right();
    if (isGoal) { var g = $('[data-goal]'); g.value = v; g.focus(); try { g.setSelectionRange(pos, pos); } catch (e) {} }
  }
  /* ---------- Bottom: how the plan is calculated ---------- */
  var fmtP = function (x) { return (x >= 1 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100) + '%'; };
  var kv = function (k) { return k.fmt === 'usd' ? '$' + (Math.round(k.value * 100) / 100).toLocaleString('en-US') : fmtP(k.value); };
  function calc() {
    var p = plan(), f = T.FUNNELS[S.funnel], K = {}; p.kpis.forEach(function (k) { K[k.id] = k; });
    var rowBy = {}; p.rows.forEach(function (r) { rowBy[r.label] = r; });
    var tok = function (s) {
      return s.replace(/\{S\}/g, '<span class="cx-t">' + esc(p.signup) + ' <b>' + fmtN(p.signupsMonth) + '</b></span>')
        .replace(/\{r:([^}]+)\}/g, function (_, l) { var r = rowBy[l]; return '<span class="cx-t">' + esc(l) + ' <b>' + fmtN(r ? r.n : 0) + '</b></span>'; })
        .replace(/\{([A-Z0-9]+)\}/g, function (_, id) { var k = K[id]; return k ? '<span class="cx-t cx-t--k">' + esc(k.name) + ' <b>' + kv(k) + '</b></span>' : id; });
    };
    var eq = function (label, formula, result) { return '<li class="cx-eq"><span class="cx-eq__l">' + label + '</span><span class="cx-eq__f">= ' + formula + '</span><b class="cx-eq__r">= ' + result + '</b></li>'; };
    var a = p.a, model = a.price_model, mode = { one_time: 'one-time', monthly: 'a month', annual: 'a year' }[model];

    // 1. The revenue maths
    var h = '<article class="cx-card"><h3 class="cx-card__h"><span class="cx-st__n">$</span>The revenue maths</h3><ol class="cx-eqs">';
    h += eq('Revenue a month', '<span class="cx-t">12-month goal <b>' + fmtU(p.goal) + '</b></span> ÷ 12', fmtU(p.revMonth));
    h += eq('Revenue per customer in 12 months', model === 'monthly' ? '<span class="cx-t">Price <b>' + fmtU(a.price) + ' a month</b></span> × <span class="cx-t">average months paid in the year <b>' + (Math.round(p.value12 / a.price * 10) / 10) + '</b></span> (customers join through the year; ' + fmtP(p.churn * 100) + ' leave each month)' : '<span class="cx-t">Price <b>' + fmtU(a.price) + ' ' + mode + '</b></span>', fmtU(p.value12));
    h += eq('Customers per ' + p.signup.toLowerCase().replace(/s$/, ''), 'the conversions in stages 3 to 5 below, multiplied', fmtP(p.perSignup.cust * 100));
    h += eq('Revenue per ' + p.signup.toLowerCase().replace(/s$/, ''), '<span class="cx-t">customers per sign-up <b>' + fmtP(p.perSignup.cust * 100) + '</b></span> × ' + fmtU(p.value12) + (p.perSignup.extra ? ' + <span class="cx-t">low-ticket sales per sign-up <b>$' + (Math.round(p.perSignup.extra * 100) / 100) + '</b></span>' : ''), '$' + (Math.round(p.perSignup.rev * 100) / 100).toLocaleString('en-US'));
    h += eq(p.signup + ' needed a month', fmtU(p.revMonth) + ' ÷ $' + (Math.round(p.perSignup.rev * 100) / 100).toLocaleString('en-US'), fmtN(p.signupsMonth) + (p.cycles !== 12 ? ' <small>(' + fmtN(p.perCycle) + ' per ' + p.cadence.per + ', ' + p.cycles + ' a year)</small>' : ''));
    h += '</ol></article>';

    // 2. Stage by stage: benchmarks (editable) and conversions
    var bench = function (k) {
      var b = (S.bench[S.funnel] || {})[k.id] || {}, u = k.fmt === 'usd' ? '$' : '%';
      var cell = function (w) { var v = b[w] != null ? b[w] : k['b' + w]; return '<td>' + field('data-b="' + k.id + ':' + w + '"', round(+v), u, k.name + ' ' + { lo: 'low', ty: 'typical', hi: 'strong' }[w] + ' benchmark', b[w] != null ? ' is-set' : '') + '</td>'; };
      return '<tr><th scope="row"><b>' + esc(k.channel ? T.CH[k.channel].name + ': ' + k.name : k.name) + '</b><small>' + esc(k.def) + '</small></th>' + cell('lo') + cell('ty') + cell('hi') +
        '<td class="cx-used' + (k.over ? ' is-over' : '') + '"><b>' + kv(k) + '</b><small>' + (k.over ? 'typed on the calculator' : 'from your answers') + '</small></td><td class="cx-src2">' + esc(k.src) + '</td></tr>';
    };
    for (var st = 1; st <= 6; st++) {
      var ks = p.kpis.filter(function (k) { return k.stage === st; }), rs = p.rows.filter(function (r) { return r.stage === st; }), eqs = '';
      if (st === 1) {
        p.lines.forEach(function (l) {
          if (l.id === 'owned') { eqs += eq('Sign-ups from your own audience', 'visits from your list and followers × <span class="cx-t">warm rate <b>' + fmtP(Math.min(60, K.LP.value * 2.5)) + '</b></span> (2.5 × the page rate)', fmtN(l.signups)); return; }
          var k = p.kpis.find(function (x) { return x.channel === l.id; });
          if (f.organic) { eqs += eq('Offer post viewers', tok('{S} ÷ {LP}'), fmtN(l.visits)); eqs += eq('People your posts reach', 'offer post viewers × 10 (1 post in 10 is an offer post)', fmtN(l.reach)); return; }
          var sg = '<span class="cx-t">' + esc(p.signup) + ' from ' + esc(T.CH[l.id].name.toLowerCase().replace('linkedin', 'LinkedIn').replace('whatsapp', 'WhatsApp')) + ' <b>' + fmtN(l.signups) + '</b> (' + Math.round(l.share || 0) + '% share)</span>';
          if (p.event && T.CH[l.id].ev) { eqs += eq(l.unit.charAt(0).toUpperCase() + l.unit.slice(1), sg + ' ÷ ' + tok('{' + k.id + '}'), fmtN(l.reach)); return; }
          eqs += eq('Page visits from ' + T.CH[l.id].name.toLowerCase().replace('linkedin', 'LinkedIn').replace('whatsapp', 'WhatsApp'), sg + ' ÷ ' + tok('{LP}'), fmtN(l.visits));
          if (l.money) eqs += eq('Ad spend', '<span class="cx-t">page visits <b>' + fmtN(l.visits) + '</b></span> × ' + tok('{CPC}') + ' ÷ 85% of clicks that load the page', fmtU(l.reach));
          else eqs += eq(l.unit.charAt(0).toUpperCase() + l.unit.slice(1), '<span class="cx-t">page visits <b>' + fmtN(l.visits) + '</b></span> ÷ ' + tok('{' + k.id + '}'), fmtN(l.reach));
        });
      }
      if (st === 2) eqs += eq(p.signup + ' a month', 'the sum of the channels in stage 1', fmtN(p.signupsMonth));
      rs.forEach(function (r) { if (r.formula) eqs += eq(r.label, tok(r.formula), fmtN(r.n)); });
      if (st === 5) eqs += eq('Revenue a month', '<span class="cx-t">' + (rowBy['Customers'] ? 'Customers' : (rowBy['Main-offer customers'] ? 'Main-offer customers' : 'Paid members')) + ' <b>' + fmtN(p.custMonth) + '</b></span> × ' + fmtU(p.value12) + (p.extraF ? ' + ' + tok(p.extraF) : ''), fmtU(p.revMonth));
      if (st === 6) eqs += eq('Customers from the long-term nurture engine', '<span class="cx-t">customers a year <b>' + fmtN(p.cust12) + '</b></span> × ' + tok('{NRR}'), fmtN(p.later));
      if (!ks.length && !eqs) continue;
      h += '<article class="cx-card"><h3 class="cx-card__h"><span class="cx-st__n">' + st + '</span>' + T.STAGES[st] + '</h3>';
      if (ks.length) h += '<div class="cx-tblwrap"><table class="cx-bt"><thead><tr><th scope="col">KPI</th><th scope="col">Low</th><th scope="col">Typical</th><th scope="col">Strong</th><th scope="col">Used</th><th scope="col">Source</th></tr></thead><tbody>' + ks.map(bench).join('') + '</tbody></table></div>';
      if (eqs) h += '<p class="cx-eqs__k">Conversions a month</p><ol class="cx-eqs">' + eqs + '</ol>';
      h += '</article>';
    }
    $('[data-cx-calc]').innerHTML = h;
  }

  // Redraw while keeping the cursor where it was (typing in a benchmark redraws every part of the page).
  function keep(fn) {
    var ae = document.activeElement, key = ae && ae.getAttribute && (ae.getAttribute('data-b') || ae.getAttribute('data-k') || ae.getAttribute('data-mix'));
    var attr = ae && ae.getAttribute && (ae.hasAttribute('data-b') ? 'data-b' : ae.hasAttribute('data-k') ? 'data-k' : 'data-mix');
    var pos = key ? ae.selectionStart : 0, val = key ? ae.value : null;
    fn();
    if (key) { var el = document.querySelector('[' + attr + '="' + key + '"]'); if (el) { el.value = val; el.focus({ preventScroll: true }); try { el.setSelectionRange(pos, pos); } catch (e) {} } }
  }

  function render() { tabs(); left(); right(); calc(); $('[data-cx-sample]').hidden = !sample; }

  /* ---------- Events ---------- */
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.hasAttribute('data-goal')) { var d = t.value.replace(/[^\d]/g, '').slice(0, 11); t.value = d ? Number(d).toLocaleString('en-US') : ''; S.goal = Number(d) || 0; save(); rightKeep(); calc(); return; }
    var k = t.getAttribute('data-k');
    if (k) {
      var raw = t.value.replace(/[^\d.]/g, ''); S.over[S.funnel] = S.over[S.funnel] || {};
      if (raw === '' || !isFinite(+raw)) delete S.over[S.funnel][k]; else S.over[S.funnel][k] = +raw;
      var r = t.closest('.cx-r'); r.classList.toggle('is-over', raw !== ''); r.querySelector('.cx-undo').hidden = raw === '';
      save(); right(); calc(); return;
    }
    var bk = t.getAttribute('data-b');
    if (bk) {
      var parts = bk.split(':'), rawb = t.value.replace(/[^\d.]/g, '');
      var fb = S.bench[S.funnel] = S.bench[S.funnel] || {}, e = fb[parts[0]] = fb[parts[0]] || {};
      if (rawb === '' || !isFinite(+rawb)) delete e[parts[1]]; else e[parts[1]] = +rawb;
      if (!Object.keys(e).length) delete fb[parts[0]];
      t.parentNode.classList.toggle('is-set', rawb !== '');
      save(); keep(function () { left(); right(); calc(); }); return;
    }
    var mx = t.getAttribute('data-mix');
    if (mx) {
      var p = plan(); S.mix[S.funnel] = S.mix[S.funnel] || {};
      p.lines.forEach(function (l) { if (l.id !== 'owned' && S.mix[S.funnel][l.id] == null) S.mix[S.funnel][l.id] = Math.round(l.share || 0); });
      S.mix[S.funnel][mx] = Math.min(100, digits(t.value)); t.parentNode.classList.add('is-set');
      save(); right(); calc(); return;
    }
    if (t.getAttribute('data-o') === 'price') { var dp = t.value.replace(/[^\d]/g, '').slice(0, 9); t.value = dp ? Number(dp).toLocaleString('en-US') : ''; S.price = Number(dp) || 0; t.closest('.cx-r').classList.toggle('is-over', !!S.price); save(); right(); calc(); }
  });
  document.addEventListener('change', function (e) {
    var o = e.target.getAttribute('data-o');
    if (o === 'model') { S.model = e.target.value; save(); left(); right(); calc(); return; }
    if (o === 'path') { S.path = e.target.value; save(); left(); right(); calc(); return; }
    if (o === 'price') { left(); right(); calc(); }
    if (e.target.hasAttribute('data-b')) { keep(function () { left(); right(); calc(); }); } // the close rate follows the price band once typing ends
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-f]'); if (t) { S.funnel = t.getAttribute('data-f'); save(); render(); return; }
    var u = e.target.closest('[data-undo]'); if (u) { delete (S.over[S.funnel] || {})[u.getAttribute('data-undo')]; save(); left(); right(); calc(); return; }
    if (e.target.closest('[data-undo-o]')) { S.price = 0; save(); left(); right(); calc(); return; }
    if (e.target.closest('[data-reset]')) { S = { funnel: S.funnel, over: {}, mix: {}, bench: S.bench }; save(); left(); right(); calc(); return; }
    if (e.target.closest('[data-bench-reset]')) { S.bench[S.funnel] = {}; save(); left(); right(); calc(); return; }
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
