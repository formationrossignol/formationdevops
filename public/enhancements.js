const ARROW_UP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
const FULLSCREEN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
const CLOSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;

function setupScrollToTop() {
  let btn = document.getElementById('scroll-to-top');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'scroll-to-top';
    btn.innerHTML = ARROW_UP_SVG;
    btn.setAttribute('aria-label', 'Retour en haut');
    document.body.appendChild(btn);
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function updateVisibility() {
    btn.classList.toggle('visible', window.scrollY > 400);
  }

  window.removeEventListener('scroll', updateVisibility);
  window.addEventListener('scroll', updateVisibility, { passive: true });
  updateVisibility();
}

function setupCodeFullscreen() {
  document.querySelectorAll('.expressive-code .frame').forEach(frame => {
    if (frame.querySelector('.ec-fullscreen-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'ec-fullscreen-btn';
    btn.innerHTML = FULLSCREEN_SVG;
    btn.setAttribute('aria-label', 'Plein écran');
    frame.appendChild(btn);

    btn.addEventListener('click', () => {
      const isFullscreen = frame.classList.toggle('ec-is-fullscreen');
      btn.innerHTML = isFullscreen ? CLOSE_SVG : FULLSCREEN_SVG;
      btn.setAttribute('aria-label', isFullscreen ? 'Quitter le plein écran' : 'Plein écran');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.frame.ec-is-fullscreen').forEach(frame => {
        frame.classList.remove('ec-is-fullscreen');
        const btn = frame.querySelector('.ec-fullscreen-btn');
        if (btn) {
          btn.innerHTML = FULLSCREEN_SVG;
          btn.setAttribute('aria-label', 'Plein écran');
        }
      });
    }
  });
}

function init() {
  setupScrollToTop();
  setupCodeFullscreen();
}

document.addEventListener('astro:page-load', init);
init();
