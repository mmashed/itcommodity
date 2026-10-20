/**
 * site.js
 * Общая логика страниц: шапка и мобильное меню, появление блоков
 * при прокрутке, фильтр каталога ПО, подстановка продукта в заявку.
 */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     Тень у шапки после начала прокрутки
     ---------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    function update() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ----------------------------------------------------------
     Мобильное меню
     ---------------------------------------------------------- */
  function initMobileNav() {
    var burger = document.querySelector('.burger');
    var panel  = document.getElementById('mobile-nav');
    if (!burger || !panel) return;

    function setOpen(open, restoreFocus) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      panel.classList.toggle('is-open', open);
      panel.inert = !open;
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
      if (window.innerWidth > 900 && panel.classList.contains('is-open')) setOpen(false);
    });
  }

  /* ----------------------------------------------------------
     Появление при прокрутке (.reveal)
     ---------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
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
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------
     Фильтр каталога ПО
     ---------------------------------------------------------- */
  function initFilters() {
    var buttons = document.querySelectorAll('[data-filter]');
    var cards   = document.querySelectorAll('[data-tags]');
    if (!buttons.length || !cards.length) return;

    function hasTag(card, tag) { return card.dataset.tags.split(' ').indexOf(tag) !== -1; }

    buttons.forEach(function (btn) {
      var tag   = btn.dataset.filter;
      var badge = btn.querySelector('span');
      if (badge) {
        badge.textContent = tag === 'all' ? cards.length
          : Array.prototype.filter.call(cards, function (c) { return hasTag(c, tag); }).length;
      }

      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        cards.forEach(function (card) { card.hidden = !(tag === 'all' || hasTag(card, tag)); });
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
        if (!field.value || field.dataset.prefilled === 'true') {
          field.value = 'Интересует: ' + link.dataset.product;
          field.dataset.prefilled = 'true';
        }
      });
    });
  }

  function init() {
    initHeader();
    initMobileNav();
    initReveal();
    initFilters();
    initProductLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
