// Case explorer (src/cases.mjs): stage and industry filters, the case dialogs, deep links (#cs-<id>) and
// previous / next inside a dialog, which steps through the tiles the visitor is currently looking at.
// Stage pie (src/cases.mjs): a click, a tap or the arrow keys pick a stage segment and show its cases. Hover only
// highlights a segment: selecting on hover switched stages while the pointer travelled to the cards (Adi 2026-11-08); industry chips filter
// the cards; the case dialogs open from a card, with deep links (#cs-<id>) and previous / next through the cards in view.
(() => {
  const pies = [...document.querySelectorAll('[data-pie]')];
  let seq = [];

  pies.forEach((pie) => {
    const segs = [...pie.querySelectorAll('.pie__seg')];
    const panels = [...pie.querySelectorAll('[data-panel]')];
    let ind = 'all';
    let cur = pie.dataset.first;
    const main = pie.querySelector('.pie__main');
    const show = (stage, reveal) => {
      const changed = stage !== cur;
      cur = stage;
      segs.forEach((g) => {
        const on = g.dataset.stage === stage;
        g.classList.toggle('is-on', on); g.setAttribute('aria-selected', String(on)); g.setAttribute('tabindex', on ? '0' : '-1');
      });
      panels.forEach((p) => {
        const on = p.dataset.panel === stage;
        if (on && p.hidden) { p.hidden = false; p.classList.remove('is-in'); void p.offsetWidth; p.classList.add('is-in'); } else if (!on) p.hidden = true;
      });
      // A picked stage whose cards start above the screen (a shorter panel after scrolling) scrolls them back into view.
      if (reveal && changed && main) {
        const top = main.getBoundingClientRect().top;
        const nav = document.body.classList.contains('page-dd') ? 88 : 16;
        if (top < nav) window.scrollBy({ top: top - nav - 8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    };
    const filter = () => {
      panels.forEach((p) => {
        const cards = [...p.querySelectorAll('.pc')];
        let n = 0;
        cards.forEach((c) => { const ok = ind === 'all' || c.dataset.ind.split(' ').includes(ind); c.hidden = !ok; if (ok) n += 1; });
        const e = p.querySelector('[data-empty]'); if (e) e.hidden = n > 0;
      });
      pie.querySelectorAll('[data-f-ind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fInd === ind)));
    };
    segs.forEach((g) => {
      g.addEventListener('click', () => show(g.dataset.stage, true));
      g.addEventListener('keydown', (e) => {
        const order = segs.filter((x) => x.closest('svg') === g.closest('svg'));
        const i = order.indexOf(g);
        let to = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') to = order[(i + 1) % order.length];
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') to = order[(i - 1 + order.length) % order.length];
        else if (e.key === 'Home') to = order[0]; else if (e.key === 'End') to = order[order.length - 1];
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(g.dataset.stage, true); return; }
        if (to) { e.preventDefault(); show(to.dataset.stage, true); to.focus({ preventScroll: true }); }
      });
    });
    pie.addEventListener('click', (e) => {
      const b = e.target.closest('[data-f-ind]');
      if (!b) return;
      ind = b.dataset.fInd === ind && ind !== 'all' ? 'all' : b.dataset.fInd;
      filter();
      if (b.classList.contains('pie__chip')) b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    });
    show(cur);
    // The segments sweep in the first time the pie scrolls into view.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { es.forEach((en) => { if (en.isIntersecting) { pie.classList.add('is-seen'); io.disconnect(); } }); }, { threshold: 0.25 });
      pie.classList.add('is-armed'); io.observe(pie);
    }
  });

  // ---------- Dialogs ----------
  const dlg = (id) => document.getElementById(`cs-${id}`);
  const visibleIds = (from) => {
    const panel = from && from.closest('[data-panel]');
    const scope = panel ? [...panel.querySelectorAll('.pc:not([hidden]) [data-case]')] : [...document.querySelectorAll('[data-case]')];
    return [...new Set(scope.map((a) => a.dataset.case))];
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
