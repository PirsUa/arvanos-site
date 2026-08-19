(() => {
  const COOKIE_NAME = 'arvanos_lang';
  const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

  function readPreference() {
    const match = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));
    const value = match?.split('=')[1];
    return value === 'en' || value === 'uk' ? value : '';
  }

  function savePreference(language) {
    if (language !== 'en' && language !== 'uk') return;
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_NAME}=${language}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  }

  document.querySelectorAll('[data-language-switch]').forEach((link) => {
    link.addEventListener('click', () => savePreference(link.dataset.languageTarget));
  });

  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', (event) => {
      const target = document.querySelector(skipLink.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
      target.focus({ preventScroll: true });
      setTimeout(() => target.focus({ preventScroll: true }), 0);
    });
  }

  if (!document.body.hasAttribute('data-language-entry')) return;

  const preference = readPreference();
  const browserLanguage = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
  const language = preference || (browserLanguage === 'uk' || browserLanguage.startsWith('uk-') ? 'uk' : 'en');
  const destination = language === 'uk' ? './uk/field-transition-demo.html' : './field-transition-demo.html';
  location.replace(destination);
})();
