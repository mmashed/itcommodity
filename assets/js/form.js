/**
 * form.js
 * Обработка формы заявки.
 *
 * Место под web3-приёмщик помечено комментарием WEB3_ENDPOINT.
 * Когда будешь подключать — заменяешь функцию sendToApi(data)
 * и убираешь заглушку.
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     WEB3_ENDPOINT
     Сюда вставляешь свой приёмщик.
     Функция должна вернуть Promise.
     data = { name, phone, comment, page }

     Пример для webhook (например, n8n / make / tg-bot):

     function sendToApi(data) {
       return fetch('https://YOUR_ENDPOINT_URL', {
         method:  'POST',
         headers: { 'Content-Type': 'application/json' },
         body:    JSON.stringify(data)
       }).then(function (res) {
         if (!res.ok) throw new Error('HTTP ' + res.status);
         return res.json();
       });
     }

     ---------------------------------------------------------- */
  function sendToApi(data) {
    return fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: 'fbdafc8c-0790-48d3-a648-21c85f354bbc',
        name:    data.name,
        phone:   data.phone,
        message: data.comment,
        subject: 'Заявка с сайта: ' + data.page
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }
  /* ----------------------------------------------------------
     конец WEB3_ENDPOINT
     ---------------------------------------------------------- */


  /* ----------------------------------------------------------
     Сбор данных из формы
     ---------------------------------------------------------- */
  function collectData(form) {
    return {
      name:    (form.querySelector('[name="name"]')    || {}).value || '',
      phone:   (form.querySelector('[name="phone"]')   || {}).value || '',
      comment: (form.querySelector('[name="comment"]') || {}).value || '',
      page:    window.location.pathname
    };
  }

  /* ----------------------------------------------------------
     UI-утилиты
     ---------------------------------------------------------- */
  function setStatus(statusEl, type, text) {
    if (!statusEl) return;
    statusEl.className = 'form-status ' + type;
    statusEl.textContent = text;
  }

  function setButtonState(btn, state) {
    if (!btn) return;
    btn.dataset.state = state;
    btn.disabled = (state === 'loading');

    var labels = {
      idle:    'Отправить заявку',
      loading: 'Отправляем...',
      success: 'Заявка отправлена',
      error:   'Попробовать снова'
    };
    btn.textContent = labels[state] || labels.idle;
  }

  /* ----------------------------------------------------------
     Маска телефона +7 (___) ___-__-__
     ---------------------------------------------------------- */
  var PHONE_MASK   = '+7 (___) ___-__-__';
  var DIGIT_SLOTS  = [4, 5, 6, 9, 10, 11, 13, 14, 16, 17];

  function buildMasked(digits) {
    var chars = PHONE_MASK.split('');
    for (var i = 0; i < digits.length; i++) {
      chars[DIGIT_SLOTS[i]] = digits[i];
    }
    return chars.join('');
  }

  function getDigits(val) {
    var d = '';
    for (var i = 0; i < DIGIT_SLOTS.length; i++) {
      var ch = (val || '')[DIGIT_SLOTS[i]];
      if (!ch || ch === '_') break;
      d += ch;
    }
    return d;
  }

  function placeCursor(inp, digits) {
    var pos = digits.length < DIGIT_SLOTS.length
      ? DIGIT_SLOTS[digits.length]
      : PHONE_MASK.length;
    inp.setSelectionRange(pos, pos);
  }

  function initPhoneMask(form) {
    var inp = form.querySelector('[name="phone"]');
    if (!inp) return;

    inp.addEventListener('focus', function () {
      if (!inp.value) inp.value = PHONE_MASK;
      var d = getDigits(inp.value);
      placeCursor(inp, d);
    });

    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') return;
      e.preventDefault();

      var d = getDigits(inp.value || PHONE_MASK);

      if (e.key === 'Backspace') {
        d = d.slice(0, -1);
        inp.value = buildMasked(d);
        inp.setCustomValidity(d.length && d.length < 10 ? 'Введите номер полностью' : '');
        placeCursor(inp, d);
        return;
      }

      if (!/^\d$/.test(e.key) || d.length >= 10) return;

      d += e.key;
      inp.value = buildMasked(d);
      inp.setCustomValidity(d.length < 10 ? 'Введите номер полностью' : '');
      placeCursor(inp, d);
    });

    inp.addEventListener('paste', function (e) {
      e.preventDefault();
      var raw = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      if (raw[0] === '7' || raw[0] === '8') raw = raw.slice(1);
      var d = raw.slice(0, 10);
      inp.value = buildMasked(d);
      inp.setCustomValidity(d.length < 10 ? 'Введите номер полностью' : '');
      placeCursor(inp, d);
    });

    inp.addEventListener('blur', function () {
      var d = getDigits(inp.value || '');
      if (!d.length) inp.value = '';
    });
  }

  /* ----------------------------------------------------------
     Инициализация одной формы
     ---------------------------------------------------------- */
  function initForm(form) {
    var submitBtn = form.querySelector('.form-submit');
    var statusEl  = form.querySelector('.form-status');

    initPhoneMask(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // базовая HTML5-валидация
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = collectData(form);

      setButtonState(submitBtn, 'loading');
      setStatus(statusEl, '', '');

      sendToApi(data)
        .then(function () {
          setButtonState(submitBtn, 'success');
          setStatus(statusEl, 'success', 'Спасибо! Перезвоним в рабочее время.');
          form.reset();

          // через 4 секунды возвращаем кнопку в норму
          setTimeout(function () {
            setButtonState(submitBtn, 'idle');
          }, 4000);
        })
        .catch(function (err) {
          console.error('[form.js]', err);
          setButtonState(submitBtn, 'error');
          setStatus(statusEl, 'error', 'Что-то пошло не так. Позвоните нам напрямую.');
        });
    });
  }

  /* ----------------------------------------------------------
     Инициализация всех форм на странице
     ---------------------------------------------------------- */
  function init() {
    document.querySelectorAll('form[data-contact]').forEach(initForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
