// VIP page: the offer opens when the reveal timer ends (as on the reference page). With no video yet the offer is open
// from the start. ?state=offer opens it at once for review.
(function () {
  var timer = document.querySelector('[data-vip-timer]');
  var offers = document.querySelectorAll('[data-vip-offer]');
  if (!timer || timer.hidden) return;
  var open = function () { timer.hidden = true; offers.forEach(function (o) { o.hidden = false; }); };
  if (new URLSearchParams(location.search).get('state') === 'offer') return open();
  var left = 100, clock = timer.querySelector('[data-vip-clock]');
  var tick = setInterval(function () {
    left -= 1;
    if (left <= 0) { clearInterval(tick); open(); return; }
    clock.textContent = '0' + Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
  }, 1000);
})();

// Checkout pre-fill: the registration form kept the email and first name in sessionStorage; Dodo's payment link
// accepts them as query parameters, so the buyer does not type them twice.
(function () {
  var email = null, first = null;
  try { email = sessionStorage.getItem('tantra_email'); first = sessionStorage.getItem('tantra_first_name'); } catch (e) {}
  if (!email && !first) return;
  document.querySelectorAll('a.vip-yes[href^="https://checkout.dodopayments.com/"]').forEach(function (a) {
    var u = new URL(a.href);
    if (email) u.searchParams.set('email', email);
    if (first) u.searchParams.set('firstName', first);
    a.href = u.toString();
  });
})();
