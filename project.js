(() => {
  const storySteps = [...document.querySelectorAll('.story-step')];
  const storyPageButtons = [...document.querySelectorAll('.story-page-button[data-story-direction]')];
  const navigationLinks = [...document.querySelectorAll('.quick-nav a[href^="#"]')];
  const pageLinks = [...document.querySelectorAll('a[href^="#"]:not(.skip-link)')];
  const menuButton = document.querySelector('.menu-button');
  const quickNav = document.querySelector('.quick-nav');
  let activeStoryIndex = -1;
  let pageTurnLocked = false;
  let touchStartY = 0;
  const isEnglish = document.documentElement.lang === 'en';
  const menuCopy = isEnglish
    ? { open: 'Open navigation', close: 'Close navigation', menu: 'Menu', closeText: 'Close' }
    : { open: 'Відкрити навігацію', close: 'Закрити навігацію', menu: 'Меню', closeText: 'Закрити' };

  const clamp = (number, min, max) => Math.min(max, Math.max(min, number));

  function crossesSectionBoundary(index, direction) {
    const currentStep = storySteps[index];
    const targetStep = storySteps[index + direction];
    if (!currentStep || !targetStep) return true;
    return currentStep.dataset.section !== targetStep.dataset.section;
  }

  function updateStoryState() {
    const focus = scrollY + innerHeight * .48;
    let activeIndex = 0;
    let closestDistance = Infinity;

    storySteps.forEach((step, index) => {
      const center = step.offsetTop + step.offsetHeight / 2;
      const distance = Math.abs(center - focus);
      if (distance < closestDistance) {
        closestDistance = distance;
        activeIndex = index;
      }
    });

    storySteps.forEach((step, index) => step.classList.toggle('is-active', index === activeIndex));
    document.body.classList.toggle('section-intro-active', storySteps[activeIndex].classList.contains('story-step--section-intro'));

    const currentAnchor = [...storySteps]
      .slice(0, activeIndex + 1)
      .reverse()
      .find((step) => step.id);
    navigationLinks.forEach((link) => {
      const isCurrent = Boolean(currentAnchor && link.getAttribute('href') === `#${currentAnchor.id}`);
      link.classList.toggle('is-current', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    storyPageButtons.forEach((button) => {
      const direction = Number(button.dataset.storyDirection);
      button.disabled = crossesSectionBoundary(activeIndex, direction);
    });
    document.querySelectorAll('[data-language-switch]').forEach((link) => {
      const url = new URL(link.getAttribute('href'), location.href);
      url.searchParams.set('step', String(activeIndex));
      link.href = url.href;
    });
    activeStoryIndex = activeIndex;
  }

  function transitionToPage(targetIndex) {
    if (pageTurnLocked) return;
    targetIndex = clamp(targetIndex, 0, storySteps.length - 1);
    if (targetIndex === activeStoryIndex) return;
    const outgoingStep = storySteps[activeStoryIndex];
    const incomingStep = storySteps[targetIndex];
    pageTurnLocked = true;
    outgoingStep?.classList.add('is-leaving');
    incomingStep.classList.add('is-entering');

    setTimeout(() => {
      incomingStep.scrollIntoView({ behavior: 'auto', block: 'start' });
      updateStoryState();
      outgoingStep?.classList.remove('is-leaving');
      requestAnimationFrame(() => incomingStep.classList.remove('is-entering'));
      if (incomingStep.id) history.replaceState(null, '', `#${incomingStep.id}`);
      setTimeout(() => { pageTurnLocked = false; }, 520);
    }, 460);
  }

  function turnPage(direction) {
    if (!direction) return;
    if (crossesSectionBoundary(activeStoryIndex, direction)) return;
    transitionToPage(activeStoryIndex + direction);
  }

  function followStoryArrow(direction) {
    if (!direction || pageTurnLocked) return;
    if (crossesSectionBoundary(activeStoryIndex, direction)) return;
    transitionToPage(activeStoryIndex + direction);
  }

  window.addEventListener('scroll', updateStoryState, { passive: true });
  window.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) < 8) return;
    event.preventDefault();
    turnPage(event.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  window.addEventListener('touchstart', (event) => {
    touchStartY = event.changedTouches[0]?.clientY || 0;
  }, { passive: true });
  window.addEventListener('touchend', (event) => {
    const touchEndY = event.changedTouches[0]?.clientY || touchStartY;
    const distance = touchStartY - touchEndY;
    if (Math.abs(distance) >= 36) turnPage(distance > 0 ? 1 : -1);
  }, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && quickNav.classList.contains('is-open')) {
      quickNav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', menuCopy.open);
      menuButton.textContent = menuCopy.menu;
      menuButton.focus();
      return;
    }
    if (event.target instanceof HTMLElement && event.target.closest('button, a, input, textarea, select')) return;
    if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      turnPage(1);
    } else if (['ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      turnPage(-1);
    }
  });
  window.addEventListener('resize', updateStoryState);

  menuButton.addEventListener('click', () => {
    const isOpen = quickNav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? menuCopy.close : menuCopy.open);
    menuButton.textContent = isOpen ? menuCopy.closeText : menuCopy.menu;
  });

  storyPageButtons.forEach((button) => button.addEventListener('click', () => {
    followStoryArrow(Number(button.dataset.storyDirection));
  }));
  storyPageButtons.forEach((button) => button.addEventListener('pointerup', () => {
    button.blur();
  }));

  pageLinks.forEach((link) => link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href').slice(1);
    const targetIndex = storySteps.findIndex((step) => step.id === targetId);
    if (targetIndex < 0) return;
    event.preventDefault();
    quickNav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', menuCopy.open);
    menuButton.textContent = menuCopy.menu;
    transitionToPage(targetIndex);
    history.replaceState(null, '', `#${targetId}`);
  }));

  const requestedStep = Number.parseInt(new URLSearchParams(location.search).get('step'), 10);
  const initialTarget = Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep < storySteps.length
    ? requestedStep
    : location.hash
      ? storySteps.findIndex((step) => step.id === location.hash.slice(1))
      : 0;
  storySteps[Math.max(0, initialTarget)].scrollIntoView({ behavior: 'auto', block: 'start' });
  updateStoryState();
})();
