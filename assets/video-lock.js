// Vidalytics VSLs (thank-you and upsell pages), per Adi 2026-11-10:
// 1. Autoplay as soon as the page opens. Browsers block autoplay with sound, so if that is refused the video
//    starts muted with a "Click to unmute" button; clicking it restarts the video from the top with sound.
// 2. Viewers can pause and play, but can never rewind, skip forward or jump to the end: every seek that the page
//    did not make itself is undone, and the seek bar and time scrubber are hidden.
(function () {
  document.querySelectorAll('.video--vidalytics').forEach(function (box) {
    var started = false;
    var find = setInterval(function () {
      var v = box.querySelector('video');
      if (!v || started) return;
      started = true; clearInterval(find); lock(v);
    }, 100);
    setTimeout(function () { clearInterval(find); }, 20000);

    function lock(v) {
      var last = 0, own = false;
      v.addEventListener('timeupdate', function () { if (!v.seeking && Math.abs(v.currentTime - last) < 1.5) last = v.currentTime; });
      v.addEventListener('seeking', function () {
        if (own) { own = false; return; }
        if (Math.abs(v.currentTime - last) > 0.3) { own = true; v.currentTime = last; }
      });
      var btn = null;
      function unmuteButton() {
        if (btn) return;
        btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'vlock-unmute';
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg><span>Click to unmute</span>';
        btn.addEventListener('click', function (e) {
          e.stopPropagation(); own = true; last = 0; v.currentTime = 0; v.muted = false; v.volume = 1;
          var p = v.play(); if (p && p.catch) p.catch(function () {});
          btn.remove(); btn = null;
        });
        box.appendChild(btn);
      }
      function autoplay() {
        var p = v.play();
        if (p && p.catch) p.catch(function () { v.muted = true; var q = v.play(); if (q && q.catch) q.catch(function () {}); unmuteButton(); });
      }
      if (v.paused) autoplay();
      // the player may still be starting: check again shortly
      setTimeout(function () { if (v.paused && v.currentTime < 0.5) autoplay(); if (v.muted) unmuteButton(); }, 1500);
    }
  });
})();
