/* ===========================================================================
   RESPONGO — Ürün sayfası subnav geliştirmeleri (yalnızca ürün sayfalarında)
   1) Kaydırma ilerleme çizgisi (subnav altında ince bir bar)
   2) Aktif bölüm vurgusu (IntersectionObserver ile scroll-spy)
   3) Ayrı bir sayfaya giden subnav linklerinde küçük "yeni sayfa" ikonu
   Kendi <style> bloğunu enjekte eder; sayfa CSS'ine dokunmaz.
   =========================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var subnav = document.querySelector('.subnav');
    if (!subnav) return;
    var linkWrap = subnav.querySelector('.subnav-links');
    if (!linkWrap) return;
    var links = Array.prototype.slice.call(linkWrap.querySelectorAll('a'));
    if (!links.length) return;

    /* ---- stiller ---- */
    var style = document.createElement('style');
    style.textContent =
      '.subnav-progress-track{position:absolute;left:0;right:0;bottom:-1px;height:2px;background:rgba(4,11,43,.06);z-index:90;pointer-events:none}' +
      '.subnav-progress{position:absolute;left:0;top:0;bottom:0;width:0;background:var(--accent-ink,var(--blue));transition:width .12s linear}' +
      '.subnav-links a.active{color:var(--pbi,#fff) !important;background:var(--pb,var(--blue)) !important;padding:8px 16px !important;line-height:1.35 !important}' +
      '.subnav-links a.cur:not(.active){color:var(--accent-ink,var(--blue)) !important;font-weight:700;background:var(--accent-soft,var(--blue-soft,rgba(10,46,220,.08)))}' +
      '.subnav-links a:not(.active):hover{color:var(--accent-ink,var(--blue)) !important;background:var(--accent-soft,var(--blue-soft,rgba(10,46,220,.08)))}' +
      '.subnav-ext{display:inline-block;margin-left:5px;font-size:11px;line-height:1;opacity:.5;transform:translateY(-1px)}' +
      '@media (prefers-reduced-motion:reduce){.subnav-progress{transition:none}}';
    document.head.appendChild(style);

    /* ---- ilerleme çizgisi ---- */
    var track = document.createElement('div');
    track.className = 'subnav-progress-track';
    var bar = document.createElement('div');
    bar.className = 'subnav-progress';
    track.appendChild(bar);
    subnav.appendChild(track);

    function updateProgress() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      bar.style.width = (p * 100) + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();

    /* ---- ayrı sayfaya giden linkler + scroll-spy hazırlığı ---- */
    var here = (location.pathname.split('/').pop() || '01-ana-sayfa.html');
    var anchorLinks = [];
    links.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#' && href.length > 1) {
        anchorLinks.push(a);
      } else if (href.charAt(0) !== '#') {
        var file = href.split('#')[0].split('?')[0];
        if (file && file === here) {
          /* zaten bu sayfadayız: "yeni sayfa" oku yerine aktif sekme olarak işaretle */
          a.classList.add('active');
        } else if (a.classList.contains('subnav-soft')) {
          /* "subnav-soft": ana ürün sayfasının bir bölümüne (çapa) işaret eder;
             farklı bir dosyada olsa da kavramsal olarak aynı akışın parçası
             sayılır, bu yüzden "başka sayfaya gider" oku eklenmez. */
        } else {
          var icon = document.createElement('span');
          icon.className = 'subnav-ext';
          icon.setAttribute('aria-hidden', 'true');
          icon.textContent = '↗';
          a.appendChild(icon);
        }
      }
    });

    /* aktif sekme yatay kaydırılan şeridin sağ kenarında kalırsa kırpılmış
       görünüyordu: görünür alana tam sığacak şekilde kaydır. */
    if (linkWrap) {
      var activeTab = linkWrap.querySelector('a.active');
      if (activeTab) {
        requestAnimationFrame(function () {
          var pad = 16;
          var right = activeTab.offsetLeft + activeTab.offsetWidth;
          var visibleRight = linkWrap.scrollLeft + linkWrap.clientWidth;
          if (right + pad > visibleRight) {
            linkWrap.scrollLeft = right + pad - linkWrap.clientWidth;
          } else if (activeTab.offsetLeft - pad < linkWrap.scrollLeft) {
            linkWrap.scrollLeft = Math.max(0, activeTab.offsetLeft - pad);
          }
        });
      }
    }

    if (!anchorLinks.length) return;

    var byId = {};
    var sections = [];
    anchorLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) { byId[id] = a; sections.push({ id: id, el: el }); }
    });
    if (!sections.length) return;

    /* ---- scroll-spy: gerçek kaydırma konumuna göre "şu an hangi bölümdeyiz"
       hesabı. Önceki sürüm IntersectionObserver'ın sabit bir orta-ekran
       şeridini (rootMargin) izlemesine dayanıyordu; kısa sayfalarda (ör. bir
       fiyatlandırma sayfası) o şerit sayfa hiç kaydırılmadan bile alttaki bir
       bölümle (SSS gibi) çakışabiliyor ve o sekme, kullanıcı oraya hiç
       gitmeden "seçili" görünüyordu — kendi dosyasına işaret eden sekmenin
       (class="active") yanında ikinci bir sekme daha vurgulanmış oluyordu.
       Bunun yerine, sabit üst menünün kapladığı alanın hemen altındaki bir
       referans çizgiyi (site genelinde section[id]{scroll-margin-top:164px}
       ile aynı hizada) geçmiş olan SON bölümü "güncel" kabul ediyoruz. Sayfa
       kaydırılmadığı sürece hiçbir bölüm bu çizgiyi geçmemiş olur ve hiçbir
       sekme yanlışlıkla 'cur' almaz. ---- */
    var REF_LINE = 184;
    var ticking = false;

    function updateCurrent() {
      ticking = false;
      var bestIdx = -1;
      var bestTop = -Infinity;
      for (var i = 0; i < sections.length; i++) {
        var top = sections[i].el.getBoundingClientRect().top;
        if (top <= REF_LINE && top > bestTop) { bestTop = top; bestIdx = i; }
      }
      anchorLinks.forEach(function (l) { l.classList.remove('cur'); });
      if (bestIdx >= 0) { byId[sections[bestIdx].id].classList.add('cur'); }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateCurrent);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateCurrent();
  });
})();
