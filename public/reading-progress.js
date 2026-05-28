function setupReadingProgress() {
  let bar = document.getElementById('reading-progress-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'reading-progress-bar';
    document.body.prepend(bar);
  }

  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = docHeight > 0 ? (scrollTop / docHeight) * 100 + '%' : '0%';
  }

  window.removeEventListener('scroll', update);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

document.addEventListener('astro:page-load', setupReadingProgress);
setupReadingProgress();
