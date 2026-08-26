/* ===========================================================================
   RESPONGO 2026 — Mega menü + mobil menü v2  (tüm sayfalarda ortak)
   Sayfadaki <header class="header"> içeriğini yeniden kurar ve olayları bağlar.
   Not: Sayfa içi eski menü betiği bu düğümler değiştirildiği için devre dışı kalır.
   =========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- veri */
  var PRODUCTS = [
    { s: 'gofactory', n: 'GOFACTORY', m: 'Özel İçerik', md: 'Kuruma özel eğitim üretimi', ic: 'factory', c: '#30CC00', k: 'Özel dijital eğitim içerikleri', i: 'assets/logos/urun/gofactory-logo-tr.avif', d: 'Özel içerik üretimini keşfedin',
      t: 'Kuruma özel dijital öğrenme içerikleri — senaryodan teslimata',
      l: [['02-gofactory-icerik-uretimi.html', 'Genel Bakış']] },
    { s: 'golms', n: 'GOLMS', m: 'Öğrenme Platformu (LMS)', md: 'Eğitimi tek merkezden yönetin', ic: 'lms', c: '#0A2EDC', k: 'Kurumsal öğrenme platformu', i: 'assets/logos/urun/golms-logo-tr.avif', d: 'Öğrenme platformunu keşfedin',
      t: 'Eğitim operasyonunuzu tek merkezden yönetin',
      l: [['03-golms-ozellikler.html', 'Genel Bakış'], ['04-golms-api-entegrasyonlar.html', 'API ve Entegrasyonlar'], ['05-golms-fiyatlandirma.html', 'Fiyatlandırma']] },
    { s: 'golxp', n: 'GOLXP', m: 'Öğrenme Deneyimi Platformu (LXP)', md: 'Kişiye özel öğrenme deneyimi', ic: 'experience', c: '#5E17EB', k: 'Kişiselleştirilmiş öğrenme deneyimi', i: 'assets/logos/urun/golxp-logo-tr.avif', d: 'Kişiselleştirilmiş deneyimi keşfedin',
      t: 'Her çalışana kendi öğrenme deneyimi ve beceri haritası',
      l: [['06-golxp-ozellikler.html', 'Genel Bakış']] },
    { s: 'gocatalog', n: 'GOCATALOG', m: 'Eğitim Kataloğu', md: 'Hazır eğitim kütüphanesi', ic: 'catalog', c: '#FFBD59', k: 'Hazır dijital eğitim kataloğu', i: 'assets/logos/urun/gocatalog-logo-tr.avif', d: 'Eğitim kataloğunu keşfedin',
      t: 'Beklemeden başlayın: beş sağlayıcıdan hazır eğitim kütüphanesi',
      l: [['07-gocatalog-genel-bakis.html', 'Genel Bakış'], ['08-gocatalog-respongo-katalog.html', 'Respongo Kataloğu'], ['10-gocatalog-udemy-business.html', 'Udemy Business'], ['11-gocatalog-linkedin-learning.html', 'LinkedIn Learning'], ['12-gocatalog-cegos.html', 'Cegos'], ['13-gocatalog-iseazy-skills.html', 'isEazy Skills']] },
    { s: 'gotools', n: 'GOTOOLS', m: 'İçerik Araçları', md: 'Hızlı içerik üretim araçları', ic: 'tools', c: '#EB3081', k: 'İçerik geliştirme araçları', i: 'assets/logos/urun/gocatools-logo-tr.avif', d: 'İçerik araçlarını keşfedin',
      t: 'İçeriği kurum içinde, hızla ve kendi ekibinizle üretin',
      l: [['14-0-gotools-genel-bakis.html', 'Genel Bakış'], ['14-gotools-craft.html', 'Craft'], ['15-gotools-craft-fiyatlandirma.html', 'Craft Fiyatlandırma'], ['17-gotools-iseazy-author.html', 'isEazy Author'], ['18-gotools-iseazy-author-fiyatlandirma.html', 'Author Fiyatlandırma']] }
  ];

  var SOL = [
    ['20-cozum-yetenek-gelisimi.html', 'Yetenek Gelişimi', 'talent-growth'],
    ['21-cozum-calisan-oryantasyonu.html', 'Çalışan Oryantasyonu', 'employee-onboarding'],
    ['22-cozum-musteri-egitimi.html', 'Müşteri Eğitimi', 'customer-education'],
    ['23-cozum-uyum-egitimleri.html', 'Uyum Eğitimleri', 'compliance-training'],
    ['24-cozum-satis-etkinlestirme.html', 'Satış Etkinleştirme', 'sales-enablement'],
    ['25-cozum-genisletilmis-kurumsal.html', 'Genişletilmiş Kurumsal Eğitim', 'extended-enterprise']
  ];
  var SEK = [
    ['26-sektor-finansal-hizmetler.html', 'Finansal Hizmetler', 'financial-services'],
    ['27-sektor-saglik.html', 'Sağlık Hizmetleri', 'healthcare'],
    ['28-sektor-danismanlik.html', 'Danışmanlık', 'consulting'],
    ['29-sektor-kamu.html', 'Kamu', 'government'],
    ['30-sektor-uretim.html', 'Üretim', 'manufacturing'],
    ['31-sektor-yazilim.html', 'Yazılım', 'software'],
    ['32-sektor-perakende.html', 'Perakende', 'retail']
  ];
  var YET = [
    ['33-yetkinlik-bt-dijital.html', 'BT ve Dijital Yetkinlikler', 'digital-skills'],
    ['34-yetkinlik-is-becerileri.html', 'İş Yetkinlikleri', 'business-skills'],
    ['35-yetkinlik-ik-uyum.html', 'İK ve Uyum', 'hr-compliance'],
    ['36-yetkinlik-liderlik.html', 'Liderlik ve Yönetim', 'leadership'],
    ['37-yetkinlik-kisisel-gelisim.html', 'Kişilerarası ve Bireysel Gelişim', 'personal-growth'],
    ['38-yetkinlik-bankacilik-finans.html', 'Bankacılık ve Finans', 'banking-finance']
  ];
  var RES_A = [['39-kaynaklar-blog.html', 'Blog', 'Kurumsal öğrenme, teknoloji ve içerik tasarımında güncel bakış', 'blog'], ['40-kaynaklar-webinarlar.html', 'Web Seminerleri', 'Canlı oturumlar ve kayıtlarla uzman anlatımı', 'webinar'], ['43-kaynaklar-podcast.html', 'Podcast', 'Öğrenme dünyasından sohbetler ve saha deneyimleri', 'podcast']];
  var RES_B = [['41-kaynaklar-sozluk.html', 'L&amp;D Sözlüğü', 'LMS, LXP, SCORM, xAPI ve temel kavramlar A–Z', 'glossary'], ['42-kaynaklar-bulten.html', 'E-Bülten', 'Yeni içerikler ve güncellemeler gelen kutunuzda', 'newsletter']];
  var CUST = [['45-musteri-loreal.html', 'loreal', 'L’Oréal'], ['46-musteri-garanti-bbva.html', 'garantibbva', 'Garanti BBVA'], ['47-musteri-dominos.html', 'dominos', 'Domino’s'], ['48-musteri-coffy.html', 'coffy', 'Coffy'], ['49-musteri-samsung.html', 'samsung', 'Samsung'], ['50-musteri-etiya.html', 'etiya', 'Etiya']];
  var CUSTOMER_TRUST = [['anadolu-grubu', 'Anadolu Grubu'], ['halkbank', 'Halkbank'], ['lcwaikiki', 'LC Waikiki'], ['dogus-otomotiv', 'Doğuş Otomotiv'], ['aydem-enerji', 'Aydem Enerji']];
  var CO_A = [['52-sirket-hakkimizda.html', 'Respongo Hakkında', 'company'], ['53-sirket-neden-respongo.html', 'Neden Respongo?', 'target'], ['54-sirket-oduller.html', 'Ödüller ve Tanınırlık', 'award'], ['55-sirket-haberler.html', 'Haberler', 'news'], ['56-sirket-iletisim.html', 'İletişim', 'contact']];
  var CO_B = [['57-sirket-kariyer.html', 'Kariyer', 'career'], ['58-sirket-bizimle-calisin.html', 'İş Ortaklığı', 'handshake']];
  var CO_C = [['59-yasal-bildirimler.html', 'Yasal Bildirimler', 'legal'], ['60-yasal-kvkk-gdpr.html', 'KVKK Uyumluluğu', 'privacy'], ['61-yasal-soc2.html', 'Bilgi Güvenliği ve SOC 2', 'security']];

  /* ------------------------------------------------------------ yardımcı */
  function links(arr) { return arr.map(function (x) { return '<li><a href="' + x[0] + '">' + x[1] + '</a></li>'; }).join(''); }
  function col(label, arr) { return '<div class="mega-col"><p class="mega-label">' + label + '</p><ul>' + links(arr) + '</ul></div>'; }
  function pills(arr) { return arr.map(function (x) { return '<a href="' + x[0] + '">' + x[1] + '</a>'; }).join(''); }
  function productIcon(kind, className) {
    var icons = {
      factory: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5M10 13h5M10 17h5"/><path d="M3 7h3M4.5 5.5v3"/>',
      lms: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><path d="m8 10 4-2 4 2-4 2-4-2Zm2 1.2v2.3c1.2.8 2.8.8 4 0v-2.3"/>',
      experience: '<circle cx="8" cy="7" r="3"/><path d="M3 20c.4-4 2-6 5-6s4.6 2 5 6M15 5h5v5"/><path d="m15 10 5-5M15 15h5M17.5 12.5V18"/>',
      catalog: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"/>',
      tools: '<path d="m12 3 4 4-8.5 8.5L3 17l1.5-4.5L12 3Z"/><path d="m10 5 4 4M14.5 16.5h6M17.5 13.5v6M4 21h8"/>'
    };
    return '<span class="' + className + '" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">' + icons[kind] + '</svg></span>';
  }
  function menuIcon(kind) {
    var icons = {
      blog: '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6M9 19h4"/>',
      webinar: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="m10 9 5 2.5-5 2.5V9ZM8 21h8M12 18v3"/>',
      podcast: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
      newsletter: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
      glossary: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5V5.5Z"/>',
      news: '<path d="M4 11v4l11 4V7L4 11Z"/><path d="M15 10h3a2 2 0 0 1 0 4h-3M6 15l1 5h4"/>',
      customers: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M15 15c3 0 4.7 1.7 5 5"/>',
      pricing: '<path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1"/>',
      company: '<path d="M4 21V7l8-4 8 4v14M8 10h2M14 10h2M8 14h2M14 14h2M10 21v-3h4v3"/>',
      target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 7-7M16 5h3v3"/>',
      award: '<circle cx="12" cy="9" r="6"/><path d="m8 14-1 7 5-3 5 3-1-7M9.5 9l1.6 1.6L15 7"/>',
      contact: '<path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 9h8M8 13h5"/>',
      career: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2"/>',
      handshake: '<path d="m8 12 3-3a2 2 0 0 1 3 0l6 5-4 4-3-2-2 2-7-6 4-4 3 1"/><path d="m4 12-2-2 4-4 2 2M20 14l2-2"/>',
      network: '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><path d="m6.5 10.5 4-4M13.5 6.5l4 4M17.5 13.5l-4 4M10.5 17.5l-4-4"/>',
      legal: '<path d="M12 3v18M5 6h14M7 6l-4 7h8L7 6ZM17 6l-4 7h8l-4-7ZM8 21h8"/>',
      privacy: '<circle cx="9" cy="8" r="3"/><path d="M3 20c.5-4 2.5-6 6-6 1.4 0 2.6.3 3.5 1"/><rect x="14" y="13" width="7" height="7" rx="1.5"/><path d="M16 13v-2a1.5 1.5 0 0 1 3 0v2"/>',
      security: '<path d="M12 3 4 6v5c0 5 3 8 8 10 5-2 8-5 8-10V6l-8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
      'talent-growth': '<path d="M4 20V10M10 20V6M16 20V3"/><path d="m3 8 6-5 4 3 7-4M17 2h3v3"/>',
      'employee-onboarding': '<circle cx="9" cy="8" r="3"/><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M18 8v6M15 11h6"/>',
      'customer-education': '<path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 12v4c2.8 2 7.2 2 10 0v-4M21 9v6"/>',
      'compliance-training': '<path d="M12 3 4 6v5c0 5 3 8 8 10 5-2 8-5 8-10V6l-8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
      'sales-enablement': '<path d="M4 19V5M4 19h16"/><path d="m7 15 4-4 3 2 6-7M16 6h4v4"/>',
      'extended-enterprise': '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><circle cx="12" cy="13" r="2.5"/><path d="m12 7 .1 3.5M10 14.5 6.5 17M14 14.5l3.5 2.5"/>',
      'financial-services': '<path d="m3 9 9-5 9 5H3ZM5 19h14M3 22h18M6 9v10M10 9v10M14 9v10M18 9v10"/>',
      healthcare: '<path d="M20.8 8.5c0 5-8.8 10.5-8.8 10.5S3.2 13.5 3.2 8.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.8 1.5Z"/><path d="M8 11h2l1-2 2 5 1-3h2"/>',
      consulting: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2"/>',
      government: '<path d="m3 9 9-5 9 5H3ZM5 19h14M3 22h18M7 9v10M12 9v10M17 9v10"/>',
      manufacturing: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/><circle cx="12" cy="12" r="7"/>',
      software: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
      retail: '<path d="M4 10v10h16V10M3 10l2-6h14l2 6"/><path d="M3 10c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0M9 20v-5h6v5"/>',
      'digital-skills': '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="m9 9-2 2 2 2M15 9l2 2-2 2M13 8l-2 6M8 21h8M12 18v3"/>',
      'business-skills': '<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M7 15v-3M12 15V8M17 15v-5M8 22h8M12 19v3"/>',
      'hr-compliance': '<circle cx="8" cy="8" r="3"/><path d="M2 20c.5-4 2.5-6 6-6 1.3 0 2.5.3 3.4.9"/><path d="M17 11.5 12 13.4v3.1c0 3 1.9 4.8 5 6 3.1-1.2 5-3 5-6v-3.1l-5-1.9Z"/><path d="m14.8 16.8 1.4 1.4 3-3"/>',
      leadership: '<path d="M5 22V3"/><path d="M6 4h11l-2.5 4L17 12H6"/>',
      'personal-growth': '<circle cx="10" cy="8" r="3"/><path d="M3 21c.5-4.5 2.8-7 7-7 2.2 0 3.9.7 5 2"/><path d="M18 3v4M16 5h4M19 11v3M17.5 12.5h3"/>',
      'banking-finance': '<ellipse cx="9" cy="7" rx="5" ry="2.5"/><path d="M4 7v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7M4 11v4c0 1.4 2.2 2.5 5 2.5 1.2 0 2.3-.2 3.2-.6"/><ellipse cx="16" cy="15" rx="5" ry="2.5"/><path d="M11 15v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4"/>'
    };
    return '<span class="menu-item-icon" data-icon="' + kind + '" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + icons[kind] + '</svg></span>';
  }
  function iconCol(label, arr) {
    return '<div class="mega-col company-icon-col"><p class="mega-label">' + label + '</p><ul>' + arr.map(function (x) {
      return '<li><a class="company-icon-link" href="' + x[0] + '">' + menuIcon(x[2]) + '<span>' + x[1] + '</span></a></li>';
    }).join('') + '</ul></div>';
  }
  function solutionIconCol(label, arr) {
    return '<div class="mega-col solution-icon-col"><p class="mega-label">' + label + '</p><ul>' + arr.map(function (x) {
      return '<li><a class="solution-icon-link" href="' + x[0] + '">' + menuIcon(x[2]) + '<span>' + x[1] + '</span></a></li>';
    }).join('') + '</ul></div>';
  }
  function feature(img, h4, p, ctaT, ctaH) {
    return '<div class="mega-feature">' +
      '<img class="mf-img" src="' + img + '" alt="" aria-hidden="true" loading="lazy" decoding="async">' +
      '<div class="mf-body"><h4>' + h4 + '</h4><p>' + p + '</p><a class="btn btn-white" href="' + ctaH + '">' + ctaT + '</a></div></div>';
  }
  function foot(label, arr) { return '<div class="mega-foot"><span class="mf-k">' + label + '</span>' + pills(arr) + '</div>'; }

  function currentSection() {
    var f = (location.pathname.split('/').pop() || '01-ana-sayfa.html');
    var n = parseInt(f.split('-')[0], 10);
    if (isNaN(n)) return '';
    if (n >= 2 && n <= 19) return 'urunler';
    if (n >= 20 && n <= 38) return 'cozumler';
    if (n >= 39 && n <= 43) return 'kaynaklar';
    if (n >= 44 && n <= 51) return 'musteriler';
    if (n >= 52 && n <= 61) return 'sirket';
    return '';
  }

  function currentProduct() {
    var f = (location.pathname.split('/').pop() || '01-ana-sayfa.html');
    var n = parseInt(f.split('-')[0], 10);
    if (n === 2) return 'gofactory';
    if (n >= 3 && n <= 5) return 'golms';
    if (n === 6) return 'golxp';
    if (n >= 7 && n <= 13) return 'gocatalog';
    if (n >= 14 && n <= 19) return 'gotools';
    return 'gofactory';
  }

  /* ------------------------------------------------------------- markup */
  function build() {
    var cur = currentSection();
    function c(k) { return cur === k ? ' class="cur"' : ''; }

    var initialProduct = currentProduct();
    var productTabs = PRODUCTS.map(function (p) {
      var active = p.s === initialProduct;
      return '<button class="prod-tab' + (active ? ' active' : '') + '" type="button" role="tab" id="prod-tab-' + p.s + '" ' +
        'aria-controls="prod-panel-' + p.s + '" aria-selected="' + active + '" tabindex="' + (active ? '0' : '-1') + '" data-product="' + p.s + '" style="--pa:' + p.c + '">' +
        productIcon(p.ic, 'prod-tab-symbol') +
        '<span class="prod-tab-copy"><b>' + p.m + '</b><small>' + p.md + '</small></span>' +
        '<span class="prod-tab-arrow" aria-hidden="true">&#8250;</span></button>';
    }).join('');

    var productPanels = PRODUCTS.map(function (p) {
      var active = p.s === initialProduct;
      var detailLinks = p.l.map(function (x) {
        return '<a class="prod-detail-link" href="' + x[0] + '"><span>' + x[1] + '</span><span aria-hidden="true">&#8599;</span></a>';
      }).join('');
      var ctaText = p.s === 'gofactory' ? 'Projenizi Anlatın' : 'Demo Talep Edin';
      var ctaHref = p.s === 'gofactory' ? '56-sirket-iletisim.html' : '62-demo-talep.html';
      return '<section class="prod-panel' + (active ? ' active' : '') + '" role="tabpanel" id="prod-panel-' + p.s + '" ' +
        'aria-labelledby="prod-tab-' + p.s + '" data-product-panel="' + p.s + '"' + (active ? '' : ' hidden') + ' style="--pa:' + p.c + '">' +
        '<div class="prod-panel-head"><div class="prod-panel-brand"><span class="prod-panel-logo-wrap"><img class="prod-panel-logo" src="' + p.i + '" alt="' + p.n + ' logosu"></span><span class="prod-panel-kicker">' + p.k + '</span></div>' +
        '<a class="prod-discover" href="' + p.l[0][0] + '">' + p.d + ' <span aria-hidden="true">&#8594;</span></a>' +
        '<p>' + p.t + '</p></div>' +
        '<div class="prod-detail-links">' + detailLinks + '</div>' +
        '<a class="prod-panel-cta" href="' + ctaHref + '"><span><b>Bir sonraki adımı birlikte planlayalım</b><small>İhtiyacınıza uygun ürün ve içerik yapısını netleştirelim.</small></span><strong>' + ctaText + ' <span aria-hidden="true">&#8594;</span></strong></a>' +
        '</section>';
    }).join('');

    var navItems = [['urunler', 'Ürünler'], ['cozumler', 'Çözümler'], ['kaynaklar', 'Kaynaklar'], ['musteriler', 'Müşteriler'], ['sirket', 'Şirket']]
      .map(function (x) {
        return '<li><button' + c(x[0]) + ' type="button" aria-expanded="false" data-mega="mega-' + x[0] + '">' + x[1] + ' <span class="caret"></span></button></li>';
      }).join('');

    var h = '';

    /* üst bar */
    h += '<div class="nav-wrap">' +
      '<a class="brand" href="01-ana-sayfa.html" aria-label="Respongo ana sayfa"><img src="assets/logos/respongo-t.avif" alt="Respongo — 360° Öğrenme Teknolojileri"></a>' +
      '<ul class="main-nav" id="mainNav">' + navItems + '</ul>' +
      '<div class="nav-right">' +
      '<div class="lang" aria-label="Dil seçimi"><a href="#" class="active" aria-current="true">TR</a><span aria-hidden="true">|</span><a href="#">EN</a></div>' +
      '<a class="btn btn-outline" href="56-sirket-iletisim.html">Teklif Alın</a>' +
      '<a class="btn btn-primary" href="62-demo-talep.html">Demo Talep Edin</a>' +
      '<button class="hamburger" id="hamburger" type="button" aria-label="Menüyü aç" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>' +
      '</div></div>';

    /* ÜRÜNLER */
    h += '<div class="mega" id="mega-urunler" role="region" aria-label="Ürünler menüsü"><div class="mega-inner mega-products">' +
      '<p class="mega-label product-mega-label">Ürün Ekosistemi</p>' +
      '<div class="product-explorer"><div class="product-tabs" role="tablist" aria-label="Respongo ürünleri">' + productTabs + '</div>' +
      '<div class="product-panels">' + productPanels + '</div></div>' +
      '</div></div>';

    /* ÇÖZÜMLER */
    h += '<div class="mega" id="mega-cozumler" role="region" aria-label="Çözümler menüsü"><div class="mega-inner mega-cols">' +
      solutionIconCol('Eğitim İhtiyacına Göre', SOL) + solutionIconCol('Sektöre Göre', SEK) + solutionIconCol('Yetkinliğe Göre', YET) +
      feature('assets/img/sol-yetenek-c.avif', 'Çözümü, ihtiyacın başladığı yerden kuruyoruz',
        'Hedefinize, sektörünüze ve yetkinlik haritanıza göre yapılandırılmış öğrenme çözümleri.',
        'Uzmanla Görüşün', '56-sirket-iletisim.html') +
      foot('Nereden başlamalı', [['44-musteriler.html', 'Müşteri Hikâyeleri'], ['07-gocatalog-genel-bakis.html', 'Hazır Katalog'], ['02-gofactory-icerik-uretimi.html', 'Kuruma Özel İçerik'], ['62-demo-talep.html', 'Demo Talep Edin']]) +
      '</div></div>';

    /* KAYNAKLAR */
    function resCol(label, arr) {
      return '<div><p class="mega-label">' + label + '</p>' + arr.map(function (x) {
        return '<a class="res-item" href="' + x[0] + '">' + menuIcon(x[3]) + '<span class="res-copy"><b>' + x[1] + '</b><span>' + x[2] + '</span></span></a>';
      }).join('') + '</div>';
    }
    h += '<div class="mega" id="mega-kaynaklar" role="region" aria-label="Kaynaklar menüsü"><div class="mega-inner mega-res">' +
      resCol('İçerikler', RES_A) + resCol('Referans ve Keşfet', RES_B) +
      feature('assets/img/blog-1-c.avif', 'LMS mi, LXP mi?',
        'Doğru öğrenme teknolojisi kararını vermenize yardımcı olacak karşılaştırmalı yazımızı okuyun.',
        'Yazıyı Okuyun', '39-1-blog-detay.html') +
      '</div></div>';

    /* MÜŞTERİLER */
    h += '<div class="mega" id="mega-musteriler" role="region" aria-label="Müşteriler menüsü"><div class="mega-inner mega-customers">' +
      '<div class="customer-menu-main"><p class="mega-label">Müşteri Hikâyeleri</p><div class="customer-story-grid">' +
      CUST.map(function (x) { return '<a class="customer-story-logo" href="' + x[0] + '" aria-label="' + x[2] + ' müşteri hikâyesi"><img src="assets/musteri/' + x[1] + '-t.avif" alt="' + x[2] + '" loading="lazy" decoding="async"></a>'; }).join('') +
      '</div><a class="customer-all-link" href="44-musteriler.html">Tüm müşteri hikâyelerini keşfedin <span aria-hidden="true">→</span></a>' +
      '<p class="customer-trust-copy">400’den fazla kurum öğrenme teknolojilerinde Respongo’ya güveniyor.</p>' +
      '<div class="customer-trust-row">' + CUSTOMER_TRUST.map(function (x) {
        return '<a class="customer-trust-logo" href="44-musteriler.html" aria-label="' + x[1] + '"><img src="assets/musteri/' + x[0] + '-t.avif" alt="' + x[1] + '" loading="lazy" decoding="async"></a>';
      }).join('') + '</div></div>' +
      feature('assets/img/case-1-c.avif', 'Öğrenme sahaya dokunduğunda değer üretir',
        'Farklı sektörlerde, farklı ölçeklerde, aynı hedef: öğrenmenin iş sonucuna dönüşmesi.',
        'Hikâyeleri İnceleyin', '44-musteriler.html') +
      '</div></div>';

    /* ŞİRKET */
    h += '<div class="mega" id="mega-sirket" role="region" aria-label="Şirket menüsü"><div class="mega-inner mega-cols">' +
      iconCol('Kurumsal', CO_A) + iconCol('Bizimle Çalışın', CO_B) + iconCol('Yasal ve Güvenlik', CO_C) +
      feature('assets/img/film-c.avif', '17+ yıldır öğrenme sistemleri kuruyoruz',
        'İçerik, teknoloji ve danışmanlığı tek çatı altında birleştiren iş ortağınız.',
        'Respongo’yu Tanıyın', '52-sirket-hakkimizda.html') +
      foot('Hızlı erişim', [['56-sirket-iletisim.html', 'İletişim'], ['57-sirket-kariyer.html', 'Açık Pozisyonlar'], ['54-sirket-oduller.html', 'Ödüller'], ['62-demo-talep.html', 'Demo Talep Edin']]) +
      '</div></div>';

    /* MOBİL MENÜ */
    var mProd = PRODUCTS.map(function (p) {
      return '<div class="m-prod" style="--pa:' + p.c + '"><button class="m-prod-toggle" type="button" aria-expanded="false" aria-controls="m-prod-panel-' + p.s + '">' +
        productIcon(p.ic, 'm-prod-symbol') + '<span class="m-prod-copy"><b>' + p.m + '</b><small>' + p.md + '</small></span><span class="m-prod-caret" aria-hidden="true"></span></button>' +
        '<div class="m-sub" id="m-prod-panel-' + p.s + '" hidden><div class="m-prod-links">' + pills(p.l) + '</div></div></div>';
    }).join('');

    function mList(groups) {
      return groups.map(function (g) {
        return '<p class="mega-label">' + g[0] + '</p>' + g[1].map(function (x) { return '<a href="' + x[0] + '">' + x[1] + '</a>'; }).join('');
      }).join('');
    }

    h += '<nav class="mobile-menu" id="mobileMenu" aria-label="Mobil menü">' +
      '<div class="m-head">' +
      '<a class="brand" href="01-ana-sayfa.html" aria-label="Respongo ana sayfa"><img src="assets/logos/respongo-t.avif" alt="Respongo"></a>' +
      '<button class="m-close" id="mClose" type="button" aria-label="Menüyü kapat"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '</div><div class="m-body">' +
      '<div class="m-group m-products-group"><button type="button" aria-expanded="false">Ürünler</button><div class="m-panel">' + mProd + '</div></div>' +
      '<div class="m-group"><button type="button" aria-expanded="false">Çözümler</button><div class="m-panel">' + mList([['Eğitim İhtiyacına Göre', SOL], ['Sektöre Göre', SEK], ['Yetkinliğe Göre', YET]]) + '</div></div>' +
      '<div class="m-group"><button type="button" aria-expanded="false">Kaynaklar</button><div class="m-panel">' +
      RES_A.concat(RES_B).map(function (x) { return '<a href="' + x[0] + '">' + x[1] + '</a>'; }).join('') + '</div></div>' +
      '<div class="m-group"><button type="button" aria-expanded="false">Müşteriler</button><div class="m-panel">' +
      '<a href="44-musteriler.html">Tüm Müşteri Hikâyeleri</a>' +
      CUST.map(function (x) { return '<a href="' + x[0] + '">' + x[2] + '</a>'; }).join('') +
      '<a href="51-musteri-etcbase.html">EtcBASE</a></div></div>' +
      '<div class="m-group"><button type="button" aria-expanded="false">Şirket</button><div class="m-panel">' +
      mList([['Kurumsal', CO_A], ['Bizimle Çalışın', CO_B], ['Yasal ve Güvenlik', CO_C]]) + '</div></div>' +
      '<div class="m-quick"><a href="05-golms-fiyatlandirma.html">Fiyatlandırma</a><a href="07-gocatalog-genel-bakis.html">Hazır Katalog</a><a href="39-kaynaklar-blog.html">Blog</a><a href="56-sirket-iletisim.html">İletişim</a></div>' +
      '<div class="m-meta"><span>Beşiktaş / İstanbul</span><span class="lang"><a href="#" class="active" aria-current="true">TR</a><span aria-hidden="true">|</span><a href="#">EN</a></span></div>' +
      '</div>' +
      '<div class="m-ctas"><a class="btn btn-outline" href="56-sirket-iletisim.html">Teklif Alın</a><a class="btn btn-primary" href="62-demo-talep.html">Demo Talep Edin</a></div>' +
      '</nav>';

    return h;
  }

  /* -------------------------------------------------------------- olaylar */
  function bind(header, externalMenu) {
    var buttons = header.querySelectorAll('[data-mega]');
    var megas = header.querySelectorAll('.mega');
    var timer;

    function closeAll(keep) {
      megas.forEach(function (m) { if (m.id !== keep) m.classList.remove('open'); });
      buttons.forEach(function (b) { if (b.dataset.mega !== keep) b.setAttribute('aria-expanded', 'false'); });
    }
    function openMega(id, btn) {
      clearTimeout(timer);
      closeAll(id);
      var el = document.getElementById(id);
      if (el) { el.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    }
    buttons.forEach(function (btn) {
      var id = btn.dataset.mega;
      btn.addEventListener('click', function () {
        var el = document.getElementById(id);
        if (el && el.classList.contains('open')) { closeAll(); btn.setAttribute('aria-expanded', 'false'); }
        else { openMega(id, btn); }
      });
      btn.addEventListener('mouseenter', function () { if (window.matchMedia('(min-width:1101px)').matches) openMega(id, btn); });
    });
    header.addEventListener('mouseleave', function () { timer = setTimeout(function () { closeAll(); }, 180); });
    header.addEventListener('mouseenter', function () { clearTimeout(timer); });
    document.addEventListener('click', function (e) { if (!header.contains(e.target)) closeAll(); });

    /* masaüstü ürün gezgini */
    var productTabs = Array.prototype.slice.call(header.querySelectorAll('.prod-tab'));
    var productPanels = Array.prototype.slice.call(header.querySelectorAll('.prod-panel'));
    function setActiveProduct(slug, moveFocus) {
      productTabs.forEach(function (tab) {
        var active = tab.dataset.product === slug;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && moveFocus) tab.focus();
      });
      productPanels.forEach(function (panel) {
        var active = panel.dataset.productPanel === slug;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
      });
    }
    productTabs.forEach(function (tab, index) {
      tab.addEventListener('mouseenter', function () {
        if (window.matchMedia('(min-width:1101px)').matches) setActiveProduct(tab.dataset.product, false);
      });
      tab.addEventListener('click', function () { setActiveProduct(tab.dataset.product, false); });
      tab.addEventListener('focus', function () { setActiveProduct(tab.dataset.product, false); });
      tab.addEventListener('keydown', function (e) {
        var next = index;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (index + 1) % productTabs.length;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (index - 1 + productTabs.length) % productTabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = productTabs.length - 1;
        else return;
        e.preventDefault();
        setActiveProduct(productTabs[next].dataset.product, true);
      });
    });

    /* mobil */
    var menu = externalMenu || header.querySelector('#mobileMenu');
    var hb = header.querySelector('#hamburger');
    var cb = menu ? menu.querySelector('#mClose') : header.querySelector('#mClose');
    function closeMobile() {
      if (!menu) return;
      menu.classList.remove('open');
      if (hb) hb.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      closeMobileProducts();
    }
    if (hb && menu) {
      hb.addEventListener('click', function () {
        var o = menu.classList.toggle('open');
        hb.setAttribute('aria-expanded', String(o));
        document.body.style.overflow = o ? 'hidden' : '';
      });
    }
    if (cb) cb.addEventListener('click', closeMobile);
    if (menu) menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMobile); });

    var mobileProducts = menu ? Array.prototype.slice.call(menu.querySelectorAll('.m-prod')) : [];
    function closeMobileProducts(keep) {
      mobileProducts.forEach(function (item) {
        if (item === keep) return;
        item.classList.remove('open');
        var toggle = item.querySelector('.m-prod-toggle');
        var panel = item.querySelector('.m-sub');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
        if (panel) panel.hidden = true;
      });
    }
    mobileProducts.forEach(function (item) {
      var toggle = item.querySelector('.m-prod-toggle');
      var panel = item.querySelector('.m-sub');
      if (!toggle || !panel) return;
      toggle.addEventListener('click', function () {
        var open = !item.classList.contains('open');
        closeMobileProducts(open ? item : null);
        item.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
      });
    });

    if (menu) menu.querySelectorAll('.m-group > button').forEach(function (b) {
      b.addEventListener('click', function () {
        var o = b.parentElement.classList.toggle('open');
        b.setAttribute('aria-expanded', String(o));
        if (!o && b.parentElement.classList.contains('m-products-group')) closeMobileProducts();
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeAll(); closeMobile(); }
    });
  }

  /* --------------------------------------------------------------- footer */
  function buildFooter() {
    function fcol(t, arr) {
      return '<div class="footer-col"><h4>' + t + '</h4><ul>' +
        arr.map(function (x) { return '<li><a href="' + x[0] + '">' + x[1] + '</a></li>'; }).join('') + '</ul></div>';
    }
    return '<div class="footer-top">' +
      '<div class="footer-brand">' +
      '<img src="assets/logos/respongo-white-t.avif" alt="Respongo — 360° Öğrenme Teknolojileri">' +
      '<p>Öğrenmeyi tasarlar, teknolojiyi kurar, gelişimi görünür kılarız.</p>' +
      '<div class="social">' +
      '<a href="https://www.linkedin.com/company/respongo" target="_blank" rel="noopener noreferrer" aria-label="Respongo LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.53 4.78 5.82V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.2 1.45-2.2 2.96V21h-4V9Z"/></svg></a>' +
      '<a href="https://www.instagram.com/respongocom" target="_blank" rel="noopener noreferrer" aria-label="Respongo Instagram"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.98c-3.15 0-3.52.01-4.76.07-1.15.05-1.77.24-2.19.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.42-.35 1.04-.4 2.19-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05 1.15.24 1.77.4 2.19.22.55.47.94.88 1.35.41.41.8.66 1.35.88.42.16 1.04.35 2.19.4 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.15-.05 1.77-.24 2.19-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.42.35-1.04.4-2.19.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.15-.24-1.77-.4-2.19a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.42-.16-1.04-.35-2.19-.4-1.24-.06-1.61-.07-4.76-.07Zm0 3.37a4.49 4.49 0 1 1 0 8.98 4.49 4.49 0 0 1 0-8.98Zm0 7.4a2.91 2.91 0 1 0 0-5.82 2.91 2.91 0 0 0 0 5.82Zm5.72-7.6a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0Z"/></svg></a>' +
      '<a href="https://www.youtube.com/@respongo" target="_blank" rel="noopener noreferrer" aria-label="Respongo YouTube"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81ZM10 15.02V8.98L15.2 12 10 15.02Z"/></svg></a>' +
      '<a href="https://www.facebook.com/respongocom" target="_blank" rel="noopener noreferrer" aria-label="Respongo Facebook"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.470h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z"/></svg></a>' +
      '</div>' +
      '</div>' +
      fcol('Ürünler', [['02-gofactory-icerik-uretimi.html', 'GOFACTORY'], ['03-golms-ozellikler.html', 'GOLMS'], ['06-golxp-ozellikler.html', 'GOLXP'], ['07-gocatalog-genel-bakis.html', 'GOCATALOG'], ['14-0-gotools-genel-bakis.html', 'GOTOOLS']]) +
      fcol('Çözümler', [['20-cozum-yetenek-gelisimi.html', 'Eğitim İhtiyacına Göre'], ['26-sektor-finansal-hizmetler.html', 'Sektöre Göre'], ['33-yetkinlik-bt-dijital.html', 'Yetkinliğe Göre'], ['05-golms-fiyatlandirma.html', 'Fiyatlandırma'], ['62-demo-talep.html', 'Demo Talep Edin']]) +
      fcol('Kaynaklar', [['39-kaynaklar-blog.html', 'Blog'], ['40-kaynaklar-webinarlar.html', 'Web Seminerleri'], ['43-kaynaklar-podcast.html', 'Podcast'], ['41-kaynaklar-sozluk.html', 'L&amp;D Sözlüğü'], ['42-kaynaklar-bulten.html', 'E-Bülten'], ['55-sirket-haberler.html', 'Haberler']]) +
      fcol('Şirket', [['52-sirket-hakkimizda.html', 'Respongo Hakkında'], ['53-sirket-neden-respongo.html', 'Neden Respongo?'], ['54-sirket-oduller.html', 'Ödüller'], ['44-musteriler.html', 'Müşteri Hikâyeleri'], ['57-sirket-kariyer.html', 'Kariyer'], ['58-sirket-bizimle-calisin.html', 'Bizimle Çalışın'], ['56-sirket-iletisim.html', 'İletişim']]) +
      fcol('Yasal ve Uyumluluk', [['59-yasal-bildirimler.html', 'Yasal Bildirimler'], ['60-yasal-kvkk-gdpr.html', 'KVKK Uyumluluğu'], ['61-yasal-soc2.html', '<span class="footer-soc2-nowrap">Bilgi Güvenliği ve SOC 2</span>']]) +
      '</div>' +
      '<div class="footer-bottom"><span>© 2026 Respongo. Tüm hakları saklıdır.</span>' +
      '<div class="lang"><a href="#" class="active" aria-current="true">Türkçe</a><span aria-hidden="true">|</span><a href="#">English</a></div></div>';
  }

  /* ------------------------------------------------- gövde bağlantı onarımı
     Sayfa gövdesinde şablondan gelen href="#" CTA'ları etiketlerine göre gerçek
     sayfalara bağlar. Geçici köprü: menü statik HTML'e gömülürken bu harita da
     sayfalara yazılacak ve buradan kaldırılacak. Bkz. docs/MENU-V2.md
     ------------------------------------------------------------------------- */
  var CTA_MAP = {
    'Demo Talep Edin': '62-demo-talep.html',
    'Demo Talebi Oluşturun': '62-demo-talep.html',
    'Teklif Alın': '56-sirket-iletisim.html',
    'Size Özel Teklif Alın': '56-sirket-iletisim.html',
    'Uzmanla Görüşün': '56-sirket-iletisim.html',
    'İletişime Geçin': '56-sirket-iletisim.html',
    'Bilgi Alın': '56-sirket-iletisim.html',
    'Bize Ulaşın': '56-sirket-iletisim.html',
    'Projenizi Anlatın': '56-sirket-iletisim.html',
    'Katalog Talep Edin': '56-sirket-iletisim.html',
    'Katalog Bilgisi Alın': '56-sirket-iletisim.html',
    'Broşürü İsteyin': '56-sirket-iletisim.html',
    'Respongo’yu Tanıyın': '52-sirket-hakkimizda.html',
    "Respongo'yu Tanıyın": '52-sirket-hakkimizda.html',
    'Müşteri Hikâyeleri': '44-musteriler.html',
    'Başarı Hikâyelerini İnceleyin': '44-musteriler.html',
    'Tüm Müşterilerimiz': '44-musteriler.html',
    'Kataloğu İnceleyin': '08-gocatalog-respongo-katalog.html',
    'Kataloğu Keşfedin': '07-gocatalog-genel-bakis.html',
    'Rehberi Okuyun': '39-1-blog-detay.html',
    'Blog': '39-kaynaklar-blog.html',
    'Sözlük': '41-kaynaklar-sozluk.html',
    'Podcast': '43-kaynaklar-podcast.html',
    'E-Bülten': '42-kaynaklar-bulten.html',
    'Webinarlar': '40-kaynaklar-webinarlar.html',
    'Benzer Bir Proje Planlayın': '62-demo-talep.html',
    'Teknik Görüşme Talep Edin': '62-demo-talep.html',
    'Detaylı 10 adımlı süreci inceleyin': '56-sirket-iletisim.html'
  };
  var CRUMB_MAP = {
    'Ürünler': '01-ana-sayfa.html#urunler',
    'Çözümler': '20-cozum-yetenek-gelisimi.html',
    'Sektörler': '26-sektor-finansal-hizmetler.html',
    'Yetkinlikler': '33-yetkinlik-bt-dijital.html',
    'Kaynaklar': '39-kaynaklar-blog.html',
    'Müşteriler': '44-musteriler.html',
    'Şirket': '52-sirket-hakkimizda.html',
    'Yasal': '59-yasal-bildirimler.html',
    'GOCATALOG': '07-gocatalog-genel-bakis.html',
    'GOTOOLS': '14-0-gotools-genel-bakis.html'
  };
  function repairLinks() {
    var here = (location.pathname.split('/').pop() || '');
    document.querySelectorAll('main a[href="#"], .crumbs a[href="#"]').forEach(function (a) {
      var t = (a.textContent || '').trim();
      var map = a.closest('.crumbs') ? CRUMB_MAP : CTA_MAP;
      var to = map[t];
      if (to && to.split('#')[0] !== here) a.setAttribute('href', to);
    });
  }

  /* ------------------------------------------------- aktif sayfa vurgusu
     Mega menü / mobil menü / footer içinde, o an açık olduğumuz sayfaya
     giden linki görsel olarak işaretler (yalnızca üst kategori değil,
     panel içindeki tam eşleşen link de dahil).
     ------------------------------------------------------------------------- */
  function injectActiveLinkStyle() {
    if (document.getElementById('nav-active-link-style')) return;
    var s = document.createElement('style');
    s.id = 'nav-active-link-style';
    s.textContent =
      '.mega a.cur-link,.mobile-menu a.cur-link,.footer a.cur-link{color:var(--blue,#0A2EDC);font-weight:800}' +
      '.mega-col ul a.cur-link{background:var(--surface,#F4F3FA)}' +
      '.prod-links a.cur-link{background:var(--blue,#0A2EDC);color:#fff}' +
      '.res-item.cur-link b{color:var(--blue,#0A2EDC)}' +
      '.cust-links a.cur-link{border-color:var(--blue,#0A2EDC)}' +
      '.footer-col a.cur-link{text-decoration:underline}';
    document.head.appendChild(s);
  }

  /* ------------------------------------------------- müşteri logosu şeridi
     Sayfalarda tanımlı .marquee-track animasyonu bazı ortamlarda (özellikle
     işletim sisteminde "hareketi azalt" açıksa) duruyormuş gibi görünüyordu.
     Bu dekoratif logo şeridi için hızı standartlaştırıyor ve azaltılmış
     hareket ayarını görmezden gelerek her zaman akmasını garanti ediyoruz.
     ------------------------------------------------------------------------- */
  function enforceLogoMarquee() {
    if (!document.getElementById('nav-marquee-style')) {
      var s = document.createElement('style');
      s.id = 'nav-marquee-style';
      s.textContent =
        '.marquee-track{animation-name:rsp-scroll4 !important;animation-duration:var(--mq-duration,34s) !important;animation-timing-function:linear !important;animation-iteration-count:infinite !important;gap:0 !important}' +
        '@keyframes rsp-scroll4{to{transform:translateX(calc(-1 * var(--mq-distance,50%)))}}' +
        '.marquee-track .mq-set{display:flex;align-items:center;flex-wrap:nowrap}' +
        '.marquee-track .mq-logo{display:flex;align-items:center;justify-content:center;width:210px;height:88px;margin-right:40px;flex:0 0 auto}' +
        '.marquee-track .mq-logo img{height:40px !important;max-width:176px !important;width:auto !important;margin:0 !important;object-fit:contain;transform:scale(var(--logo-scale,1));flex:0 0 auto}' +
        '.marquee:hover .marquee-track,.marquee:focus-within .marquee-track{animation-play-state:paused !important}' +
        '@media(max-width:640px){.marquee-track .mq-logo{width:180px;height:72px;margin-right:24px}.marquee-track .mq-logo img{height:32px !important;max-width:180px !important}}' +
        '@media(prefers-reduced-motion:reduce){.marquee-track{display:flex !important;width:max-content !important;flex-wrap:nowrap !important}.marquee-track .mq-set{display:flex !important;flex-wrap:nowrap !important}}';
      document.head.appendChild(s);
    }
    /* Logo şeridi her kopyayı kendi .mq-set kapsayıcısında tutar. Set içi
       boşluklar imglere margin-right olarak verildiği için her setin tam
       genişliği (set + kapanış boşluğu) ölçüme gerek duymadan eşittir;
       translateX(-100% / set sayısı) her döngüde tam bir set kayar.
       Böylece oransal kaymaların neden olduğu döngü atlama ve sağda
       boşluk kalması sorunları ortadan kalkar. */
    document.querySelectorAll('.marquee-track').forEach(function (track) {
      if (track.getAttribute('data-rsp-mq') === '1') return;
      track.setAttribute('data-rsp-mq', '1');
      var base = Array.prototype.slice.call(track.children).filter(function (el) {
        return el.getAttribute('aria-hidden') !== 'true';
      });
      if (base.length < 2) return;
      function makeSet(ariaHidden) {
        var set = document.createElement('div');
        set.className = 'mq-set';
        if (ariaHidden) set.setAttribute('aria-hidden', 'true');
        base.forEach(function (el) {
          var clone = el.cloneNode(true);
          clone.setAttribute('loading', 'eager');
          if (ariaHidden) { clone.setAttribute('aria-hidden', 'true'); clone.setAttribute('alt', ''); }
          var slot = document.createElement('span');
          slot.className = 'mq-logo';
          slot.appendChild(clone);
          set.appendChild(slot);
        });
        return set;
      }
      track.innerHTML = '';
      var firstSet = makeSet(false);
      track.appendChild(firstSet);
      function updateMetrics() {
        var setWidth = firstSet.scrollWidth;
        if (!setWidth) return;
        var duration = Math.max(34, setWidth / 82);
        track.style.setProperty('--mq-distance', setWidth + 'px');
        track.style.setProperty('--mq-duration', duration.toFixed(2) + 's');
      }
      firstSet.querySelectorAll('img').forEach(function (img) {
        if (!img.complete) img.addEventListener('load', updateMetrics, { once: true });
      });
      updateMetrics();
      var copies = 1;
      track.appendChild(makeSet(true));
      copies++;
      var marqueeWidth = track.parentElement ? track.parentElement.clientWidth : window.innerWidth;
      while (track.scrollWidth < Math.max(window.innerWidth * 2, marqueeWidth * 2) && copies < 12) {
        track.appendChild(makeSet(true));
        copies++;
      }
      track.style.setProperty('--mq-sets', String(copies));
    });
  }

  /* ------------------------------------------------- ürün sayfalarında
     kaydırma davranışı: aşağı kaydırınca üst menü (header) gizlenir, alt
     menü (subnav) sayfanın en üstüne yapışarak onun yerini alır; üst kısma
     çok yaklaşınca (MIN_Y) üst menü geri gelir. Küçük yukarı kaydırmalarda
     üst menü anında görünmez — sadece üst bölgeye dönünce açılır. Sadece
     .subnav bulunan sayfalarda çalışır (yalnızca Ürünler ailesi 02-19).
     ------------------------------------------------------------------------- */
  function setupScrollHide() {
    var subnav = document.querySelector('.subnav');
    if (!subnav) return;
    var body = document.body;
    var lastY = window.scrollY || window.pageYOffset || 0;
    var ticking = false;
    var THRESHOLD = 10;
    var MIN_Y = 600;

    function apply() {
      var y = window.scrollY || window.pageYOffset || 0;
      var delta = y - lastY;
      if (Math.abs(delta) > THRESHOLD) {
        if (delta > 0 && y > MIN_Y) {
          body.classList.add('rsp-hide-header');
        }
        lastY = y;
      }
      if (y <= MIN_Y) body.classList.remove('rsp-hide-header');
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(apply); ticking = true; }
    }, { passive: true });
  }

  /* ------------------------------------------------- yukarı çık butonu
     Sayfa ~480px aşağı kaydırıldığında sağ alt köşede beliren yuvarlak
     buton; tıklanınca sayfayı yumuşak biçimde en üste taşır. Stiller
     nav-v2.css içinde (#rsp-top). ------------------------------------------------------------------------- */
  function setupScrollTop() {
    if (document.getElementById('rsp-top')) return;
    var b = document.createElement('button');
    b.id = 'rsp-top';
    b.type = 'button';
    b.setAttribute('aria-label', 'Sayfa başına dön');
    b.title = 'Yukarı Çık';
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(b);
    var shown = false;
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset || 0;
      var show = y > 480;
      if (show !== shown) { shown = show; b.classList.toggle('show', show); }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
    b.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function markCurrentLinks(root) {
    if (!root) return;
    var here = (location.pathname.split('/').pop() || '01-ana-sayfa.html');
    root.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#') return;
      var file = href.split('#')[0].split('?')[0];
      if (file && file === here) a.classList.add('cur-link');
    });
  }

  function init() {
    injectActiveLinkStyle();
    if (document.readyState === 'complete') enforceLogoMarquee();
    else window.addEventListener('load', enforceLogoMarquee, { once: true });
    var header = document.querySelector('header.header');
    if (header) {
      header.innerHTML = build();
      var mobileMenu = header.querySelector('#mobileMenu');
      if (mobileMenu) document.body.appendChild(mobileMenu);
      bind(header, mobileMenu);
      markCurrentLinks(header);
      markCurrentLinks(mobileMenu);
    }
    var fc = document.querySelector('footer.footer > .container');
    if (fc) { fc.innerHTML = buildFooter(); markCurrentLinks(fc); }
    try { repairLinks(); } catch (e) { /* onarım isteğe bağlı, sayfayı bozmaz */ }
    setupScrollHide();
    setupScrollTop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
