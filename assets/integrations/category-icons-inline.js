/* ===========================================================================
   RESPONGO — entegrasyon kategori ikonlarını satır içi (inline) hale getirir.
   Neden: <use href="category-icons.svg#id"> harici SVG parça referansları,
   dosya doğrudan file:// olarak açıldığında (yerel disk) tarayıcılar
   tarafından güvenlik nedeniyle engellenir ve ikon boş kutu olarak görünür.
   Bu betik, aynı path verisini JS içinden doğrudan basar — sunucu/protokol
   fark etmeksizin her zaman çalışır.
   =========================================================================== */
(function () {
  'use strict';

  var ICONS = {
    'icon-workforce': '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 19c.6-3.6 2.4-5.4 5.5-5.4s4.9 1.8 5.5 5.4M14 14.3c3.7-.8 6.1.8 6.5 4.7"/>',
    'icon-collaboration': '<circle cx="7" cy="8" r="2.5"/><circle cx="17" cy="8" r="2.5"/><circle cx="12" cy="16" r="2.5"/><path d="M9.2 9.3l1.7 4.2M14.8 9.3l-1.7 4.2M9.5 16h-5M19.5 16h-5"/>',
    'icon-ecosystem': '<circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 7.7l2.7 2.4M17 7.7l-2.7 2.4M7 16.3l2.7-2.4M17 16.3l-2.7-2.4"/>',
    'icon-library': '<path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Z"/><path d="M8 20V8.5a2 2 0 0 1 2-2h9M11 11h5M11 15h5"/>',
    'icon-auth': '<path d="M12 3.5 19 6v5.5c0 4.5-2.5 7.5-7 9-4.5-1.5-7-4.5-7-9V6l7-2.5Z"/><path d="m9 12 2 2 4-4"/>',
    'icon-commerce': '<path d="M3.5 5H6l2 9h9.5l2-6H7"/><circle cx="9" cy="18.5" r="1.5"/><circle cx="17" cy="18.5" r="1.5"/>'
  };

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var uses = document.querySelectorAll('use[href*="category-icons.svg#"], use[*|href*="category-icons.svg#"]');
    uses.forEach(function (u) {
      var href = u.getAttribute('href') || u.getAttribute('xlink:href') || '';
      var id = href.split('#')[1];
      var markup = ICONS[id];
      if (!markup) return;
      var svg = u.closest('svg');
      if (!svg) return;
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.8');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.innerHTML = markup;
    });
  });
})();
