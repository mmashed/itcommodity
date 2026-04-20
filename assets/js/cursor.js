/**
 * cursor.js
 * Кастомный курсор — точка + кольцо с инерцией.
 * На тач-устройствах не инициализируется.
 */

(function () {
  'use strict';

  // тач — не нужен
  if (window.matchMedia('(hover: none)').matches) return;

  var cursor = document.getElementById('cursor');
  var ring   = document.getElementById('cursor-ring');

  if (!cursor || !ring) return;

  var mx = 0, my = 0;
  var rx = 0, ry = 0;
  var rafId = null;

  /* ----------------------------------------------------------
     Двигаем точку сразу, кольцо — с инерцией
     ---------------------------------------------------------- */
  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    rafId = requestAnimationFrame(animateRing);
  }
  animateRing();

  /* ----------------------------------------------------------
     Hover-эффект на интерактивных элементах
     ---------------------------------------------------------- */
  function onEnter() {
    cursor.style.transform = 'translate(-50%,-50%) scale(2.5)';
    ring.style.width       = '60px';
    ring.style.height      = '60px';
    ring.style.borderColor = 'rgba(0,200,255,0.6)';
  }

  function onLeave() {
    cursor.style.transform = 'translate(-50%,-50%) scale(1)';
    ring.style.width       = '36px';
    ring.style.height      = '36px';
    ring.style.borderColor = 'rgba(0,200,255,0.4)';
  }

  function bindInteractive() {
    document.querySelectorAll('a, button, [role="button"], label[for], .dir-card').forEach(function (el) {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });
  }

  /* ----------------------------------------------------------
     Прячем при уходе курсора за пределы окна
     ---------------------------------------------------------- */
  document.addEventListener('mouseleave', function () {
    cursor.style.opacity = '0';
    ring.style.opacity   = '0';
  });
  document.addEventListener('mouseenter', function () {
    cursor.style.opacity = '1';
    ring.style.opacity   = '1';
  });

  /* ----------------------------------------------------------
     Инициализация — ждём компоненты если нужно
     ---------------------------------------------------------- */
  function init() {
    bindInteractive();

    // перепривязываем после того как components.js вставил хедер/футер
    // MutationObserver на body — ловим новые ноды
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.addedNodes.length) bindInteractive();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
