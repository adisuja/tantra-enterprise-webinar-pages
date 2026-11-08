// Confirmation page (/confirmation/): the live room button and the calendar buttons.
// The personal WebinarJam link comes from the CRM later (board card "WebinarJam join link on the confirmation page"):
// the register Worker will hand it over as ?join=<url> on the redirect (kept in sessionStorage for reloads). Until then
// the configured room (webinar.join_url) is the fallback. Review states: ?state=preparing, ?state=unavailable.
(() => {
  const qs = new URLSearchParams(location.search);
  const state = qs.get('state');
  const box = document.querySelector('[data-room-box]');
  const okHost = (u) => {
    try {
      const h = new URL(u).hostname; const cfg = box && box.dataset.room ? new URL(box.dataset.room).hostname : '';
      return new URL(u).protocol === 'https:' && (/(^|\.)webinarjam\.(com|net)$/.test(h) || /(^|\.)webinarkit\.com$/.test(h) || (cfg && h === cfg));
    } catch (e) { return false; }
  };
  const norm = (u) => new URL(u).href;
  let link = '';
  const fromUrl = qs.get('join');
  if (fromUrl && okHost(fromUrl)) { link = norm(fromUrl); try { sessionStorage.setItem('tantra_join_url', link); } catch (e) {} }
  if (!link) { try { const s = sessionStorage.getItem('tantra_join_url'); if (s && okHost(s)) link = norm(s); } catch (e) {} }
  const personal = !!link;
  if (!link && box && box.dataset.room) link = box.dataset.room;

  // ---------- Room button ----------
  if (box) {
    const btn = box.querySelector('[data-room-btn]'), txt = box.querySelector('[data-room-text]'), note = box.querySelector('[data-room-note]');
    const off = () => { btn.setAttribute('aria-disabled', 'true'); btn.removeAttribute('href'); btn.setAttribute('role', 'link'); };
    if (state === 'preparing') { box.dataset.state = 'preparing'; off(); txt.textContent = 'Preparing your link...'; note.textContent = 'Looking up your personal room link.'; }
    else if (state === 'unavailable') { box.dataset.state = 'unavailable'; off(); txt.textContent = 'Link unavailable'; note.textContent = 'Check the WhatsApp group: we post the room link there before we go live.'; }
    else if (link) {
      box.dataset.state = 'live'; btn.href = link; btn.target = '_blank'; btn.rel = 'noopener'; btn.removeAttribute('aria-disabled');
      txt.textContent = 'Join the live workshop'; note.textContent = 'This link is yours. It is also in the calendar event you add above.';
    } else { box.dataset.state = 'waiting'; off(); }
  }

  // ---------- WhatsApp 1-to-1 (board card 37): swap the personal link for a short ref; the button opens WhatsApp with
  // "Send my link #<ref>" ready, and the reply carries the link. Shown only when the Worker has a live sender number.
  const dm = document.querySelector('[data-wa-dm]');
  if (dm && personal && window.fetch) {
    fetch(`${dm.dataset.waWorker}/wa/ref`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ join: link, name: '' }) })
      .then((r) => r.json()).then((j) => { if (j && j.wa && /^https:\/\/wa\.me\//.test(j.wa)) { dm.href = j.wa; dm.hidden = false; } }).catch(() => {});
  }

  // ---------- Calendar buttons: Google and Outlook links, and an .ics for Apple, with the room link when known ----------
  const cal = document.querySelector('[data-cal]');
  if (cal) {
    const start = new Date(cal.dataset.start), end = new Date(cal.dataset.end);
    const title = cal.dataset.title;
    const details = personal ? `${cal.dataset.lead}\nYour personal room link: ${link}` : cal.dataset.details;
    const where = link || 'Online (WebinarJam)';
    const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const g = cal.querySelector('[data-cal-google]');
    if (g) g.href = `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${stamp(start)}/${stamp(end)}`, details, location: where })}`;
    const o = cal.querySelector('[data-cal-outlook]');
    if (o) o.href = `https://outlook.live.com/calendar/0/deeplink/compose?${new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: title, startdt: start.toISOString(), enddt: end.toISOString(), body: details, location: where })}`;
    // Apple: the static .ics already has the event; with a personal link, build the file in the browser instead.
    const a = cal.querySelector('[data-cal-apple]');
    if (a && personal && window.Blob && window.URL) {
      const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');
      const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tantra//Enterprise Webinar//EN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
        `UID:tantra-enterprise-webinar-${stamp(start)}@usetantra.com`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
        `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(details)}`, `LOCATION:${esc(where)}`, `URL:${link.replace(/[\r\n]/g, '')}`,
        'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:Starts in 15 minutes', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    }
  }
})();
