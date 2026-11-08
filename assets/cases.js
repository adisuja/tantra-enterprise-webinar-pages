// Case explorer (src/cases.mjs): stage and industry filters, the case dialogs, deep links (#cs-<id>) and
// previous / next inside a dialog, which steps through the tiles the visitor is currently looking at.
(() => {
  const explorers = [...document.querySelectorAll('[data-cx]')];
  let seq = [];

  explorers.forEach((cx) => {
    const tiles = [...cx.querySelectorAll('[data-tile]')];
    const count = cx.querySelector('[data-cx-count]');
    const empty = cx.querySelector('[data-cx-empty]');
    const f = { stage: 'all', ind: 'all' };
    const match = (t, stage, ind) => (stage === 'all' || t.dataset.stage === stage) && (ind === 'all' || t.dataset.ind.split(' ').includes(ind));
    const apply = () => {
      let n = 0;
      tiles.forEach((t) => { const ok = match(t, f.stage, f.ind); t.hidden = !ok; if (ok) n += 1; });
      const all = f.stage === 'all' && f.ind === 'all';
      count.textContent = all ? `Showing all ${tiles.length} case studies` : `Showing ${n} of ${tiles.length} case studies`;
      empty.hidden = n > 0;
      cx.querySelectorAll('[data-f-stage]').forEach((b) => {
        const v = b.dataset.fStage; b.setAttribute('aria-pressed', String(v === f.stage));
        const c = b.querySelector('[data-n]'); if (c) { const k = tiles.filter((t) => match(t, v, f.ind)).length; c.textContent = k; b.classList.toggle('is-zero', !k); }
      });
      cx.querySelectorAll('[data-f-ind]').forEach((b) => {
        const v = b.dataset.fInd; b.setAttribute('aria-pressed', String(v === f.ind));
        const c = b.querySelector('[data-n]'); if (c) { const k = tiles.filter((t) => match(t, f.stage, v)).length; c.textContent = k; b.classList.toggle('is-zero', !k); }
      });
    };
    cx.addEventListener('click', (e) => {
      const s = e.target.closest('[data-f-stage]');
      const i = e.target.closest('[data-f-ind]');
      if (s) f.stage = s.dataset.fStage === f.stage && s.dataset.fStage !== 'all' ? 'all' : s.dataset.fStage;
      else if (i) f.ind = i.dataset.fInd === f.ind && i.dataset.fInd !== 'all' ? 'all' : i.dataset.fInd;
      else if (e.target.closest('[data-cx-reset]')) { f.stage = 'all'; f.ind = 'all'; } else return;
      apply();
      // Keep the pressed chip in view in the swipeable row on phones.
      if (i && i.classList.contains('cx-chip')) i.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    });
    apply();
  });

  // ---------- Dialogs ----------
  const dlg = (id) => document.getElementById(`cs-${id}`);
  const visibleIds = (from) => {
    const cx = from && from.closest('[data-cx]');
    const scope = cx ? [...cx.querySelectorAll('[data-tile]:not([hidden]) [data-case]')] : [...document.querySelectorAll('[data-case]')];
    return scope.map((a) => a.dataset.case);
  };
  const clean = () => { if (/^#cs-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); };
  function open(id, from) {
    const d = dlg(id);
    if (!d || typeof d.showModal !== 'function') return false;
    document.querySelectorAll('dialog.csd[open]').forEach((o) => { if (o !== d) o.close(); });
    if (from) seq = visibleIds(from);
    if (!seq.includes(id)) seq = visibleIds(null);
    // Images in a closed dialog are lazy; load them now so the panel never opens blank.
    d.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
    if (!d.open) d.showModal();
    // Focus the case name, so a screen reader announces it and no ring is drawn around the whole panel.
    const h = d.querySelector('.story__name'); if (h) h.focus({ preventScroll: true });
    const body = d.querySelector('.csd__body'); if (body) body.scrollTop = 0;
    history.replaceState(null, '', `${location.pathname}${location.search}#cs-${id}`);
    return true;
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-case]');
    if (a && open(a.dataset.case, a)) { e.preventDefault(); return; }
    const x = e.target.closest('[data-cs-close]');
    if (x) { x.closest('dialog').close(); return; }
    const step = e.target.closest('[data-cs-step]');
    if (step) {
      const cur = step.closest('dialog').id.slice(3);
      const i = seq.indexOf(cur);
      const next = seq[(i + Number(step.dataset.csStep) + seq.length) % seq.length];
      if (next && next !== cur) open(next, null);
      return;
    }
    // A click on the backdrop (the dialog element itself, outside its content) closes it.
    if (e.target.matches && e.target.matches('dialog.csd')) e.target.close();
  });
  document.querySelectorAll('dialog.csd').forEach((d) => d.addEventListener('close', () => {
    if (document.querySelector('dialog.csd[open]')) return;
    clean();
    const opener = document.querySelector(`[data-case="${d.id.slice(3)}"]`);
    if (opener && opener.offsetParent) opener.focus({ preventScroll: true });
    else if (opener) { const c = opener.closest('[data-cx]'); const n = c && c.querySelector('[data-cx-count]'); if (n) { n.tabIndex = -1; n.focus({ preventScroll: true }); } }
  }));
  document.addEventListener('keydown', (e) => {
    const d = document.querySelector('dialog.csd[open]');
    if (!d || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    const b = d.querySelector(`[data-cs-step="${e.key === 'ArrowLeft' ? -1 : 1}"]`); if (b) b.click();
  });
  const fromHash = () => { const m = location.hash.match(/^#cs-([a-z0-9-]+)$/); if (m) open(m[1], document.querySelector(`[data-case="${m[1]}"]`)); };
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
