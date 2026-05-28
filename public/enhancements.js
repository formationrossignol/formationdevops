const ARROW_UP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;

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

function init() {
  setupScrollToTop();
}

document.addEventListener('astro:page-load', init);
init();
