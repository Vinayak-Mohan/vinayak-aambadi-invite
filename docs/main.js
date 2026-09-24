const stage = document.getElementById('card-stage');
const openButton = document.getElementById('open-invite');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

openButton?.addEventListener('click', () => {
  document.getElementById('invitation')?.scrollIntoView({ behavior: prefersReducedMotion ? 'instant' : 'smooth' });
  stage?.classList.add('is-open');
  window.setTimeout(() => stage?.classList.remove('is-open'), 2700);
});

if (stage && !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
  stage.addEventListener('pointermove', (event) => {
    const bounds = stage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    stage.style.setProperty('--ry', `${(x * 12).toFixed(1)}deg`);
    stage.style.setProperty('--rx', `${(-y * 9).toFixed(1)}deg`);
  });
  stage.addEventListener('pointerleave', () => {
    stage.style.setProperty('--ry', '7deg');
    stage.style.setProperty('--rx', '-3deg');
  });
}
