/**
 * form.js
 * Формы заявки: маска телефона, проверка полей с ошибками
 * рядом с полем, отправка в Web3Forms.
 *
 * Разметка: <form data-contact data-phone="+7 (…)" data-tel="+7…">
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     Отправка (Web3Forms). Чтобы сменить приёмщик, достаточно
     заменить эту функцию — она должна вернуть Promise.
     ---------------------------------------------------------- */
  function sendToApi(data) {
    return fetch('https://api.web3forms.com/submit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: 'fbdafc8c-0790-48d3-a648-21c85f354bbc',
        subject:    'Заявка с сайта: ' + (data.topic || data.page),
        name:       data.name,
        phone:      data.phone,
        company:    data.company,
        topic:      data.topic,
        message:    data.comment,
        page:       data.page
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  /* ----------------------------------------------------------
     Маска телефона +7 (XXX) XXX-XX-XX
     Работает на событии input, поэтому корректна с экранными
     клавиатурами Android, вставкой и автозаполнением.
     ---------------------------------------------------------- */
  function nationalDigits(value) {
    var trimmed = value.trim();
    var d = value.replace(/\D/g, '');
    if (trimmed.indexOf('+7') === 0) d = d.slice(1);
    // вставили «8 916 …» или «+7 916 …» поверх «+7 »
    if (d.length > 10 && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
    // первая набранная цифра 7 или 8 — это код страны
    if (trimmed.length === 1 && (d === '7' || d === '8')) d = '';
    return d.slice(0, 10);
  }

  function formatPhone(d) {
    var s = '+7 ';
    if (!d.length) return s;
    s += '(' + d.slice(0, 3);
    if (d.length >= 3) s += ')';
    if (d.length > 3)  s += ' ' + d.slice(3, 6);
    if (d.length > 6)  s += '-' + d.slice(6, 8);
    if (d.length > 8)  s += '-' + d.slice(8, 10);
    return s;
  }

  // позиция каретки сразу после n-й цифры номера
  function caretAfterDigit(formatted, n) {
    if (n <= 0) return Math.min(formatted.length, 4);
    var seen = 0;
    for (var i = 3; i < formatted.length; i++) {
      if (/\d/.test(formatted[i]) && ++seen === n) return i + 1;
    }
    return formatted.length;
  }

  function digitsBeforeCaret(value, caret) {
    return nationalDigits(value.slice(0, caret)).length;
  }

  function initPhoneMask(input) {
    var prev = '';

    input.addEventListener('focus', function () {
      if (!input.value) {
        input.value = '+7 ';
        prev = '';
      }
    });

    input.addEventListener('blur', function () {
      if (!nationalDigits(input.value).length) input.value = '';
    });

    input.addEventListener('input', function (e) {
      var caret  = input.selectionStart == null ? input.value.length : input.selectionStart;
      var digits = nationalDigits(input.value);
      var before = digitsBeforeCaret(input.value, caret);

      // Backspace по скобке/дефису: удаляем цифру перед ними
      if (e.inputType === 'deleteContentBackward' && digits === prev && before > 0) {
        digits = digits.slice(0, before - 1) + digits.slice(before);
        before -= 1;
      }

      input.value = formatPhone(digits);
      prev = digits;

      if (document.activeElement === input) {
        var pos = caretAfterDigit(input.value, Math.min(before, digits.length));
        input.setSelectionRange(pos, pos);
      }
      if (digits.length === 10) clearError(input);
    });
  }

  /* ----------------------------------------------------------
     Ошибки рядом с полем
     ---------------------------------------------------------- */
  function errorEl(input) {
    return document.getElementById(input.getAttribute('aria-describedby'));
  }

  function showError(input, text) {
    input.setAttribute('aria-invalid', 'true');
    var el = errorEl(input);
    if (el) { el.textContent = text; el.classList.add('is-shown'); }
  }

  function clearError(input) {
    input.removeAttribute('aria-invalid');
    var el = errorEl(input);
    if (el) { el.textContent = ''; el.classList.remove('is-shown'); }
  }

  function validate(form) {
    var firstBad = null;
    var name  = form.querySelector('[name="name"]');
    var phone = form.querySelector('[name="phone"]');

    if (name && name.value.trim().length < 2) {
      showError(name, 'Укажите, как к вам обращаться');
      firstBad = firstBad || name;
    }
    if (phone && nationalDigits(phone.value).length !== 10) {
      showError(phone, 'Введите номер полностью: 10 цифр после +7');
      firstBad = firstBad || phone;
    }
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  /* ----------------------------------------------------------
     Состояния кнопки и статуса
     ---------------------------------------------------------- */
  var LABELS = {
    idle:    'Отправить заявку',
    loading: 'Отправляем…',
    success: 'Заявка отправлена',
    error:   'Попробовать снова'
  };

  function setButtonState(btn, state) {
    btn.dataset.state = state;
    btn.disabled = state === 'loading';
    btn.querySelector('.btn-label').textContent = LABELS[state];
  }

  function collectData(form) {
    function val(name) {
      var el = form.querySelector('[name="' + name + '"]:not([type="radio"]), [name="' + name + '"]:checked');
      return el ? el.value.trim() : '';
    }
    return {
      name:    val('name'),
      phone:   val('phone'),
      company: val('company'),
      topic:   val('topic'),
      comment: val('comment'),
      page:    document.title
    };
  }

  /* ----------------------------------------------------------
     Инициализация формы
     ---------------------------------------------------------- */
  function initForm(form) {
    var btn    = form.querySelector('.form-submit');
    var status = form.querySelector('.form-status');
    var phone  = form.querySelector('[name="phone"]');

    form.noValidate = true;
    if (phone) initPhoneMask(phone);

    form.querySelectorAll('.form-input').forEach(function (input) {
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') && input !== phone) clearError(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;

      // ловушка для ботов
      var trap = form.querySelector('[name="botcheck"]');
      if (trap && trap.checked) return;

      setButtonState(btn, 'loading');
      status.className = 'form-status';
      status.textContent = '';

      sendToApi(collectData(form))
        .then(function () {
          setButtonState(btn, 'success');
          status.className = 'form-status success';
          status.textContent = 'Спасибо, заявка отправлена. Перезвоним в рабочее время.';
          form.reset();
          setTimeout(function () { setButtonState(btn, 'idle'); }, 5000);
        })
        .catch(function (err) {
          console.error('[form.js]', err);
          setButtonState(btn, 'error');
          status.className = 'form-status error';
          status.innerHTML = 'Не получилось отправить заявку. Позвоните нам: ' +
            '<a href="tel:' + form.dataset.tel + '">' + form.dataset.phone + '</a>';
        });
    });
  }

  function init() {
    document.querySelectorAll('form[data-contact]').forEach(initForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
