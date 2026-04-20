/**
 * reveal.js
 * Scroll-reveal через IntersectionObserver.
 * Элементы с классом .reveal появляются при попадании в viewport.
 * Поддерживает .reveal-delay-1/2/3 для stagger-эффекта.
 *
 * Так же обрабатывает параллакс hero-bg на главной,
 * чтобы не тащить отдельный файл ради 5 строк.
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------- */
  function initReveal() {
    var elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    // если браузер не поддерживает IntersectionObserver — показываем всё сразу
    if (!('IntersectionObserver' in window)) {
      elements.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ----------------------------------------------------------
     Hero parallax (только если есть .hero-bg)
     ---------------------------------------------------------- */
  function initHeroParallax() {
    var heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;

    // на мобиле параллакс отключаем — дорого и некрасиво
    if (window.matchMedia('(max-width: 768px)').matches) return;

    var ticking = false;

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          heroBg.style.transform = 'scale(1.05) translateY(' + (window.scrollY * 0.3) + 'px)';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     Инициализация
     ---------------------------------------------------------- */
  function init() {
    initReveal();
    initHeroParallax();

    // если components.js добавит новые .reveal после загрузки —
    // перенаблюдаем их
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    var mutationObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.classList && node.classList.contains('reveal')) {
            observer.observe(node);
          }
          node.querySelectorAll && node.querySelectorAll('.reveal').forEach(function (el) {
            observer.observe(el);
          });
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
