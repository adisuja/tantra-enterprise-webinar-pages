/* Tantra Revenue Plan model. One file, no DOM: the thank-you survey uses it to rank funnels, the calculator uses it to
   build the plan. Also loads in Node for the checks (node plan-check.mjs).

   Every funnel runs on the six FunnelOS stages of the playbook (Traffic, Landing and Sign-Up, Nurture, Conversion,
   Revenue and Pipeline, The Next 52 Weeks). Each KPI carries a low, typical and strong value and the source of that
   range (deliverables/14-thank-you-survey/research/KPI_BENCHMARKS.md). Where no public source exists the range is the
   Funnel Master diagram's own figure or a planning figure, and it says so. The survey answers move each KPI inside
   its range (never outside it): proof, experience, warm audience and sales track record each push the planning value
   from low towards strong. Rates are stored as percentages. */
(function (root) {
  'use strict';

  /* ---------- Sources (short labels shown under each KPI) ---------- */
  const B = (s) => s + ' (self-reported; treat as a planning assumption)';
  const SRC = {
    webReg: B('Webinar registration benchmarks 2025 to 2026 (AssetAcademy, BeKnownOnline)'),
    livestorm: 'Livestorm 2026 report: 47.7% show-up across 33,786 sessions',
    replay: B('Replay watch among no-shows: practitioner estimate (Lilach Bullock)'),
    htAttend: B('High-ticket webinar purchase rates (ClickMeeting via DollarPocket 2026)'),
    callShow: 'Call show rates (RevenueHero 6,428 meetings; CashflowCoaches 2026)',
    htClose: B('High-ticket call close rates (LeadsNow 2026, 50,769 booked calls)'),
    b2bClose: 'B2B close rates (HubSpot; First Page Sage)',
    vsl: B('VSL benchmarks (Focus Digital 2026: 44% average watched; VSLStats)'),
    vslApp: B('VSL application rates (Inflo Partners)'),
    optin: 'Opt-in benchmarks (Unbounce 2024; lead magnet funnels)',
    tripwire: B('Tripwire and upsell take rates (CartFlows; WinMassiveImpact)'),
    ascend: B('Backend ascension of low-ticket buyers (WinMassiveImpact; LTO Ads)'),
    metaAds: 'Meta B2B ads 2025 (Metadata.io; WordStream)',
    appPage: B('Application page rates (Unbounce professional services; Inflo Partners)'),
    challenge: B('Challenge benchmarks 2026 (ScaleForImpact; Communipass)'),
    community: B('Community conversion and churn (AdvLaunch; Kourses; SkoolFiles)'),
    linkedinEng: 'LinkedIn engagement 2025 (Socialinsider)',
    dm: B('Comment to DM and DM to meeting rates (SBL; CClarity)'),
    launch: B('Launch conversion (Denise Duffield-Thomas launch review; Jeff Walker)'),
    coldEmail: 'Cold email 2025 to 2026 (Instantly; Woodpecker)',
    linkedin: 'LinkedIn outreach 2026 (Expandi, 13.2M requests)',
    mailchimp: 'Email marketing benchmarks (Mailchimp)',
    fmOOO: 'Funnel Master OOO diagram (30% opt-in, 10% buy, 20% upsell)',
    fmSLO: 'Funnel Master SLO diagram (5% buy, 20% backend)',
    fmBook: 'Funnel Master Book a Call diagram (8% apply, 60% qualify, 80% show, 45% close)',
    fmChallenge: 'Funnel Master Challenge diagram (90% day 1, 50% complete, 20% buy)',
    fmCommunity: 'Funnel Master Community diagram (15% join, 60% active, 8% premium, 85% retained)',
    fmSocial: 'Funnel Master Social Following diagram (5% comment, 40% book, 50% close)',
    fmLaunch: 'Funnel Master Product Launch diagram (40% opt-in, 90%, 85%, 80% video views)',
    plan: 'Planning figure: no public benchmark found. Replace it with your own number once you have it',
    equations: 'The RevOps Funnel Equations (planning figures)'
  };

  /* ---------- Survey options (indexes are stored in the answers) ---------- */
  const OPTIONS = {
    offer_type: [['service', 'Done-for-you service or agency'], ['consulting', 'Consulting or advisory'], ['coaching', 'Coaching, training or a programme'], ['course', 'Course, membership or digital product'], ['software', 'Software (SaaS)'], ['product', 'Physical or other product']],
    market: [['b2b', 'Businesses (B2B)'], ['b2c', 'Consumers (B2C)'], ['both', 'Both']],
    price_model: [['one_time', 'One-time payment'], ['monthly', 'Monthly subscription or retainer'], ['annual', 'Annual contract']],
    motion: [['call', 'After a sales call'], ['checkout', 'They buy online without a call'], ['both', 'Both, depending on the offer']],
    cycle: [['days', 'Within a few days'], ['weeks', 'Within 2 to 6 weeks'], ['months', 'It takes 2 months or more']],
    revenue_now: ['Pre-revenue', 'Under $10K', '$10K to $50K', '$50K to $100K', '$100K to $250K', '$250K to $1M', 'Over $1M'],
    revenue_built: ['Nothing yet', 'Under $100K', '$100K to $500K', '$500K to $1M', '$1M to $5M', '$5M to $10M', 'Over $10M'],
    team_led: ['Just me', '2 to 10 people', '11 to 50 people', '51 to 250 people', 'More than 250 people'],
    years: ['Under 1 year', '1 to 3 years', '3 to 5 years', '5 to 10 years', 'Over 10 years'],
    clients: ['None yet', '1 to 5', '6 to 20', '21 to 100', 'More than 100'],
    case_studies: ['None yet', '1 or 2', '3 to 5', '6 to 10', 'More than 10'],
    brands: ['No well-known names yet', 'A few recognisable clients', 'Well-known brands I can name'],
    funnel_exp: ['I have never built a funnel', 'I built one, it did not work', 'I have one funnel that works', 'I run several profitable funnels'],
    revops: ['No system yet', 'Spreadsheets and inbox', 'A CRM with a pipeline', 'CRM plus automated follow-up and reporting'],
    hours: ['Under 5 hours a week', '5 to 10 hours a week', '10 to 20 hours a week', 'More than 20 hours a week'],
    team_help: ['Just me', '1 or 2 people', '3 to 10 people', 'More than 10 people'],
    channels: [['cold_email', 'Cold email'], ['linkedin', 'LinkedIn outreach'], ['calendar', 'Calendar invites'], ['whatsapp', 'WhatsApp outreach'], ['ads', 'Paid ads'], ['content', 'Organic content (posts, video, SEO)'], ['partners', 'Partners and referrals']],
    funnels_built: [['webinar', 'Webinar'], ['rsp', 'Video sales letter'], ['workshop', 'Workshop'], ['ooo', 'Lead magnet and low-ticket offer'], ['book', 'Book a call'], ['challenge', 'Challenge'], ['community', 'Community'], ['launch', 'Product launch']]
  };
  const REV_NOW_MID = [0, 5000, 30000, 75000, 175000, 600000, 1500000]; // monthly revenue, middle of each band

  /* ---------- Traffic channels: how many page visits one unit of reach gives (per month) ---------- */
  const CHANNELS = {
    cold_email: { name: 'Cold email', unit: 'emails sent', cap: 1000, capUnit: 'sending inboxes at about 50 emails a day', capSrc: 'deliverability practice: 30 to 50 cold emails a day per inbox (planning figure)', vr: 0.97 * (0.27 * 0.02 + 0.0343 * 0.5) * 0.9, how: 'delivered 97% × (opened 27% and clicked 2%, plus replied 3.43% and asked for the link 50%) × page loads 90%', src: SRC.coldEmail + '; click and interested shares are planning figures' },
    linkedin: { name: 'LinkedIn outreach', unit: 'connection requests', cap: 400, capUnit: 'LinkedIn accounts at about 100 requests a week', capSrc: 'LinkedIn weekly invitation limit, about 100 (planning figure)', vr: 0.285 * 0.9 * 0.08 * 0.9, how: 'accepted 28.5% × messaged 90% × clicked 8% × page loads 90%', src: SRC.linkedin + '; click rate is a planning figure' },
    calendar: { name: 'Calendar invites', unit: 'invites sent', vr: 0.98 * 0.015 * 0.9, how: 'delivered 98% × clicked 1.5% × page loads 90%', src: SRC.equations },
    whatsapp: { name: 'WhatsApp outreach', unit: 'messages sent', vr: 0.95 * 0.85 * 0.05 * 0.9, how: 'delivered 95% × read 85% × clicked 5% × page loads 90%', src: SRC.equations },
    ads: { name: 'Paid ads', unit: 'ad spend', cpv: 1.95 / 0.85, how: '$1.95 a click (Meta B2B) ÷ 85% of clicks that load the page', src: SRC.metaAds },
    ads_b2c: { name: 'Paid ads', unit: 'ad spend', cpv: 0.75 / 0.85, how: '$0.75 a click (Meta, all industries) ÷ 85% of clicks that load the page', src: SRC.metaAds },
    content: { name: 'Organic content', unit: 'post impressions', vr: 0.015 * 0.9, how: 'link clicks 1.5% of impressions × page loads 90%', src: SRC.linkedinEng + '; link click rate is a planning figure' },
    partners: { name: 'Partners and referrals', unit: 'partner audience reached', vr: 0.02, how: 'about 2% of a partner’s audience visits from one mailing', src: SRC.plan }
  };
  // Audience you own: page visits a month it gives with no outreach.
  const OWNED = {
    email_list: { name: 'Your email list', per: 2 * 0.97 * 0.327 * 0.026 * 0.9, how: '2 promotional sends a month × delivered 97% × opened 32.7% × clicked 2.6% × page loads 90%', src: SRC.mailchimp },
    followers: { name: 'Your social following', per: 12 * 0.05 * 0.015 * 0.9, how: '12 posts a month × 5% of followers reached × 1.5% click × page loads 90%', src: SRC.plan },
    youtube: { name: 'Your YouTube channel', per: 4 * 0.1 * 0.02 * 0.9, how: '4 videos a month × 10% of subscribers watch × 2% click the link × 90%', src: SRC.plan },
    community: { name: 'Your community or WhatsApp group', per: 2 * 0.6 * 0.05 * 0.9, how: '2 posts a month × 60% read × 5% click × 90%', src: SRC.plan },
    site: { name: 'Your website visitors', per: 0.02, how: '2% of monthly site visitors click through to the funnel', src: SRC.plan }
  };

  /* ---------- Funnels ----------
     Each KPI: [id, stage, name, definition, low, typical, strong, lever, source, flags]
     lever decides which part of the profile moves it: landing, nurture, convert, close, retain.
     flags: 'call' (only for a call offer), 'checkout' (only for a buy-online offer), 'inv' (lower is better). */
  const K = (id, stage, name, def, lo, ty, hi, lever, src, flags = '') => ({ id, stage, name, def, lo, ty, hi, lever, src, flags });

  const PIPE = (closeLo = 12, closeTy = 22, closeHi = 35, src = SRC.htClose) => [
    K('CSR', 5, 'Call Show Rate', 'calls held ÷ calls booked', 55, 70, 84, 'nurture', SRC.callShow, 'call'),
    K('CLOSE', 5, 'Close Rate', 'customers ÷ calls held', closeLo, closeTy, closeHi, 'close', src, 'call')
  ];
  const NEXT52 = K('NRR', 6, 'Nurture Recovery Rate', 'customers the 52 weeks of nurture add ÷ customers the funnel made the first time', 10, 20, 35, 'retain', SRC.plan);

  const FUNNELS = {
    webinar: {
      name: 'Webinar', tag: 'Live webinar, then calls or checkout', cadence: { label: 'webinar', per: 'week', perYear: 52 }, entry: 'registration page visits', priority: 12,
      blurb: 'A weekly live session that teaches, proves and makes one offer. Attendees book a call (or buy) live and from the replay.',
      kpis: [
        K('RR', 2, 'Registration Rate', 'registrants ÷ page visits', 12, 25, 40, 'landing', SRC.webReg),
        K('SUR', 3, 'Show-Up Rate', 'live attendees ÷ registrants', 30, 45, 57, 'nurture', SRC.livestorm),
        K('RWR', 3, 'Replay Watch Rate', 'replay viewers ÷ registrants who missed it live', 10, 20, 25, 'nurture', SRC.replay),
        K('BR', 4, 'Booking Rate', 'calls booked ÷ live attendees', 3, 8, 15, 'convert', SRC.plan, 'call'),
        K('RBR', 4, 'Replay Booking Rate', 'calls booked ÷ replay viewers', 1, 3, 5, 'convert', SRC.plan, 'call'),
        K('PUR', 4, 'Purchase Rate', 'buyers ÷ live attendees', 0.5, 2, 5, 'convert', SRC.htAttend, 'checkout'),
        K('RPUR', 4, 'Replay Purchase Rate', 'buyers ÷ replay viewers', 0.5, 1.5, 3, 'convert', SRC.htAttend, 'checkout'),
        ...PIPE(), NEXT52
      ],
      refPrice: 997,
      run(v, call) {
        const R = v.RR, A = R * v.SUR, RV = (R - A) * v.RWR;
        const rows = [['Registrants', R, 2], ['Live attendees', A, 3], ['Replay viewers', RV, 3]];
        if (call) { const CB = A * v.BR + RV * v.RBR; const CH = CB * v.CSR; rows.push(['Calls booked', CB, 4], ['Calls held', CH, 5], ['Customers', CH * v.CLOSE, 5]); return { rows, cust: CH * v.CLOSE, list: R }; }
        const B = A * v.PUR + RV * v.RPUR; rows.push(['Customers', B, 4]); return { rows, cust: B, list: R };
      }
    },
    rsp: {
      name: 'Reverse Squeeze Page', tag: 'Video first, opt-in second, then calls or checkout', cadence: { label: 'month', per: 'month', perYear: 12 }, entry: 'video page visits', priority: 12,
      blurb: 'An evergreen video page that teaches before it asks. Viewers who watch past halfway give their email to unlock part two, reminders bring them back to watch it, and part two ends with the offer.',
      kpis: [
        K('HWR', 2, 'Half-Watch Rate', 'people who watch past halfway on their first visit ÷ page visits', 15, 25, 40, 'landing', SRC.plan),
        K('OIR', 2, 'Opt-In Rate', 'half-watchers who give their email to unlock part two ÷ half-watchers', 25, 40, 55, 'landing', SRC.optin + '; for half-watchers this is a planning figure'),
        K('P2R', 3, 'Part Two Watch Rate', 'opt-ins who watch part two, with reminders ÷ opt-ins', 30, 45, 60, 'nurture', SRC.plan),
        K('BR', 4, 'Booking Rate', 'calls booked ÷ part two viewers', 8, 15, 30, 'convert', SRC.vslApp, 'call'),
        K('PUR', 4, 'Purchase Rate', 'buyers ÷ part two viewers', 2, 5, 10, 'convert', SRC.vsl, 'checkout'),
        ...PIPE(), NEXT52
      ],
      refPrice: 997,
      run(v, call) {
        const HW = v.HWR, OI = HW * v.OIR, P2 = OI * v.P2R;
        const rows = [['Watched past halfway', HW, 2], ['Opt-ins', OI, 2], ['Watched part two', P2, 3]];
        if (call) { const CB = P2 * v.BR, CH = CB * v.CSR; rows.push(['Calls booked', CB, 4], ['Calls held', CH, 5], ['Customers', CH * v.CLOSE, 5]); return { rows, cust: CH * v.CLOSE, list: OI }; }
        const Bx = P2 * v.PUR; rows.push(['Customers', Bx, 4]); return { rows, cust: Bx, list: OI };
      }
    },
    workshop: {
      name: 'Workshop Series', tag: 'Live multi-day workshop, then calls', cadence: { label: 'workshop', per: 'month', perYear: 12 }, entry: 'registration page visits', priority: 4,
      blurb: 'A live workshop over two or three days. The people who stay for a day and a half are the ones who book.',
      kpis: [
        K('RR', 2, 'Registration Rate', 'registrants ÷ page visits', 20, 32, 45, 'landing', SRC.challenge),
        K('DHR', 3, 'Day-and-a-Half Rate', 'registrants who attend 1.5 days or more ÷ registrants', 20, 35, 50, 'nurture', SRC.challenge),
        K('BR', 4, 'Booking Rate', 'calls booked ÷ day-and-a-half attendees', 8, 15, 25, 'convert', SRC.challenge, 'call'),
        K('PUR', 4, 'Purchase Rate', 'buyers ÷ day-and-a-half attendees', 3, 8, 15, 'convert', SRC.challenge, 'checkout'),
        ...PIPE(), NEXT52
      ],
      refPrice: 997,
      run(v, call) {
        const R = v.RR, D = R * v.DHR; const rows = [['Registrants', R, 2], ['Day-and-a-half attendees', D, 3]];
        if (call) { const CB = D * v.BR, CH = CB * v.CSR; rows.push(['Calls booked', CB, 4], ['Calls held', CH, 5], ['Customers', CH * v.CLOSE, 5]); return { rows, cust: CH * v.CLOSE, list: R }; }
        const B = D * v.PUR; rows.push(['Customers', B, 4]); return { rows, cust: B, list: R };
      }
    },
    ooo: {
      name: 'OOO Funnel', tag: 'Opt-in, low-ticket offer, one-click upsell', cadence: { label: 'month', per: 'month', perYear: 12 }, entry: 'opt-in page visits', priority: 0,
      blurb: 'A lead magnet, a low-ticket offer on the thank-you page and a one-click upsell. Buyers then move up to your main offer.',
      kpis: [
        K('OPT', 2, 'Opt-In Rate', 'leads ÷ page visits', 15, 30, 45, 'landing', SRC.optin + '; ' + SRC.fmOOO),
        K('TW', 4, 'Offer Take Rate', 'low-ticket buyers ÷ leads', 3, 7, 12, 'convert', SRC.tripwire + '; ' + SRC.fmOOO),
        K('UP', 4, 'Upsell Take Rate', 'one-click upsell buyers ÷ low-ticket buyers', 5, 12, 25, 'convert', SRC.tripwire),
        K('ASC', 5, 'Ascension Rate', 'buyers who move to your main offer in 90 days ÷ low-ticket buyers', 1, 3, 5, 'close', SRC.ascend),
        NEXT52
      ],
      prices: { entry: 27, upsell: 297 },
      run(v, call, P) {
        const L = v.OPT, B = L * v.TW, U = B * v.UP, M = B * v.ASC;
        return { rows: [['Leads', L, 2], ['Low-ticket buyers', B, 4], ['Upsell buyers', U, 4], ['Main-offer customers', M, 5]], cust: M, list: L, extra: B * P.entry + U * P.upsell, extraLabel: `low-ticket and upsell sales ($${P.entry} and $${P.upsell})` };
      }
    },
    slo: {
      name: 'SLO Funnel', tag: 'Self-liquidating offer: ads pay for themselves', cadence: { label: 'month', per: 'month', perYear: 12 }, entry: 'offer page visits from ads', priority: 0, adsOnly: true,
      blurb: 'Paid ads sell a low-ticket offer that covers the ad spend. The profit is in the backend: the order bump, the $297 offer and your main offer.',
      kpis: [
        K('CONV', 2, 'Offer Conversion Rate', 'buyers ÷ offer page visits', 1, 2.5, 5, 'landing', SRC.tripwire + '; ' + SRC.fmSLO),
        K('BUMP', 4, 'Order Bump Rate', 'buyers who add the bump ÷ buyers', 15, 30, 45, 'convert', SRC.tripwire),
        K('BACK', 4, 'Backend Offer Rate', 'buyers of the backend offer ÷ buyers', 5, 12, 20, 'convert', SRC.tripwire + '; ' + SRC.fmSLO),
        K('ASC', 5, 'Ascension Rate', 'buyers who move to your main offer in 90 days ÷ buyers', 1, 3, 5, 'close', SRC.ascend),
        NEXT52
      ],
      prices: { entry: 37, bump: 17, backend: 297 },
      run(v, call, P) {
        const B = v.CONV, Bu = B * v.BUMP, Bk = B * v.BACK, M = B * v.ASC;
        return { rows: [['Front-end buyers', B, 2], ['Order bumps', Bu, 4], ['Backend buyers', Bk, 4], ['Main-offer customers', M, 5]], cust: M, list: B, extra: B * P.entry + Bu * P.bump + Bk * P.backend, extraLabel: `front-end, bump and backend sales ($${P.entry}, $${P.bump}, $${P.backend})` };
      }
    },
    book: {
      name: 'Book a Call', tag: 'Application page, qualification, sales call', cadence: { label: 'month', per: 'month', perYear: 12 }, entry: 'booking page visits', priority: 2, callOnly: true,
      blurb: 'One page with one action: apply for a call. A short qualification screen (budget, authority, need, timeline) keeps the calendar full of buyers.',
      kpis: [
        K('APR', 2, 'Application Rate', 'applications ÷ page visits', 3, 7, 12, 'landing', SRC.appPage + '; ' + SRC.fmBook),
        K('QR', 3, 'Qualification Rate', 'qualified applicants ÷ applications', 40, 60, 75, 'landing', SRC.fmBook + '; no public benchmark'),
        K('CSR', 5, 'Call Show Rate', 'calls held ÷ calls booked', 60, 75, 87, 'nurture', SRC.callShow),
        K('CLOSE', 5, 'Close Rate', 'customers ÷ calls held', 15, 25, 38, 'close', SRC.b2bClose + '; ' + SRC.htClose),
        NEXT52
      ],
      run(v) {
        const A = v.APR, Q = A * v.QR, CH = Q * v.CSR, C = CH * v.CLOSE;
        return { rows: [['Applications', A, 2], ['Qualified calls booked', Q, 3], ['Calls held', CH, 5], ['Customers', C, 5]], cust: C, list: A };
      }
    },
    challenge: {
      name: 'Challenge', tag: 'Five to seven days of daily tasks, then the offer', cadence: { label: 'challenge', per: 'challenge', perYear: 6 }, entry: 'registration page visits', priority: 2,
      blurb: 'A free challenge with one task a day and a group to report wins in. Momentum sells the next step on the last day.',
      kpis: [
        K('RR', 2, 'Registration Rate', 'registrants ÷ page visits', 25, 35, 50, 'landing', SRC.challenge),
        K('D1R', 3, 'Day 1 Attendance', 'day 1 attendees ÷ registrants', 35, 45, 50, 'nurture', SRC.challenge + '; ' + SRC.fmChallenge),
        K('COMP', 3, 'Completion Rate', 'people who finish ÷ day 1 attendees', 35, 50, 65, 'nurture', SRC.challenge + '; ' + SRC.fmChallenge),
        K('BR', 4, 'Booking Rate', 'calls booked ÷ people who finish', 10, 15, 20, 'convert', SRC.challenge, 'call'),
        K('PUR', 4, 'Purchase Rate', 'buyers ÷ people who finish', 2, 5, 15, 'convert', SRC.challenge + '; ' + SRC.fmChallenge, 'checkout'),
        ...PIPE(20, 28, 40, SRC.challenge), NEXT52
      ],
      refPrice: 297,
      run(v, call) {
        const R = v.RR, D1 = R * v.D1R, C = D1 * v.COMP; const rows = [['Registrants', R, 2], ['Day 1 attendees', D1, 3], ['Finished the challenge', C, 3]];
        if (call) { const CB = C * v.BR, CH = CB * v.CSR; rows.push(['Calls booked', CB, 4], ['Calls held', CH, 5], ['Customers', CH * v.CLOSE, 5]); return { rows, cust: CH * v.CLOSE, list: R }; }
        const B = C * v.PUR; rows.push(['Customers', B, 4]); return { rows, cust: B, list: R };
      }
    },
    community: {
      name: 'Community', tag: 'Free community, premium upgrade, retention', cadence: { label: 'month', per: 'month', perYear: 12 }, entry: 'join page visits', priority: 0,
      blurb: 'Content brings people into a free community. Active members upgrade to a paid tier or book a call, and retention compounds the revenue.',
      kpis: [
        K('JOIN', 2, 'Join Rate', 'new members ÷ join page visits', 8, 15, 25, 'landing', SRC.fmCommunity),
        K('ACT', 3, 'Active Member Rate', 'members active in a month ÷ members', 40, 60, 75, 'nurture', SRC.fmCommunity + '; no public benchmark'),
        K('UPG', 4, 'Upgrade Rate', 'paid members ÷ active members', 3, 6, 10, 'convert', SRC.community, 'checkout'),
        K('BKR', 4, 'Booking Rate', 'calls booked ÷ active members', 1, 3, 6, 'convert', SRC.plan, 'call'),
        ...PIPE(), NEXT52
      ],
      refPrice: 47, refMonthly: true,
      run(v, call) {
        const J = v.JOIN, A = J * v.ACT; const rows = [['New members', J, 2], ['Active members', A, 3]];
        if (call) { const CB = A * v.BKR, CH = CB * v.CSR; rows.push(['Calls booked', CB, 4], ['Calls held', CH, 5], ['Customers', CH * v.CLOSE, 5]); return { rows, cust: CH * v.CLOSE, list: J }; }
        const U = A * v.UPG; rows.push(['Paid members', U, 4]); return { rows, cust: U, list: J };
      }
    },
    social: {
      name: 'Social Following', tag: 'Value posts, offer posts, DMs, calls', cadence: { label: 'month', per: 'month', perYear: 12 }, entry: 'people who see an offer post', priority: 0, callOnly: true, organic: true,
      blurb: 'Daily value posts build trust. One offer post in ten asks people to comment, the comments become DM conversations, and the DMs become calls.',
      kpis: [
        K('CMT', 2, 'Comment Rate', 'people who comment on an offer post ÷ people who see it', 1, 3, 5, 'landing', SRC.linkedinEng + '; ' + SRC.fmSocial),
        K('DMR', 3, 'Conversation Rate', 'DM conversations ÷ commenters', 40, 50, 60, 'nurture', SRC.dm),
        K('BKR', 4, 'Booking Rate', 'calls booked ÷ DM conversations', 20, 35, 50, 'convert', SRC.dm + '; ' + SRC.fmSocial),
        K('CSR', 5, 'Call Show Rate', 'calls held ÷ calls booked', 60, 75, 87, 'nurture', SRC.callShow),
        K('CLOSE', 5, 'Close Rate', 'customers ÷ calls held', 12, 20, 30, 'close', SRC.b2bClose),
        NEXT52
      ],
      run(v) {
        const M = v.CMT, D = M * v.DMR, CB = D * v.BKR, CH = CB * v.CSR, C = CH * v.CLOSE;
        return { rows: [['Commenters', M, 2], ['DM conversations', D, 3], ['Calls booked', CB, 4], ['Calls held', CH, 5], ['Customers', C, 5]], cust: C, list: M };
      }
    },
    launch: {
      name: 'Product Launch', tag: 'Three-video series, open cart, close', cadence: { label: 'launch', per: 'launch', perYear: 3 }, entry: 'opt-in page visits', priority: 0,
      blurb: 'A free three-video series builds the case, a short open cart sells the offer, and the last 24 hours bring in the late buyers.',
      kpis: [
        K('OPT', 2, 'Opt-In Rate', 'launch registrants ÷ page visits', 25, 40, 55, 'landing', SRC.fmLaunch),
        K('V1R', 3, 'Video 1 View Rate', 'video 1 viewers ÷ registrants', 60, 80, 90, 'nurture', SRC.fmLaunch + '; no public benchmark'),
        K('V3R', 3, 'Video 3 Retention', 'video 3 viewers ÷ video 1 viewers', 50, 65, 80, 'nurture', SRC.fmLaunch + '; no public benchmark'),
        K('BUY', 4, 'Cart Conversion', 'buyers ÷ video 3 viewers (final 24 hours included)', 2, 4, 9, 'convert', SRC.launch, 'checkout'),
        K('BR', 4, 'Booking Rate', 'calls booked ÷ video 3 viewers', 3, 8, 15, 'convert', SRC.plan, 'call'),
        ...PIPE(), NEXT52
      ],
      refPrice: 997,
      run(v, call) {
        const R = v.OPT, V1 = R * v.V1R, V3 = V1 * v.V3R; const rows = [['Launch registrants', R, 2], ['Watched video 1', V1, 3], ['Watched video 3', V3, 3]];
        if (call) { const CB = V3 * v.BR, CH = CB * v.CSR; rows.push(['Calls booked', CB, 4], ['Calls held', CH, 5], ['Customers', CH * v.CLOSE, 5]); return { rows, cust: CH * v.CLOSE, list: R }; }
        const B = V3 * v.BUY; rows.push(['Customers', B, 4]); return { rows, cust: B, list: R };
      }
    }
  };
  const ORDER = ['webinar', 'rsp', 'workshop', 'ooo', 'slo', 'book', 'challenge', 'community', 'social', 'launch'];
  const STAGES = { 1: 'Traffic', 2: 'Landing and sign-up', 3: 'Nurture', 4: 'Conversion', 5: 'Revenue and pipeline', 6: 'The next 52 weeks' };

  /* ---------- Helpers ---------- */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const num = (x, d = 0) => { const n = Number(x); return isFinite(n) && n >= 0 ? n : d; };
  const idx = (x, max) => clamp(Math.round(num(x, 0)), 0, max);

  /* Normalise answers: fills safe defaults so a half-finished survey still gives a plan. */
  function normalise(a) {
    a = a || {};
    const opt = (k, d) => (OPTIONS[k].some((o) => o[0] === a[k]) ? a[k] : d);
    return {
      offer_type: opt('offer_type', 'consulting'), market: opt('market', 'b2b'), offer_desc: String(a.offer_desc || '').slice(0, 140),
      price: num(a.price, 5000) || 5000, price_model: opt('price_model', 'one_time'), entry_price: num(a.entry_price, 0),
      motion: opt('motion', 'call'), cycle: opt('cycle', 'weeks'),
      revenue_now: idx(a.revenue_now, 6), goal: num(a.goal, 0),
      revenue_built: idx(a.revenue_built, 6), team_led: idx(a.team_led, 4), years: idx(a.years, 4),
      clients: idx(a.clients, 4), case_studies: idx(a.case_studies, 4), brands: idx(a.brands, 2),
      funnel_exp: idx(a.funnel_exp, 3), funnels_built: Array.isArray(a.funnels_built) ? a.funnels_built.filter((x) => OPTIONS.funnels_built.some((o) => o[0] === x)) : [], revops: idx(a.revops, 3),
      email_list: num(a.email_list), followers: num(a.followers), youtube: num(a.youtube), community: num(a.community), site: num(a.site),
      channels: Array.isArray(a.channels) ? a.channels.filter((x) => OPTIONS.channels.some((o) => o[0] === x)) : [], ad_budget: num(a.ad_budget), hours: idx(a.hours, 3), team_help: idx(a.team_help, 3),
      funnel: FUNNELS[a.funnel] ? a.funnel : null, compare: FUNNELS[a.compare] ? a.compare : null,
      name: String(a.name || '').slice(0, 60)
    };
  }

  /* Monthly revenue now, and a 12-month goal when the survey left it blank: new revenue equal to today's yearly run rate
     (revenue doubles), at least $120,000. */
  const runRate = (a) => REV_NOW_MID[a.revenue_now];
  const goalOf = (a) => a.goal > 0 ? a.goal : Math.max(120000, Math.round(runRate(a) * 12 / 10000) * 10000); // adds today's yearly run rate: revenue doubles

  /* ---------- Profile: five scores from 0 to 1 ---------- */
  function profile(a) {
    const proof = 0.45 * a.case_studies / 4 + 0.35 * a.clients / 4 + 0.2 * a.brands / 2;
    const exp = 0.6 * a.funnel_exp / 3 + 0.4 * a.revops / 3;
    const sales = 0.4 * a.revenue_built / 6 + 0.35 * a.revenue_now / 6 + 0.25 * a.years / 4;
    const reach = a.email_list + a.followers / 4 + a.youtube / 2 + a.community * 2 + a.site / 2;
    const warm = clamp(Math.log10(1 + reach) / 5, 0, 1);
    const cap = 0.6 * a.hours / 3 + 0.4 * a.team_help / 3;
    return { proof, exp, sales, warm, cap, reach };
  }
  const LEVER = {
    landing: (p) => 0.4 * p.proof + 0.35 * p.warm + 0.25 * p.exp,
    nurture: (p) => 0.55 * p.exp + 0.25 * p.warm + 0.2 * p.cap,
    convert: (p) => 0.45 * p.proof + 0.25 * p.exp + 0.3 * p.warm,
    close: (p) => 0.45 * p.sales + 0.4 * p.proof + 0.15 * p.exp,
    retain: (p) => 0.5 * p.exp + 0.3 * p.proof + 0.2 * p.cap
  };
  // Position inside the range: 0.15 at a cold start, 0.85 at the best profile. Never the very top of a range.
  const position = (k, prof) => 0.15 + 0.7 * clamp(LEVER[k.lever](prof), 0, 1);
  const inRange = (k, pos) => (pos < 0.5 ? k.lo + (k.ty - k.lo) * (pos / 0.5) : k.ty + (k.hi - k.ty) * ((pos - 0.5) / 0.5));

  /* Is this a call offer? A "call only" funnel always is; otherwise the survey's answer, and "both" splits on price. */
  function isCall(f, a) {
    if (FUNNELS[f].callOnly) return true;
    if (a.motion === 'call') return true;
    if (a.motion === 'checkout') return false;
    return value12(a) >= 2000;
  }

  /* Price effect: checkout rates fall as the price rises above the funnel's reference price; call close rates
     fall a little above $15,000 and rise a little under $2,000. */
  function priceFactor(k, f, a, call) {
    const v = value12(a);
    const cmp = FUNNELS[f].refMonthly && a.price_model === 'monthly' ? a.price : v;
    if (k.flags === 'checkout' && FUNNELS[f].refPrice) return clamp(Math.pow(FUNNELS[f].refPrice / Math.max(1, cmp), 0.3), 0.4, 1.6);
    if (k.id === 'CLOSE' && call) return v > 15000 ? 0.85 : v < 2000 ? 1.15 : 1;
    return 1;
  }

  /* Revenue from one customer inside the first 12 months. Monthly offers: customers join evenly over the year
     and leave at the monthly churn, so the average customer pays for fewer than 12 months. */
  function churnOf(a) { const p = profile(a); return 0.09 - 0.05 * clamp(LEVER.retain(p), 0, 1); }
  function monthsPaid12(c) { let t = 0; for (let s = 0; s < 12; s++) { for (let m = 0; m < 12 - s; m++) t += Math.pow(1 - c, m); } return t / 12; }
  function value12(a) { if (a.price_model === 'monthly') return a.price * monthsPaid12(churnOf(a)); return a.price; }

  /* ---------- Fit: which funnels suit this business, with the reasons ---------- */
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
     opts.over: KPI values typed over (percent), opts.visits: page visits per cycle typed over (forward mode),
     opts.goal: 12-month revenue goal typed over, opts.call: force the offer path. */
  function plan(fid, raw, opts = {}) {
    const a = normalise(raw); const f = FUNNELS[fid]; const prof = profile(a);
    const call = opts.call != null ? (f.callOnly ? true : !!opts.call) : isCall(fid, a);
    const goal = opts.goal > 0 ? opts.goal : goalOf(a);
    const over = opts.over || {};
    const kpis = f.kpis.filter((k) => !(k.flags === 'call' && !call) && !(k.flags === 'checkout' && call)).map((k) => {
      const pos = position(k, prof); const factor = priceFactor(k, fid, a, call);
      const planned = clamp(inRange(k, pos) * factor, k.lo, k.hi); // never outside the range
      const val = over[k.id] != null ? over[k.id] : planned;
      return Object.assign({}, k, { planned, value: val, over: over[k.id] != null, pos });
    });
    const v = {}; kpis.forEach((k) => { v[k.id] = k.value / 100; });

    // Prices for low-ticket funnels: the survey's entry price replaces the diagram's when given.
    const P = Object.assign({}, f.prices || {}, opts.prices || {});
    if (P.entry && a.entry_price > 0 && !(opts.prices && opts.prices.entry)) P.entry = a.entry_price;

    const r = f.run(v, call, P);
    const val12 = value12(a);
    const revPerVisit = r.cust * val12 + (r.extra || 0);
    const cycles = f.cadence.perYear;
    const goalPerCycle = goal / cycles;
    const visits = opts.visits > 0 ? opts.visits : (revPerVisit > 0 ? goalPerCycle / revPerVisit : 0);
    const scale = (x) => x * visits;
    const customers = scale(r.cust);
    const revCycle = scale(revPerVisit);
    const rev12 = revCycle * cycles;
    // The next 52 weeks: people who did not buy, worked for a year; on average half a year falls inside the window.
    const listLeft = Math.max(0, scale(r.list) - customers);
    const later = customers * cycles * (v.NRR || 0); // customers the following 52 weeks add, tied to the funnel's own conversion
    const laterRev = later * val12;

    // Traffic: visits per month the funnel needs, then where they come from.
    const perMonth = visits * cycles / 12;
    const traffic = trafficPlan(a, perMonth, fid);
    const lifetime = a.price_model === 'monthly' ? a.price / churnOf(a) : a.price;

    return {
      funnel: fid, name: f.name, call, a, prof, goal, cycles, cadence: f.cadence, entry: f.entry,
      kpis, rows: r.rows.map(([label, n, stage]) => ({ label, n: scale(n), stage })),
      visits, perMonth, customers, customersMonth: customers * cycles / 12, revCycle, rev12,
      value12: val12, lifetime, extraLabel: r.extraLabel || null, extra12: (r.extra || 0) * visits * cycles,
      later, laterRev, listLeft: listLeft * cycles, traffic,
      costPerCustomer: customers > 0 && traffic.adSpend > 0 ? traffic.adSpend * 12 / (customers * cycles) : 0,
      // Front-end return on ad spend: only for the funnels whose low-ticket sales are meant to pay for the ads.
      roas: traffic.adSpend > 0 && (fid === 'slo' || fid === 'ooo') ? ((r.extra || 0) * visits * cycles / 12) * (traffic.lines.find((l) => l.id === 'ads').visits / Math.max(1, perMonth)) / traffic.adSpend : 0,
      churn: a.price_model === 'monthly' ? churnOf(a) : null,
      gap: traffic.gap, unreachable: !(revPerVisit > 0) && !(opts.visits > 0), budgetShort: traffic.budgetShort || 0
    };
  }

  /* Owned audience first, then the ad budget, then the outreach channels the survey picked, split evenly. */
  function trafficPlan(a, need, fid) {
    const f = FUNNELS[fid];
    const owned = Object.keys(OWNED).map((k) => ({ id: k, name: OWNED[k].name, size: a[k], visits: a[k] * OWNED[k].per, how: OWNED[k].how, src: OWNED[k].src })).filter((o) => o.size > 0);
    const ownedTotal = owned.reduce((t, o) => t + o.visits, 0);
    const useOwned = f.adsOnly || f.organic ? 0 : Math.min(need, ownedTotal);
    owned.forEach((o) => { o.used = ownedTotal ? o.visits / ownedTotal * useOwned : 0; });
    let rest = need - useOwned; const lines = [];
    let adSpend = 0, budgetShort = 0;
    const picked = f.organic ? ['content'] : f.adsOnly ? ['ads'] : a.channels.slice();
    if (f.organic) {
      // Social Following: the entry is people who see an offer post. About 1 post in 10 is an offer post (Funnel Master).
      const daily = a.followers * 30 * 0.05;
      lines.push({ id: 'content', name: 'Your posts', visits: rest, reach: rest * 10, unit: 'people reached by your posts a month', how: 'about 1 post in 10 is an offer post, so offer post viewers are about 10% of the people your posts reach' + (a.followers ? `; your ${Math.round(a.followers).toLocaleString('en-US')} followers give about ${Math.round(daily).toLocaleString('en-US')} a month at 5% reach per daily post` : ''), src: SRC.fmSocial });
      return { need, owned: [], ownedUsed: 0, lines, adSpend: 0, gap: 0, followerReach: daily };
    }
    const others = picked.filter((c) => c !== 'ads');
    if (picked.includes('ads') && rest > 0) {
      // Ads alone (or an SLO): ads carry everything. Ads with other channels: the budget the survey gave, or an even share.
      const C = a.market === 'b2c' ? CHANNELS.ads_b2c : CHANNELS.ads;
      // The ad budget is a ceiling (except an SLO, which is built to buy all its traffic); the rest stays a gap.
      const fromAds = f.adsOnly || !(a.ad_budget > 0) ? (others.length ? rest / picked.length : rest) : Math.min(rest, a.ad_budget / C.cpv);
      adSpend = fromAds * C.cpv; rest -= fromAds;
      if (a.ad_budget > 0 && adSpend > a.ad_budget * 1.01) budgetShort = adSpend - a.ad_budget;
      lines.push({ id: 'ads', name: C.name, visits: fromAds, reach: adSpend, unit: 'a month in ad spend', money: true, how: C.how, src: C.src });
    }
    others.forEach((c) => {
      const C = CHANNELS[c]; const share = rest / others.length;
      lines.push({ id: c, name: C.name, visits: share, reach: share / C.vr, unit: C.unit + ' a month', how: C.how, src: C.src, seats: C.cap ? Math.ceil(share / C.vr / C.cap) : 0, seatUnit: C.capUnit || '', seatSrc: C.capSrc || '' });
    });
    if (others.length) rest = 0;
    return { need, owned: owned.filter((o) => o.used > 0), ownedUsed: useOwned, lines, adSpend, budgetShort, gap: Math.max(0, rest) };
  }

  const api = { SRC, OPTIONS, CHANNELS, OWNED, FUNNELS, ORDER, STAGES, normalise, profile, recommend, leadScore, plan, goalOf, value12, monthsPaid12 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TantraPlan = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
