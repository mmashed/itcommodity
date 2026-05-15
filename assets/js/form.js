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
     Инициализация одной формы
     ---------------------------------------------------------- */
  function initForm(form) {
    var submitBtn = form.querySelector('.form-submit');
    var statusEl  = form.querySelector('.form-status');

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
