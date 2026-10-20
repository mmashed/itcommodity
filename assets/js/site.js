/**
 * site.js
 * Общая логика страниц: шапка и мобильное меню, появление блоков
 * при прокрутке, счётчики, подсветка карточек, параллакс героя,
 * «терминал» на главной, фильтр каталога ПО, кнопки копирования.
 */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ----------------------------------------------------------
     Шапка: фон при прокрутке + полоса прогресса
     ---------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var ticking = false;

    function update() {
      var y   = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('is-scrolled', y > 24);
      header.style.setProperty('--progress', max > 0 ? Math.min(y / max, 1) : 0);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ----------------------------------------------------------
     Мобильное меню
     ---------------------------------------------------------- */
  function initMobileNav() {
    var burger = document.querySelector('.burger');
    var panel  = document.getElementById('mobile-nav');
    var header = document.querySelector('.site-header');
    if (!burger || !panel) return;

    function setOpen(open, restoreFocus) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      panel.classList.toggle('is-open', open);
      panel.inert = !open;
      header.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      if (open) {
        var first = panel.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      } else if (restoreFocus) {
        burger.focus();
      }
    }

    panel.inert = true;

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });

    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) setOpen(false, true);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && panel.classList.contains('is-open')) setOpen(false);
    });
  }

  /* ----------------------------------------------------------
     Появление при прокрутке (.reveal, .steps)
     ---------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal, [data-observe]');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------
     Счётчики: <span data-count="70000">70 000</span>
     ---------------------------------------------------------- */
  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length || reduceMotion || !('IntersectionObserver' in window)) return;

    var fmt = new Intl.NumberFormat('ru-RU');

    function run(el) {
      var target = parseFloat(el.dataset.count);
      var start  = performance.now();
      var dur    = 1600;
      (function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt.format(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    nums.forEach(function (el) {
      el.textContent = '0';
      io.observe(el);
    });
  }

  /* ----------------------------------------------------------
     Подсветка карточек за курсором (.spotlight)
     ---------------------------------------------------------- */
  function initSpotlight() {
    if (!finePointer) return;
    document.querySelectorAll('.spotlight').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ----------------------------------------------------------
     Параллакс фона героя
     ---------------------------------------------------------- */
  function initParallax() {
    var bg = document.querySelector('.hero__bg, .page-hero__bg');
    if (!bg || reduceMotion || !finePointer) return;
    var ticking = false;

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) bg.style.translate = '0 ' + (y * 0.25) + 'px';
        ticking = false;
      });
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     «Терминал» на главной — строки печатаются по очереди
     ---------------------------------------------------------- */
  function initTerminal() {
    var lines = document.querySelectorAll('.terminal__line[data-typed]');
    if (!lines.length) return;

    if (reduceMotion) {
      lines.forEach(function (l) { l.classList.add('is-typed'); });
      return;
    }
    lines.forEach(function (line, i) {
      setTimeout(function () { line.classList.add('is-typed'); }, 900 + i * 650);
    });
  }

  /* ----------------------------------------------------------
     Фильтр каталога ПО
     ---------------------------------------------------------- */
  function initFilters() {
    var buttons = document.querySelectorAll('[data-filter]');
    var cards   = document.querySelectorAll('[data-tags]');
    if (!buttons.length || !cards.length) return;

    buttons.forEach(function (btn) {
      var tag   = btn.dataset.filter;
      var count = tag === 'all' ? cards.length
        : Array.prototype.filter.call(cards, function (c) { return c.dataset.tags.split(' ').indexOf(tag) !== -1; }).length;
      var badge = btn.querySelector('span');
      if (badge) badge.textContent = count;

      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        cards.forEach(function (card) {
          var show = tag === 'all' || card.dataset.tags.split(' ').indexOf(tag) !== -1;
          card.hidden = !show;
          card.classList.remove('is-entering');
          if (show && !reduceMotion) {
            void card.offsetWidth;
            card.classList.add('is-entering');
          }
        });
      });
    });
  }

  /* ----------------------------------------------------------
     «Запросить стоимость» у продукта — подставляем его в заявку
     ---------------------------------------------------------- */
  function initProductLinks() {
    document.querySelectorAll('[data-product]').forEach(function (link) {
      link.addEventListener('click', function () {
        var field = document.querySelector('#contact textarea[name="comment"]');
        if (!field) return;
        var text = 'Интересует: ' + link.dataset.product;
        if (!field.value || field.dataset.prefilled === 'true') {
          field.value = text;
          field.dataset.prefilled = 'true';
        }
      });
    });
  }

  /* ----------------------------------------------------------
     Копирование в буфер: <button data-copy="текст">
     ---------------------------------------------------------- */
  function initCopy() {
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      var label = btn.querySelector('.mini-btn__label');
      var initial = label ? label.textContent : '';

      btn.addEventListener('click', function () {
        var text = btn.dataset.copy;
        var target = btn.dataset.copyFrom && document.querySelector(btn.dataset.copyFrom);
        if (target) {
          // список <dl> копируем строками «Поле: значение»
          text = Array.prototype.map.call(target.querySelectorAll('dt'), function (dt) {
            return dt.textContent.trim() + ': ' + dt.nextElementSibling.textContent.trim();
          }).join('\n') || target.innerText.trim();
        }
        if (!navigator.clipboard) return;

        navigator.clipboard.writeText(text).then(function () {
          btn.classList.add('is-done');
          if (label) label.textContent = 'Скопировано';
          setTimeout(function () {
            btn.classList.remove('is-done');
            if (label) label.textContent = initial;
          }, 2000);
        });
      });
    });
  }

  /* ----------------------------------------------------------
     Московское время в карточках представительств
     ---------------------------------------------------------- */
  function initClocks() {
    var clocks = document.querySelectorAll('[data-clock]');
    if (!clocks.length || !window.Intl) return;
    var fmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' });

    function tick() {
      var t = fmt.format(new Date());
      clocks.forEach(function (el) { el.textContent = t; });
    }
    tick();
    setInterval(tick, 15000);
  }

  function init() {
    initHeader();
    initMobileNav();
    initReveal();
    initCounters();
    initSpotlight();
    initParallax();
    initTerminal();
    initFilters();
    initProductLinks();
    initCopy();
    initClocks();

    // SMIL-анимацию маршрута CSS не останавливает
    if (reduceMotion) {
      document.querySelectorAll('.route__packet').forEach(function (el) { el.remove(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
