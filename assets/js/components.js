/**
 * components.js
 * Подгружает header и footer из /components/,
 * проставляет активный пункт навигации,
 * инициализирует бургер-меню.
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     Определяем активный раздел по pathname
     ---------------------------------------------------------- */
  function getActiveSection() {
    const path = window.location.pathname.replace(/\/$/, '');
    // /hardware → 'hardware', /devops → 'devops', / → ''
    const segment = path.split('/').filter(Boolean).pop() || '';
    return segment;
  }

  /* ----------------------------------------------------------
     Помечаем активные ссылки в навигации
     ---------------------------------------------------------- */
  function setActiveNav(section) {
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      if (link.dataset.nav === section) {
        link.classList.add('active');
      }
    });
  }

  /* ----------------------------------------------------------
     Бургер-меню
     ---------------------------------------------------------- */
  function initBurger() {
    const burger    = document.getElementById('burger');
    const mobileNav = document.getElementById('mobile-nav');
    const navCta    = document.getElementById('nav-cta');
    const mobileCta = document.getElementById('mobile-nav-cta');

    if (!burger || !mobileNav) return;

    function closeMenu() {
      burger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    burger.addEventListener('click', function () {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMenu();
      } else {
        burger.setAttribute('aria-expanded', 'true');
        mobileNav.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    });

    // закрываем при клике на ссылку внутри меню
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // закрываем при клике на "Связаться" в десктопном хедере
    if (navCta) {
      navCta.addEventListener('click', closeMenu);
    }

    // закрываем по Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    // закрываем при ресайзе на десктоп
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) closeMenu();
    });
  }

  /* ----------------------------------------------------------
     Загружаем компонент и вставляем в placeholder
     ---------------------------------------------------------- */
  function loadComponent(placeholderId, url, callback) {
    var el = document.getElementById(placeholderId);
    if (!el) return;

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load ' + url);
        return res.text();
      })
      .then(function (html) {
        el.outerHTML = html;
        if (typeof callback === 'function') callback();
      })
      .catch(function (err) {
        console.warn('[components.js]', err);
      });
  }

  /* ----------------------------------------------------------
     Инициализация
     ---------------------------------------------------------- */
  function init() {
    var section = getActiveSection();

    // грузим хедер, потом сразу вешаем логику
    loadComponent('header-placeholder', '/components/header.html', function () {
      setActiveNav(section);
      initBurger();
    });

    loadComponent('footer-placeholder', '/components/footer.html');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
