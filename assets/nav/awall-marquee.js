/* Respongo ödül şeridi: otomatik akış + erişilebilir önceki/sonraki kontrolleri. */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var walls = document.querySelectorAll('.awall');
    if (!walls.length) return;

    var style = document.createElement('style');
    style.textContent =
      '.awall.marquee{display:flex;overflow:hidden;max-width:100%;-webkit-mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent)}' +
      '.awall-track{display:flex;align-items:center;gap:74px;flex-shrink:0;padding:12px 74px 12px 0;will-change:transform}' +
      '.awall-track img{height:124px;max-width:210px;width:auto;object-fit:contain;flex-shrink:0;transition:transform .25s}' +
      '.awall-track img:hover{transform:translateY(-4px) scale(1.03)}' +
      '.awall-controls{display:flex;align-items:center;justify-content:center;gap:14px;margin:24px auto 0}' +
      '.awall-prev,.awall-next{width:48px;height:48px;border:1px solid var(--line,#dfe4f4);border-radius:50%;background:#fff;color:var(--blue,#0a2edc);display:inline-flex;align-items:center;justify-content:center;font-size:25px;line-height:1;box-shadow:0 8px 24px rgba(4,11,43,.09);cursor:pointer;transition:transform .2s,border-color .2s,background .2s}' +
      '.awall-prev:hover,.awall-next:hover,.awall-prev:focus-visible,.awall-next:focus-visible{transform:translateY(-2px);border-color:var(--blue,#0a2edc);background:var(--blue-soft,#eef2ff);outline:none}' +
      '@media(max-width:680px){.awall-track{gap:42px;padding-right:42px}.awall-track img{height:82px;max-width:150px}.awall-controls{margin-top:18px}.awall-prev,.awall-next{width:44px;height:44px}}';
    document.head.appendChild(style);

    walls.forEach(function (wall) {
      var items = Array.prototype.slice.call(wall.children);
      if (items.length < 3) return;

      wall.classList.add('marquee');
      if (!wall.hasAttribute('tabindex')) wall.setAttribute('tabindex', '0');
      var track = document.createElement('div');
      track.className = 'awall-track';
      items.forEach(function (item) { track.appendChild(item); });
      items.forEach(function (item) {
        var clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute('alt', '');
        track.appendChild(clone);
      });
      wall.replaceChildren(track);

      var controls = document.createElement('div');
      controls.className = 'awall-controls';
      var prev = document.createElement('button');
      var next = document.createElement('button');
      prev.type = next.type = 'button';
      prev.className = 'awall-prev';
      next.className = 'awall-next';
      prev.setAttribute('aria-label', 'Önceki ödülleri göster');
      next.setAttribute('aria-label', 'Sonraki ödülleri göster');
      prev.innerHTML = '<span aria-hidden="true">‹</span>';
      next.innerHTML = '<span aria-hidden="true">›</span>';
      controls.append(prev, next);
      wall.insertAdjacentElement('afterend', controls);

      if (!track.animate) return;
      var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      var duration = Math.max(18000, items.length * 2500);
      var step = duration / items.length;
      var anim = track.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
        { duration: duration, iterations: Infinity, easing: 'linear' }
      );

      function shouldPause() {
        return motionQuery.matches || document.hidden || wall.matches(':hover') || wall.contains(document.activeElement) || controls.contains(document.activeElement);
      }
      function syncPlayback() { shouldPause() ? anim.pause() : anim.play(); }
      function move(direction) {
        var current = Number(anim.currentTime || 0);
        anim.currentTime = ((current + direction * step) % duration + duration) % duration;
        syncPlayback();
      }

      prev.addEventListener('click', function () { move(-1); });
      next.addEventListener('click', function () { move(1); });
      wall.addEventListener('mouseenter', syncPlayback);
      wall.addEventListener('mouseleave', syncPlayback);
      wall.addEventListener('focusin', syncPlayback);
      wall.addEventListener('focusout', function () { setTimeout(syncPlayback); });
      controls.addEventListener('focusin', syncPlayback);
      controls.addEventListener('focusout', function () { setTimeout(syncPlayback); });
      document.addEventListener('visibilitychange', syncPlayback);
      if (motionQuery.addEventListener) motionQuery.addEventListener('change', syncPlayback);
      syncPlayback();
    });
  });
})();
