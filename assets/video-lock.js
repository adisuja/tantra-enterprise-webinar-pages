// Vidalytics VSLs (thank-you and upsell pages), per Adi 2026-11-10:
// 1. Autoplay as soon as the page opens. Vidalytics' Smart Autoplay starts the video muted (browsers block sound
//    until the visitor interacts) and shows its own "Click To Unmute" overlay, which restarts the video with sound.
//    If the player has not started by itself, this script starts it (muted if the browser refuses sound).
// 2. Viewers can pause and play, but can never rewind, skip forward or jump to the end: every seek is undone,
//    except the one restart to the beginning when the sound is switched on. The seek bar and time are hidden (CSS).
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
      var last = 0, own = false, wasMuted = v.muted, restartUntil = 0;
      v.addEventListener('volumechange', function () {
        if (wasMuted && !v.muted) restartUntil = Date.now() + 1500;  // unmute: allow the restart to 0:00
        wasMuted = v.muted;
      });
      v.addEventListener('timeupdate', function () { if (!v.seeking && Math.abs(v.currentTime - last) < 1.5) last = v.currentTime; });
      v.addEventListener('seeking', function () {
        if (own) { own = false; return; }
        if (v.currentTime < 0.5 && (Date.now() < restartUntil || (wasMuted && !v.muted))) { last = v.currentTime; return; }  // Vidalytics seeks to 0 just before the unmute event fires
        if (Math.abs(v.currentTime - last) > 0.3) { own = true; v.currentTime = last; }
      });
      function autoplay() {
        var p = v.play();
        if (p && p.catch) p.catch(function () { v.muted = true; var q = v.play(); if (q && q.catch) q.catch(function () {}); });
      }
      setTimeout(function () { if (v.paused && v.currentTime < 0.5) autoplay(); }, 1500);
    }
  });
})();
