(() => {
  const storyStep = document.querySelector('.story-step');
  const menuButton = document.querySelector('.menu-button');
  const quickNav = document.querySelector('.quick-nav');
  const currentNavLink = quickNav?.querySelector('a[href="#partnership"]');
  const dialog = document.querySelector('#partnership-dialog');
  const form = document.querySelector('#partnership-form');
  const openButtons = [...document.querySelectorAll('[data-partnership-topic]')];
  const closeButton = dialog?.querySelector('[data-dialog-close]');
  const title = dialog?.querySelector('#contact-dialog-title');
  const intro = dialog?.querySelector('#contact-dialog-intro');
  const interestInput = form?.elements.namedItem('interest');
  const pilotFields = form?.querySelector('[data-pilot-fields]');
  const pilotInputs = [...(pilotFields?.querySelectorAll('input') || [])];
  const status = form?.querySelector('.contact-form__status');
  const submitButton = form?.querySelector('.contact-form__submit');
  let returnFocus = null;
  const isEnglish = document.documentElement.lang === 'en';
  const copy = isEnglish ? {
    menuOpen: 'Open navigation', menuClose: 'Close navigation', menu: 'Menu', close: 'Close',
    pilotTitle: 'PILOT PROJECT', investmentTitle: 'INVESTMENT PARTNERSHIP',
    pilotIntro: 'Tell us about your farm and the challenge you would like to validate with Arvanos.',
    investmentIntro: 'Tell us briefly about yourself and your interest in developing Arvanos.',
    accepted: 'Thank you. Your enquiry has been received.',
    unavailable: 'The form is ready. Sending will become available once the Arvanos email endpoint is connected.',
    invalidEndpoint: 'The form endpoint is configured incorrectly.',
    insecure: 'A secure HTTPS connection is required to send this form.',
    sending: 'SENDING…', success: 'Thank you. We will contact you shortly.',
    timeout: 'The server is not responding. Please try again later.',
    failed: 'The enquiry could not be sent. Please try again later.', submit: 'SEND ENQUIRY'
  } : {
    menuOpen: 'Відкрити навігацію', menuClose: 'Закрити навігацію', menu: 'Меню', close: 'Закрити',
    pilotTitle: 'ПІЛОТНИЙ ПРОЄКТ', investmentTitle: 'ІНВЕСТИЦІЙНЕ ПАРТНЕРСТВО',
    pilotIntro: 'Розкажіть про господарство та завдання, яке ви хотіли б перевірити разом з Arvanos.',
    investmentIntro: 'Розкажіть коротко про себе та ваш інтерес до розвитку Arvanos.',
    accepted: 'Дякуємо. Запит прийнято.',
    unavailable: 'Форма готова. Надсилання буде доступне після підключення робочої пошти Arvanos.',
    invalidEndpoint: 'Надсилання форми налаштовано некоректно.',
    insecure: 'Для надсилання форми потрібне захищене HTTPS-з’єднання.',
    sending: 'НАДСИЛАЄМО…', success: 'Дякуємо. Ми зв’яжемося з вами найближчим часом.',
    timeout: 'Сервер не відповідає. Спробуйте ще раз трохи пізніше.',
    failed: 'Не вдалося надіслати запит. Спробуйте ще раз трохи пізніше.', submit: 'НАДІСЛАТИ ЗАПИТ'
  };

  storyStep?.classList.add('is-active');
  currentNavLink?.classList.add('is-current');
  currentNavLink?.setAttribute('aria-current', 'page');

  menuButton?.addEventListener('click', () => {
    const isOpen = quickNav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? copy.menuClose : copy.menuOpen);
    menuButton.textContent = isOpen ? copy.close : copy.menu;
  });

  quickNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      quickNav.classList.remove('is-open');
      menuButton?.setAttribute('aria-expanded', 'false');
      menuButton?.setAttribute('aria-label', copy.menuOpen);
      if (menuButton) menuButton.textContent = copy.menu;
    });
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dialog?.open) {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== 'Escape' || !quickNav?.classList.contains('is-open')) return;
    quickNav.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', copy.menuOpen);
    if (menuButton) {
      menuButton.textContent = copy.menu;
      menuButton.focus();
    }
  });

  function setTopic(topic) {
    const isPilot = topic === 'pilot';
    interestInput.value = isPilot ? 'pilot' : 'investment';
    pilotFields.hidden = !isPilot;
    pilotInputs.forEach((input) => {
      input.disabled = !isPilot;
      if (!isPilot) input.value = '';
    });
    title.textContent = isPilot ? copy.pilotTitle : copy.investmentTitle;
    intro.textContent = isPilot ? copy.pilotIntro : copy.investmentIntro;
    status.textContent = '';
  }

  setTopic('investment');

  function openDialog(topic, trigger) {
    setTopic(topic);
    returnFocus = trigger;
    document.body.classList.add('contact-dialog-open');
    dialog.showModal();
    requestAnimationFrame(() => form.elements.namedItem('name')?.focus());
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  openButtons.forEach((button) => {
    button.addEventListener('click', () => openDialog(button.dataset.partnershipTopic, button));
  });

  closeButton?.addEventListener('click', closeDialog);
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog?.addEventListener('close', () => {
    document.body.classList.remove('contact-dialog-open');
    returnFocus?.focus();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    if (formData.get('_honey')) {
      status.textContent = copy.accepted;
      return;
    }

    const endpoint = form.dataset.endpoint.trim();
    if (!endpoint) {
      status.textContent = copy.unavailable;
      return;
    }

    let endpointUrl;
    try {
      endpointUrl = new URL(endpoint, location.href);
    } catch {
      status.textContent = copy.invalidEndpoint;
      return;
    }
    const isSameOriginHttp = endpointUrl.origin === location.origin && ['http:', 'https:'].includes(endpointUrl.protocol);
    if (endpointUrl.protocol !== 'https:' && !isSameOriginHttp) {
      status.textContent = copy.insecure;
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = copy.sending;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Request failed');
      const topic = interestInput.value;
      form.reset();
      setTopic(topic);
      status.textContent = copy.success;
    } catch (error) {
      status.textContent = error.name === 'AbortError'
        ? copy.timeout
        : copy.failed;
    } finally {
      clearTimeout(timeoutId);
      submitButton.disabled = false;
      submitButton.textContent = copy.submit;
    }
  });
})();
