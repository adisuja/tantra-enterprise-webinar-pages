/* Tantra Revenue Plan model, v2 (Adi 2026-11-08: far more conservative, built on our own webinar data).
   One file, no DOM: the thank-you survey uses it to rank funnels, the calculator uses it to build the plan; it also
   loads in Node (deliverables/14-thank-you-survey/tools/model-doc.mjs).

   Where the rates come from. Our own funnels, 2025 to 2026, cold calendar invites as the main channel:
   Growth Idea (calendar only, 11 webinars), FintechCircle (calendar plus LinkedIn content, 11 webinars, dashboard),
   GrowthClub (calendar, 24 webinars). Measured: 0.6% to 0.8% of calendar invites register; 0.4% to 4% of cold
   landing page visitors register; 16% to 21% of registrants attend live; 4% to 7% of attendees book a call;
   about 6% of booked calls close on a $5,000 to $10,000 offer and about 39% on a $2,000 offer.
   The other nine funnels are extrapolated from the webinar: each public benchmark is scaled by how far our own
   webinar numbers sit below the public webinar benchmarks (landing pages about a fifth, show-up about 40%,
   booking about 70%). The survey answers place each KPI inside its range, never outside it. Rates are percentages. */
(function (root) {
  'use strict';

  const SRC = {
    own: 'Our webinars 2025 to 2026 (Growth Idea, FintechCircle, GrowthClub), cold calendar invites',
    ext: 'Extrapolated from our webinar data and the public benchmark for this funnel',
    fm: 'Funnel Master diagram, scaled down to our measured webinar rates',
    ads: 'Meta B2B 2025 (Metadata.io; WordStream)',
    plan: 'Planning figure: replace it with your own number'
  };

  /* ---------- Survey options (indexes are stored in the answers) ---------- */
  const OPTIONS = {
    offer_type: [['service', 'Done-for-you service or agency'], ['consulting', 'Consulting or advisory'], ['coaching', 'Coaching, training or a programme'], ['course', 'Course, membership or digital product'], ['software', 'Software (SaaS)'], ['product', 'Physical or other product']],
    market: [['b2b', 'Businesses'], ['b2c', 'Consumers'], ['both', 'Both']],
    price_model: [['one_time', 'One-time payment'], ['monthly', 'Monthly subscription or retainer'], ['annual', 'Annual contract']],
    motion: [['call', 'After a sales call'], ['checkout', 'Online, without a call'], ['both', 'Both, it depends on the offer']],
    revenue_now: ['Pre-revenue', 'Under $10K', '$10K to $50K', '$50K to $100K', '$100K to $250K', '$250K to $1M', 'Over $1M'],
    revenue_built: ['Nothing yet', 'Under $100K', '$100K to $500K', '$500K to $1M', '$1M to $5M', '$5M to $10M', 'Over $10M'],
    years: ['Under 1 year', '1 to 3 years', '3 to 5 years', '5 to 10 years', 'Over 10 years'],
    clients: ['None yet', '1 to 5', '6 to 20', '21 to 100', 'More than 100'],
    case_studies: ['None yet', '1 or 2', '3 to 5', '6 to 10', 'More than 10'],
    brands: ['No well-known names yet', 'A few recognisable clients', 'Well-known brands I can name'],
    funnel_exp: ['I have never built one', 'I built one, it did not work', 'One funnel that works', 'Several profitable funnels'],
    revops: ['No system yet', 'Spreadsheets and inbox', 'A CRM with a pipeline', 'CRM with automated follow-up'],
    hours: ['Under 5 hours', '5 to 10 hours', '10 to 20 hours', 'More than 20 hours'],
    team_help: ['Just me', '1 or 2 people', '3 to 10 people', 'More than 10'],
    channels: [['calendar', 'Cold calendar invites'], ['cold_email', 'Cold email'], ['linkedin', 'LinkedIn outreach'], ['whatsapp', 'WhatsApp outreach'], ['ads', 'Paid ads'], ['content', 'Organic content'], ['partners', 'Partners and referrals']],
    funnels_built: [['webinar', 'Webinar'], ['rsp', 'Video sales letter'], ['workshop', 'Workshop'], ['ooo', 'Low-ticket offer'], ['book', 'Book a call'], ['challenge', 'Challenge'], ['community', 'Community'], ['launch', 'Product launch']]
  };
  const REV_NOW_MID = [0, 5000, 30000, 75000, 175000, 600000, 1500000];

  /* ---------- KPI ---------- [id, stage, name, def, low, typical, strong, lever, source, flags, fmt] */
  const K = (id, stage, name, def, lo, ty, hi, lever, src, flags = '', fmt = 'pct') => ({ id, stage, name, def, lo, ty, hi, lever, src, flags, fmt });

  /* Stage 1: traffic channels. Event funnels (webinar, workshop, challenge, launch) register people straight from
     the calendar invite (Yes or Maybe registers them); the rest send the invite's link to a page. */
  const CH = {
    calendar: { name: 'Cold calendar invites', unit: 'invites', w: 70, ev: K('CAL', 1, 'Calendar Sign-Up Rate', 'sign-ups ÷ calendar invites sent', 0.3, 0.6, 0.9, 'landing', SRC.own), pg: K('CALV', 1, 'Calendar Click Rate', 'page visits ÷ calendar invites sent', 1, 2.5, 5, 'landing', SRC.own) },
    cold_email: { name: 'Cold email', unit: 'emails', w: 10, ev: K('EMS', 1, 'Cold Email Sign-Up Rate', 'sign-ups ÷ cold emails sent (replies asking for the link included)', 0.05, 0.15, 0.3, 'landing', SRC.own), pg: K('EMV', 1, 'Cold Email Click Rate', 'page visits ÷ emails sent', 0.2, 0.5, 1, 'landing', SRC.ext) },
    linkedin: { name: 'LinkedIn outreach', unit: 'connection requests', w: 10, ev: K('LIS', 1, 'LinkedIn Sign-Up Rate', 'sign-ups ÷ connection requests sent', 0.2, 0.4, 0.8, 'landing', SRC.ext), pg: K('LIV', 1, 'LinkedIn Click Rate', 'page visits ÷ connection requests sent', 0.4, 0.8, 1.5, 'landing', SRC.ext) },
    whatsapp: { name: 'WhatsApp outreach', unit: 'messages', w: 5, ev: K('WAS', 1, 'WhatsApp Sign-Up Rate', 'sign-ups ÷ messages sent', 0.3, 0.6, 1, 'landing', SRC.ext), pg: K('WAV', 1, 'WhatsApp Click Rate', 'page visits ÷ messages sent', 0.8, 1.5, 3, 'landing', SRC.ext) },
    ads: { name: 'Paid ads', unit: 'ad spend', w: 20, pg: K('CPC', 1, 'Cost per Click', 'ad spend ÷ ad clicks, in dollars', 1.95, 1.95, 1.95, 'landing', SRC.ads, '', 'usd') },
    content: { name: 'Organic content', unit: 'post views', w: 5, pg: K('POV', 1, 'Post Click Rate', 'page visits ÷ post views', 0.2, 0.5, 1, 'landing', SRC.ext) },
    partners: { name: 'Partners and referrals', unit: 'partner audience', w: 5, pg: K('PAV', 1, 'Partner Click Rate', 'page visits ÷ people a partner reaches', 0.5, 1, 2, 'landing', SRC.plan) }
  };
  // The audience you own: page visits a month per person, converting at a warm rate (2.5 times the cold page rate).
  const OWNED = {
    email_list: { name: 'Your email list', per: 2 * 0.3 * 0.02 },
    followers: { name: 'Your social following', per: 12 * 0.05 * 0.005 },
    youtube: { name: 'Your YouTube channel', per: 4 * 0.08 * 0.01 },
    community: { name: 'Your community or group', per: 2 * 0.5 * 0.03 },
    site: { name: 'Your website visitors', per: 0.01 }
  };
  const WARM = 2.5;

  /* Shared pipeline for call offers (stage 5). Close is for a $5,000 to $15,000 offer; priceBand() scales it. */
  const CSR = K('CSR', 5, 'Call Show Rate', 'calls held ÷ calls booked', 55, 65, 75, 'nurture', SRC.own);
  const CLOSE = (m = 1) => K('CLOSE', 5, 'Close Rate', 'customers ÷ calls held', +(7 * m).toFixed(1), +(11 * m).toFixed(1), +(17 * m).toFixed(1), 'close', SRC.own, 'call');
  const NEXT52 = K('NRR', 6, 'Nurture Recovery Rate', 'extra customers from 52 weeks of nurture ÷ customers the funnel made', 5, 10, 20, 'retain', SRC.plan);
  const pipe = (m) => [Object.assign({}, CSR, { flags: 'call' }), CLOSE(m)];
  // Each row: [label, count per sign-up, stage, formula]. In formulas {S} is the sign-ups, {ID} a KPI, {r:Label} an earlier row.
  const callRows = (rows, CB, v, f) => { const CH_ = CB * v.CSR; rows.push(['Calls booked', CB, 4, f], ['Calls held', CH_, 5, '{r:Calls booked} × {CSR}'], ['Customers', CH_ * v.CLOSE, 5, '{r:Calls held} × {CLOSE}']); return CH_ * v.CLOSE; };

  const FUNNELS = {
    webinar: {
      name: 'Webinar', tag: 'Live webinar, then calls or checkout', cadence: { per: 'webinar', perYear: 52 }, event: true, signup: 'Registrants', priority: 12,
      blurb: 'A weekly live session that teaches, proves and makes one offer.',
      kpis: [
        K('LP', 2, 'Registration Page Conversion', 'registrants ÷ cold page visits', 1, 3, 6, 'landing', SRC.own),
        K('SUR', 3, 'Show-Up Rate', 'live attendees ÷ registrants', 12, 18, 25, 'nurture', SRC.own),
        K('RWR', 3, 'Replay Watch Rate', 'replay viewers ÷ registrants who missed it live', 1, 3, 6, 'nurture', SRC.own),
        K('BR', 4, 'Booking Rate', 'calls booked ÷ live attendees', 3, 5, 7, 'convert', SRC.own, 'call'),
        K('RBR', 4, 'Replay Booking Rate', 'calls booked ÷ replay viewers', 1, 2, 4, 'convert', SRC.ext, 'call'),
        K('PUR', 4, 'Purchase Rate', 'buyers ÷ live attendees', 0.5, 1.5, 3, 'convert', SRC.ext, 'checkout'),
        ...pipe(), NEXT52
      ],
      refPrice: 997,
      run(v, call) {
        const A = v.SUR, RV = (1 - v.SUR) * v.RWR; const rows = [['Live attendees', A, 3, '{S} × {SUR}'], ['Replay viewers', RV, 3, '({S} − {r:Live attendees}) × {RWR}']];
        if (call) return { rows, cust: callRows(rows, A * v.BR + RV * v.RBR, v, '{r:Live attendees} × {BR} + {r:Replay viewers} × {RBR}') };
        const B = A * v.PUR + RV * v.PUR * 0.5; rows.push(['Customers', B, 4, '{r:Live attendees} × {PUR} + {r:Replay viewers} × {PUR} × 0.5']); return { rows, cust: B };
      }
    },
    rsp: {
      name: 'Reverse Squeeze Page', tag: 'Video first, opt-in second, then calls or checkout', cadence: { per: 'month', perYear: 12 }, signup: 'Half-watchers', priority: 12,
      blurb: 'An evergreen video page that teaches before it asks for an email.',
      kpis: [
        K('LP', 2, 'Half-Watch Rate', 'people who watch past halfway ÷ cold page visits', 5, 8, 12, 'landing', SRC.ext),
        K('OIR', 3, 'Opt-In Rate', 'half-watchers who give their email for part two ÷ half-watchers', 25, 35, 45, 'nurture', SRC.ext),
        K('P2R', 3, 'Part Two Watch Rate', 'opt-ins who watch part two ÷ opt-ins', 35, 45, 55, 'nurture', SRC.ext),
        K('BR', 4, 'Booking Rate', 'calls booked ÷ part two viewers', 8, 12, 18, 'convert', SRC.ext, 'call'),
        K('PUR', 4, 'Purchase Rate', 'buyers ÷ part two viewers', 1, 3, 5, 'convert', SRC.ext, 'checkout'),
        ...pipe(), NEXT52
      ],
      refPrice: 997,
      run(v, call) {
        const OI = v.OIR, P2 = OI * v.P2R; const rows = [['Opt-ins', OI, 3, '{S} × {OIR}'], ['Watched part two', P2, 3, '{r:Opt-ins} × {P2R}']];
        if (call) return { rows, cust: callRows(rows, P2 * v.BR, v, '{r:Watched part two} × {BR}') };
        rows.push(['Customers', P2 * v.PUR, 4, '{r:Watched part two} × {PUR}']); return { rows, cust: P2 * v.PUR };
      }
    },
    workshop: {
      name: 'Workshop Series', tag: 'Live multi-day workshop, then calls', cadence: { per: 'workshop', perYear: 12 }, event: true, signup: 'Registrants', priority: 4,
      blurb: 'A live workshop over two or three days; the people who stay a day and a half book.',
      kpis: [
        K('LP', 2, 'Registration Page Conversion', 'registrants ÷ cold page visits', 1, 3, 6, 'landing', SRC.own),
        K('DHR', 3, 'Day-and-a-Half Rate', 'registrants who attend 1.5 days or more ÷ registrants', 8, 12, 18, 'nurture', SRC.ext),
        K('BR', 4, 'Booking Rate', 'calls booked ÷ day-and-a-half attendees', 6, 9, 14, 'convert', SRC.ext, 'call'),
        K('PUR', 4, 'Purchase Rate', 'buyers ÷ day-and-a-half attendees', 2, 4, 7, 'convert', SRC.ext, 'checkout'),
        ...pipe(), NEXT52
      ],
      refPrice: 997,
      run(v, call) {
        const D = v.DHR; const rows = [['Day-and-a-half attendees', D, 3, '{S} × {DHR}']];
        if (call) return { rows, cust: callRows(rows, D * v.BR, v, '{r:Day-and-a-half attendees} × {BR}') };
        rows.push(['Customers', D * v.PUR, 4, '{r:Day-and-a-half attendees} × {PUR}']); return { rows, cust: D * v.PUR };
      }
    },
    ooo: {
      name: 'OOO Funnel', tag: 'Opt-in, low-ticket offer, one-click upsell', cadence: { per: 'month', perYear: 12 }, signup: 'Leads', priority: 0,
      blurb: 'A lead magnet, a low-ticket offer on the thank-you page and a one-click upsell.',
      kpis: [
        K('LP', 2, 'Opt-In Rate', 'leads ÷ cold page visits', 5, 10, 18, 'landing', SRC.fm),
        K('TW', 4, 'Offer Take Rate', 'low-ticket buyers ÷ leads', 1, 3, 6, 'convert', SRC.fm),
        K('UP', 4, 'Upsell Take Rate', 'upsell buyers ÷ low-ticket buyers', 5, 10, 15, 'convert', SRC.ext),
        K('PE', 4, 'Low-Ticket Price', 'price of the thank-you page offer', 27, 27, 27, 'convert', SRC.fm, '', 'usd'),
        K('PU', 4, 'Upsell Price', 'price of the one-click upsell', 297, 297, 297, 'convert', SRC.fm, '', 'usd'),
        K('ASC', 5, 'Ascension Rate', 'buyers who move to your main offer in 90 days ÷ low-ticket buyers', 0.5, 1.5, 3, 'close', SRC.ext),
        NEXT52
      ],
      run(v) {
        const B = v.TW, U = B * v.UP, M = B * v.ASC;
        return { rows: [['Low-ticket buyers', B, 4, '{S} × {TW}'], ['Upsell buyers', U, 4, '{r:Low-ticket buyers} × {UP}'], ['Main-offer customers', M, 5, '{r:Low-ticket buyers} × {ASC}']], cust: M, extra: B * v.PE + U * v.PU, extraF: '{r:Low-ticket buyers} × {PE} + {r:Upsell buyers} × {PU}' };
      }
    },
    slo: {
      name: 'SLO Funnel', tag: 'Self-liquidating offer: ads pay for themselves', cadence: { per: 'month', perYear: 12 }, signup: 'Front-end buyers', priority: 0, adsOnly: true,
      blurb: 'Paid ads sell a low-ticket offer that aims to cover the ad spend; the profit is in the backend.',
      kpis: [
        K('LP', 2, 'Offer Conversion Rate', 'front-end buyers ÷ offer page visits', 0.5, 1.2, 2.5, 'landing', SRC.fm),
        K('BUMP', 4, 'Order Bump Rate', 'buyers who add the bump ÷ buyers', 15, 25, 35, 'convert', SRC.ext),
        K('BACK', 4, 'Backend Offer Rate', 'backend buyers ÷ front-end buyers', 4, 8, 12, 'convert', SRC.fm),
        K('PE', 4, 'Front-End Price', 'price of the front-end offer', 37, 37, 37, 'convert', SRC.fm, '', 'usd'),
        K('PB', 4, 'Bump Price', 'price of the order bump', 17, 17, 17, 'convert', SRC.plan, '', 'usd'),
        K('PK', 4, 'Backend Price', 'price of the backend offer', 297, 297, 297, 'convert', SRC.fm, '', 'usd'),
        K('ASC', 5, 'Ascension Rate', 'buyers who move to your main offer in 90 days ÷ front-end buyers', 0.5, 1.5, 3, 'close', SRC.ext),
        NEXT52
      ],
      run(v) {
        const Bu = v.BUMP, Bk = v.BACK, M = v.ASC;
        return { rows: [['Order bumps', Bu, 4, '{S} × {BUMP}'], ['Backend buyers', Bk, 4, '{S} × {BACK}'], ['Main-offer customers', M, 5, '{S} × {ASC}']], cust: M, extra: v.PE + Bu * v.PB + Bk * v.PK, extraF: '{S} × {PE} + {r:Order bumps} × {PB} + {r:Backend buyers} × {PK}' };
      }
    },
    book: {
      name: 'Book a Call', tag: 'Application page, qualification, sales call', cadence: { per: 'month', perYear: 12 }, signup: 'Applications', priority: 2, callOnly: true,
      blurb: 'One page with one action: apply for a call, screened on budget, authority, need and timeline.',
      kpis: [
        K('LP', 2, 'Application Rate', 'applications ÷ cold page visits', 0.1, 0.2, 0.4, 'landing', SRC.ext),
        K('QR', 3, 'Qualification Rate', 'qualified calls booked ÷ applications', 40, 55, 70, 'nurture', SRC.fm),
        ...pipe(0.8), NEXT52
      ],
      run(v) { const rows = []; return { rows, cust: callRows(rows, v.QR, v, '{S} × {QR}') }; }
    },
    challenge: {
      name: 'Challenge', tag: 'Five to seven days of daily tasks, then the offer', cadence: { per: 'challenge', perYear: 6 }, event: true, signup: 'Registrants', priority: 2,
      blurb: 'A free challenge with one task a day; momentum sells the next step on the last day.',
      kpis: [
        K('LP', 2, 'Registration Page Conversion', 'registrants ÷ cold page visits', 1, 3, 6, 'landing', SRC.own),
        K('D1R', 3, 'Day 1 Attendance', 'day 1 attendees ÷ registrants', 15, 22, 30, 'nurture', SRC.ext),
        K('COMP', 3, 'Completion Rate', 'people who finish ÷ day 1 attendees', 25, 35, 45, 'nurture', SRC.ext),
        K('BR', 4, 'Booking Rate', 'calls booked ÷ people who finish', 6, 10, 15, 'convert', SRC.ext, 'call'),
        K('PUR', 4, 'Purchase Rate', 'buyers ÷ people who finish', 2, 4, 8, 'convert', SRC.ext, 'checkout'),
        ...pipe(), NEXT52
      ],
      refPrice: 297,
      run(v, call) {
        const D1 = v.D1R, C = D1 * v.COMP; const rows = [['Day 1 attendees', D1, 3, '{S} × {D1R}'], ['Finished the challenge', C, 3, '{r:Day 1 attendees} × {COMP}']];
        if (call) return { rows, cust: callRows(rows, C * v.BR, v, '{r:Finished the challenge} × {BR}') };
        rows.push(['Customers', C * v.PUR, 4, '{r:Finished the challenge} × {PUR}']); return { rows, cust: C * v.PUR };
      }
    },
    community: {
      name: 'Community', tag: 'Free community, premium upgrade, retention', cadence: { per: 'month', perYear: 12 }, signup: 'New members', priority: 0,
      blurb: 'Content brings people into a free community; active members upgrade or book a call.',
      kpis: [
        K('LP', 2, 'Join Rate', 'new members ÷ cold join page visits', 3, 6, 10, 'landing', SRC.fm),
        K('ACT', 3, 'Active Member Rate', 'members active in a month ÷ members', 25, 40, 55, 'nurture', SRC.fm),
        K('UPG', 4, 'Upgrade Rate', 'paid members ÷ active members', 1, 2.5, 4, 'convert', SRC.ext, 'checkout'),
        K('BKR', 4, 'Booking Rate', 'calls booked ÷ active members', 0.5, 1.5, 3, 'convert', SRC.ext, 'call'),
        ...pipe(), NEXT52
      ],
      refPrice: 47, refMonthly: true,
      run(v, call) {
        const A = v.ACT; const rows = [['Active members', A, 3, '{S} × {ACT}']];
        if (call) return { rows, cust: callRows(rows, A * v.BKR, v, '{r:Active members} × {BKR}') };
        rows.push(['Paid members', A * v.UPG, 4, '{r:Active members} × {UPG}']); return { rows, cust: A * v.UPG };
      }
    },
    social: {
      name: 'Social Following', tag: 'Value posts, offer posts, DMs, calls', cadence: { per: 'month', perYear: 12 }, signup: 'Commenters', priority: 0, callOnly: true, organic: true,
      blurb: 'Daily value posts build trust; offer posts turn comments into DM conversations and calls.',
      kpis: [
        K('LP', 2, 'Comment Rate', 'commenters ÷ people who see an offer post', 0.5, 1.5, 3, 'landing', SRC.fm),
        K('DMR', 3, 'Conversation Rate', 'DM conversations ÷ commenters', 30, 40, 50, 'nurture', SRC.ext),
        K('BKR', 4, 'Booking Rate', 'calls booked ÷ DM conversations', 10, 20, 30, 'convert', SRC.fm),
        ...pipe(1.2), NEXT52
      ],
      run(v) { const D = v.DMR; const rows = [['DM conversations', D, 3, '{S} × {DMR}']]; return { rows, cust: callRows(rows, D * v.BKR, v, '{r:DM conversations} × {BKR}') }; }
    },
    launch: {
      name: 'Product Launch', tag: 'Three-video series, open cart, close', cadence: { per: 'launch', perYear: 3 }, event: true, signup: 'Launch registrants', priority: 0,
      blurb: 'A free three-video series builds the case, then a short open cart sells the offer.',
      kpis: [
        K('LP', 2, 'Opt-In Rate', 'launch registrants ÷ cold page visits', 3, 7, 12, 'landing', SRC.fm),
        K('V1R', 3, 'Video 1 View Rate', 'video 1 viewers ÷ registrants', 30, 45, 60, 'nurture', SRC.fm),
        K('V3R', 3, 'Video 3 Retention', 'video 3 viewers ÷ video 1 viewers', 35, 50, 65, 'nurture', SRC.fm),
        K('BUY', 4, 'Cart Conversion', 'buyers ÷ video 3 viewers', 1, 2.5, 5, 'convert', SRC.ext, 'checkout'),
        K('BR', 4, 'Booking Rate', 'calls booked ÷ video 3 viewers', 2, 4, 7, 'convert', SRC.ext, 'call'),
        ...pipe(), NEXT52
      ],
      refPrice: 997,
      run(v, call) {
        const V1 = v.V1R, V3 = V1 * v.V3R; const rows = [['Watched video 1', V1, 3, '{S} × {V1R}'], ['Watched video 3', V3, 3, '{r:Watched video 1} × {V3R}']];
        if (call) return { rows, cust: callRows(rows, V3 * v.BR, v, '{r:Watched video 3} × {BR}') };
        rows.push(['Customers', V3 * v.BUY, 4, '{r:Watched video 3} × {BUY}']); return { rows, cust: V3 * v.BUY };
      }
    }
  };
  const ORDER = ['webinar', 'rsp', 'workshop', 'ooo', 'slo', 'book', 'challenge', 'community', 'social', 'launch'];
  const STAGES = { 1: 'Traffic', 2: 'Landing and sign-up', 3: 'Nurture', 4: 'Conversion', 5: 'Revenue and pipeline', 6: 'The next 52 weeks' };

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const num = (x, d = 0) => { const n = Number(x); return isFinite(n) && n >= 0 ? n : d; };
  const idx = (x, max) => clamp(Math.round(num(x, 0)), 0, max);

  function normalise(a) {
    a = a || {};
    const opt = (k, d) => (OPTIONS[k].some((o) => o[0] === a[k]) ? a[k] : d);
    return {
      offer_type: opt('offer_type', 'consulting'), market: opt('market', 'b2b'),
      price: num(a.price, 5000) || 5000, price_model: opt('price_model', 'one_time'), entry_price: num(a.entry_price, 0),
      motion: opt('motion', 'call'),
      revenue_now: idx(a.revenue_now, 6), goal: num(a.goal, 0),
      revenue_built: idx(a.revenue_built, 6), years: idx(a.years, 4),
      clients: idx(a.clients, 4), case_studies: idx(a.case_studies, 4), brands: idx(a.brands, 2),
      funnel_exp: idx(a.funnel_exp, 3), funnels_built: Array.isArray(a.funnels_built) ? a.funnels_built.filter((x) => OPTIONS.funnels_built.some((o) => o[0] === x)) : [], revops: idx(a.revops, 3),
      email_list: num(a.email_list), followers: num(a.followers), youtube: num(a.youtube), community: num(a.community), site: num(a.site),
      channels: Array.isArray(a.channels) ? a.channels.filter((x) => CH[x]) : [], ad_budget: num(a.ad_budget), hours: idx(a.hours, 3), team_help: idx(a.team_help, 3),
      funnel: FUNNELS[a.funnel] ? a.funnel : null
    };
  }

  const runRate = (a) => REV_NOW_MID[a.revenue_now];
  /* Blank goal: new revenue equal to today's yearly run rate (revenue doubles), at least $120,000. */
  const goalOf = (a) => a.goal > 0 ? a.goal : Math.max(120000, Math.round(runRate(a) * 12 / 10000) * 10000);

  function profile(a) {
    const proof = 0.45 * a.case_studies / 4 + 0.35 * a.clients / 4 + 0.2 * a.brands / 2;
    const exp = 0.6 * a.funnel_exp / 3 + 0.4 * a.revops / 3;
    const sales = 0.55 * a.revenue_built / 6 + 0.25 * a.revenue_now / 6 + 0.2 * a.years / 4;
    const reach = a.email_list + a.followers / 4 + a.youtube / 2 + a.community * 2 + a.site / 2;
    const warm = clamp(Math.log10(1 + reach) / 5, 0, 1);
    const cap = 0.6 * a.hours / 3 + 0.4 * a.team_help / 3;
    return { proof, exp, sales, warm, cap, reach };
  }
  const LEVER = {
    landing: (p) => 0.45 * p.proof + 0.3 * p.warm + 0.25 * p.exp,
    nurture: (p) => 0.55 * p.exp + 0.25 * p.warm + 0.2 * p.cap,
    convert: (p) => 0.45 * p.proof + 0.25 * p.exp + 0.3 * p.warm,
    close: (p) => 0.45 * p.sales + 0.4 * p.proof + 0.15 * p.exp,
    retain: (p) => 0.5 * p.exp + 0.3 * p.proof + 0.2 * p.cap
  };
  // 0.1 at a cold start, 0.8 at the best profile: conservative by design, never the top of a range.
  const position = (k, prof) => 0.1 + 0.7 * clamp(LEVER[k.lever](prof), 0, 1);
  const inRange = (k, pos) => (pos < 0.5 ? k.lo + (k.ty - k.lo) * (pos / 0.5) : k.ty + (k.hi - k.ty) * ((pos - 0.5) / 0.5));

  function isCall(f, a) {
    if (FUNNELS[f].callOnly) return true;
    if (a.motion === 'call') return true;
    if (a.motion === 'checkout') return false;
    return value12(a) >= 2000;
  }

  /* Price bands. Close rates come from our data: about 6% of booked calls close at $5,000 to $10,000 and about 39%
     at $2,000, so the whole close range scales with price. Buy-online rates fall as the price rises above the
     funnel's reference price. The range itself is scaled, so a KPI is still never placed outside it. */
  function scaleOf(k, f, a) {
    const v = value12(a);
    if (k.id === 'CLOSE') return v < 2500 ? 3 : v < 5000 ? 1.8 : v <= 15000 ? 1 : 0.75;
    if (k.flags === 'checkout' && FUNNELS[f].refPrice) {
      const cmp = FUNNELS[f].refMonthly && a.price_model === 'monthly' ? a.price : v;
      return clamp(Math.pow(FUNNELS[f].refPrice / Math.max(1, cmp), 0.3), 0.4, 1.6);
    }
    return 1;
  }

  function churnOf(a) { const p = profile(a); return 0.09 - 0.05 * clamp(LEVER.retain(p), 0, 1); }
  function monthsPaid12(c) { let t = 0; for (let s = 0; s < 12; s++) { for (let m = 0; m < 12 - s; m++) t += Math.pow(1 - c, m); } return t / 12; }
  function value12(a) { return a.price_model === 'monthly' ? a.price * monthsPaid12(churnOf(a)) : a.price; }

  function recommend(raw) {
    const a = normalise(raw), p = profile(a), v = value12(a), price = a.price;
    const hi = price >= 2000 || (a.price_model === 'monthly' && price >= 500);
    const low = v < 300;
    const has = (c) => a.channels.includes(c);
    const outbound = has('cold_email') || has('linkedin') || has('calendar') || has('whatsapp');
    const list = a.email_list, foll = a.followers + a.youtube;
    const out = ORDER.map((id) => {
      const f = FUNNELS[id]; let s = 50 + f.priority; const why = []; const warn = [];
      const add = (n, t) => { s += n; if (t) (n > 0 ? why : warn).push(t); };
      switch (id) {
        case 'webinar':
          if (hi) add(14, 'Your price suits a live session that earns a sales call');
          if (a.market !== 'b2c') add(8, 'B2B buyers attend live sessions to learn before they buy');
          if (outbound || has('ads')) add(8, 'Your outreach channels can fill a weekly registration page');
          if (a.case_studies >= 1) add(4, 'You have case studies to show live');
          if (a.hours === 0) add(-8, 'A weekly live session needs at least 5 hours a week');
          if (low && a.motion === 'checkout') add(-10, 'Low-priced offers rarely need an hour-long session');
          break;
        case 'rsp':
          if (price >= 1000) add(12, 'A video that teaches first warms buyers for a higher-priced offer');
          if (a.hours <= 1) add(10, 'Record once and it sells every day, with little time each week');
          if (has('ads') || a.ad_budget >= 1000) add(8, 'Paid traffic can go straight to the video');
          if (a.case_studies >= 1) add(4, 'Proof inside the video lifts the booking rate');
          break;
        case 'workshop':
          if (hi && (a.offer_type === 'coaching' || a.offer_type === 'consulting' || a.offer_type === 'software')) add(10, 'A multi-day workshop proves your method before the call');
          if (a.case_studies <= 1) add(6, 'Few case studies yet: a live workshop lets people see results happen');
          if (a.hours >= 2) add(6, 'You have the hours to run it live');
          if (a.hours === 0) add(-12, 'Two or three live days need more time than you have now');
          break;
        case 'ooo':
          if (price < 100 || a.entry_price > 0) add(16, 'You have, or can make, a low-ticket entry offer');
          if (a.offer_type === 'course' || a.offer_type === 'product') add(10, 'Digital products sell well on a thank-you page');
          if (a.ad_budget >= 500) add(6, 'A small ad budget is enough to test it');
          if (hi && !a.entry_price) add(-14, 'You would need to create a low-ticket offer first');
          if (a.ad_budget < 300 && p.reach < 2000) add(-8, 'It needs steady traffic: ads or an audience');
          break;
        case 'slo':
          if (a.ad_budget >= 2000) add(16, 'Your ad budget can buy traffic every day');
          else add(-18, 'It runs on paid ads: plan for $2,000 a month or more');
          if (a.entry_price > 0 && a.entry_price <= 100) add(10, 'Your entry offer is in the self-liquidating price range');
          if (a.offer_type === 'course' || a.offer_type === 'product') add(8, 'Low-ticket digital offers liquidate ad spend best');
          if (hi && !a.entry_price) add(-8, 'You would need a $7 to $97 offer in front of your main one');
          break;
        case 'book':
          if (price >= 3000 && a.motion !== 'checkout') add(16, 'High-ticket, call-based sales: one page that books qualified calls');
          if (a.offer_type === 'service' || a.offer_type === 'consulting') add(10, 'Services and consulting are sold on calls');
          if (a.case_studies >= 2) add(8, 'Your case studies can carry a short booking page');
          if (a.hours <= 1) add(6, 'The quickest funnel to build and run');
          if (a.motion === 'checkout' && price < 500) add(-18, 'A call is too much effort for this price');
          if (a.case_studies === 0) add(-6, 'Without case studies the booking page has to work harder');
          break;
        case 'challenge':
          if (a.offer_type === 'coaching' || a.offer_type === 'course') add(12, 'Coaching and courses fit a challenge with daily tasks');
          if (list + foll >= 2000) add(10, 'Your audience can fill a challenge');
          if (a.hours >= 2) add(8, 'You have the hours to run it live');
          if (a.case_studies <= 1) add(6, 'People who finish become your next case studies');
          if (a.hours === 0) add(-12, 'Five to seven live days need more time than you have now');
          break;
        case 'community':
          if (a.price_model === 'monthly' && price <= 300 && (a.offer_type === 'coaching' || a.offer_type === 'course')) add(18, 'A monthly membership is what a community sells');
          if (a.community >= 200 || a.followers >= 5000) add(10, 'You already have people to bring into it');
          if (a.offer_type === 'coaching' || a.offer_type === 'course') add(6, 'Coaching and courses keep members engaged');
          if (a.hours >= 2) add(6, 'You have the hours to keep it active');
          if (a.hours === 0) add(-14, 'A community needs someone in it every week');
          break;
        case 'social':
          if (a.followers >= 5000) add(18, 'Your following is large enough to turn posts into calls');
          else if (a.followers >= 1000) add(6, 'Your following can start it; it grows as you post');
          if (a.offer_type === 'coaching' || a.offer_type === 'service' || a.offer_type === 'consulting') add(8, 'Personal brands sell services in DMs');
          if (price >= 1000) add(6, 'Your price justifies a call from a DM');
          if (a.followers < 1000 && !has('content')) add(-18, 'It needs an active social audience');
          if (a.motion === 'checkout' && price < 500) add(-16, 'It ends in a sales call, which is too much effort for this price');
          break;
        case 'launch':
          if (list >= 5000) add(18, 'Your list is large enough for a launch');
          else if (list >= 1000) add(6, 'Your list can run a small launch');
          if (a.offer_type === 'course' || a.offer_type === 'product') add(10, 'Launches suit courses and products');
          if (v >= 300 && v <= 3000) add(6, 'Your price sits in the launch sweet spot');
          if (list < 1000 && a.followers < 5000) add(-18, 'A launch needs a list or following first');
          break;
      }
      if (a.funnels_built.includes(id === 'book' ? 'book' : id)) add(4, 'You have built this type before');
      return { id, name: f.name, tag: f.tag, fit: clamp(Math.round(s), 5, 98), why: why.slice(0, 3), warn: warn.slice(0, 2) };
    });
    out.sort((x, y) => y.fit - x.fit || ORDER.indexOf(x.id) - ORDER.indexOf(y.id));
    out.forEach((r, i) => { r.rank = i + 1; r.recommended = i < 3; });
    return out;
  }

  /* Enterprise fit score for the sales team (A, B or C). Rides along with the survey payload. */
  function leadScore(raw) {
    const a = normalise(raw); let s = 0;
    if (a.price >= 2000 || a.price_model !== 'one_time' && a.price >= 1000) s += 2;
    if (a.revenue_now >= 2) s += 2; else if (a.revenue_now >= 1) s += 1;
    if (goalOf(a) >= 250000) s += 1;
    if (a.market !== 'b2c') s += 1;
    if (a.case_studies >= 1) s += 1;
    if (a.ad_budget >= 2000 || a.team_help >= 1) s += 1;
    if (a.revops <= 1) s += 1; // the gap Tantra Enterprise fills
    return { score: s, tier: s >= 7 ? 'A' : s >= 4 ? 'B' : 'C' };
  }

  /* ---------- The plan ----------
     opts: over (typed-over KPI values, in the units shown), goal, call, price, price_model, mix ({channel: share %}). */
  function plan(fid, raw, opts = {}) {
    const a = normalise(raw); if (opts.price > 0) a.price = opts.price; if (opts.price_model) a.price_model = opts.price_model;
    const f = FUNNELS[fid]; const prof = profile(a);
    const call = f.callOnly ? true : opts.call != null ? !!opts.call : isCall(fid, a);
    const goal = opts.goal > 0 ? opts.goal : goalOf(a);
    const over = opts.over || {};
    const used = f.organic ? [] : f.adsOnly ? ['ads'] : a.channels.slice();

    const chK = used.map((c) => {
      const base = f.event && CH[c].ev ? CH[c].ev : CH[c].pg;
      const k = Object.assign({}, base, { channel: c });
      if (k.id === 'CPC' && a.market === 'b2c') { k.lo = k.ty = k.hi = 0.75; }
      return k;
    });
    const list = chK.concat(f.kpis.filter((k) => !(k.flags === 'call' && !call) && !(k.flags === 'checkout' && call)));
    const kpis = list.map((k0) => {
      const s = scaleOf(k0, fid, a);
      const k = Object.assign({}, k0, { lo: +(k0.lo * s).toFixed(2), ty: +(k0.ty * s).toFixed(2), hi: +(k0.hi * s).toFixed(2) });
      if (k.id === 'PE' && a.entry_price > 0) k.lo = k.ty = k.hi = a.entry_price;
      // Benchmarks typed over on the plan replace the range (kept in order); the KPI is then placed inside the new range.
      k.blo = k.lo; k.bty = k.ty; k.bhi = k.hi;
      const b = (opts.bench || {})[k.id];
      if (b) { const xs = [b.lo, b.ty, b.hi].map((x, i) => (x != null && isFinite(x) && x >= 0 ? +x : [k.lo, k.ty, k.hi][i])).sort((p, q) => p - q); k.lo = xs[0]; k.ty = xs[1]; k.hi = xs[2]; k.benched = true; }
      const planned = k.fmt === 'usd' ? k.ty : clamp(inRange(k, position(k, prof)), k.lo, k.hi);
      const value = over[k.id] != null && isFinite(over[k.id]) ? Math.max(0, over[k.id]) : planned;
      return Object.assign(k, { planned, value, over: over[k.id] != null });
    });
    const v = {}; kpis.forEach((k) => { v[k.id] = k.fmt === 'usd' ? k.value : Math.min(1, k.value / 100); });

    const r = f.run(v, call);
    const val12 = value12(a);
    const revPerSignup = r.cust * val12 + (r.extra || 0);
    const cycles = f.cadence.perYear;
    const perCycle = revPerSignup > 0 ? goal / cycles / revPerSignup : 0;
    const need = perCycle * cycles / 12; // sign-ups a month

    // Traffic: the audience you own first (warm), then the channels picked, split by share; the ad budget is a ceiling.
    const lines = []; let gap = 0, adSpend = 0, budgetShort = 0, coldVisits = 0, ownedSignups = 0;
    if (f.organic) {
      const viewers = v.LP > 0 ? need / v.LP : 0;
      lines.push({ id: 'content', name: 'Your posts', signups: need, reach: viewers * 10, unit: 'people reached by your posts', visits: viewers });
      coldVisits = viewers;
    } else {
      if (!f.adsOnly) {
        const warmRate = Math.min(0.6, v.LP * WARM);
        const avail = Object.keys(OWNED).reduce((t, k) => t + a[k] * OWNED[k].per, 0) * warmRate;
        ownedSignups = Math.min(need, avail);
        if (ownedSignups > 0) lines.push({ id: 'owned', name: 'The audience you own', signups: ownedSignups, reach: ownedSignups / Math.max(warmRate, 1e-9), unit: 'visits from your list and followers', warm: true });
      }
      let rest = need - ownedSignups;
      // Split: a typed mix (shares of what the owned audience does not cover) or the default. Default: the ad budget
      // buys what it can, the rest goes by channel weight (calendar invites carry most of it, as in our own funnels).
      const mix = opts.mix || null, ai = used.indexOf('ads');
      let alloc = used.map(() => 0);
      if (mix) {
        const sh = used.map((c) => Math.max(0, mix[c] != null ? mix[c] : 0)); const tot = sh.reduce((x, y) => x + y, 0) || 1;
        alloc = sh.map((x) => rest * x / tot);
      } else {
        if (ai > -1 && a.ad_budget > 0 && !f.adsOnly && used.length > 1) { alloc[ai] = Math.min(rest, a.ad_budget / (v.CPC / 0.85) * v.LP); }
        const left = rest - alloc[ai > -1 ? ai : 0] * (ai > -1 ? 1 : 0);
        const ws = used.map((c, i) => (i === ai && alloc[ai] > 0) ? 0 : CH[c].w); const wt = ws.reduce((x, y) => x + y, 0);
        if (wt > 0) ws.forEach((w, i) => { alloc[i] += left * w / wt; });
      }
      if (ai > -1 && !f.adsOnly && a.ad_budget > 0 && mix) {
        const cap = a.ad_budget / (v.CPC / 0.85) * v.LP;
        if (alloc[ai] > cap * 1.001) budgetShort = (alloc[ai] - cap) / v.LP * v.CPC / 0.85;
      }
      if (!used.length) gap += rest;
      const share = (i) => rest > 0 ? alloc[i] / rest * 100 : 0;
      used.forEach((c, i) => {
        const s = alloc[i], k = kpis.find((x) => x.channel === c);
        if (f.event && CH[c].ev) { lines.push({ id: c, name: CH[c].name, signups: s, share: share(i), reach: v[k.id] > 0 ? s / v[k.id] : 0, unit: CH[c].unit + ' to send' }); return; }
        const visits = v.LP > 0 ? s / v.LP : 0; coldVisits += visits;
        if (k.id === 'CPC') { const spend = visits * v.CPC / 0.85; adSpend += spend; lines.push({ id: c, name: CH[c].name, signups: s, share: share(i), reach: spend, unit: 'ad spend', money: true, visits }); return; }
        lines.push({ id: c, name: CH[c].name, signups: s, share: share(i), reach: k.value > 0 ? visits / v[k.id] : 0, unit: CH[c].unit + ' to send', visits });
      });
      if (f.adsOnly && a.ad_budget > 0 && adSpend > a.ad_budget * 1.01) budgetShort = adSpend - a.ad_budget;
    }
    const m = (x) => x * need;
    const rows = r.rows.map(([label, n, stage, formula]) => ({ label, n: m(n), stage, formula }));
    const custMonth = m(r.cust);
    return {
      funnel: fid, name: f.name, call, a, goal, cycles, cadence: f.cadence, signup: f.signup, kpis, lines, rows,
      perSignup: { cust: r.cust, extra: r.extra || 0, rev: revPerSignup }, extraF: r.extraF || null, event: !!f.event, organic: !!f.organic,
      signupsMonth: need, coldVisits, perCycle, custMonth, cust12: custMonth * 12,
      revMonth: goal / 12, rev12: revPerSignup > 0 ? goal : 0, value12: val12, extra12: (r.extra || 0) * need * 12,
      adSpend, gap, budgetShort, unreachable: !(revPerSignup > 0), later: custMonth * 12 * (v.NRR || 0),
      churn: a.price_model === 'monthly' ? churnOf(a) : null
    };
  }

  const api = { SRC, OPTIONS, CH, OWNED, FUNNELS, ORDER, STAGES, normalise, profile, recommend, leadScore, plan, goalOf, value12, monthsPaid12 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TantraPlan = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
