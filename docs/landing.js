// Keep earlier links to the invitation's sections working after the entry-page move.
if (['#invitation', '#cinema', '#our-story', '#the-day'].includes(location.hash)) {
  location.replace('invite.html' + location.hash);
}

// Small pointer-driven depth; no continuous rendering loop or mobile scroll handler.
const depth = matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
const scene = document.querySelector('.welcome');
let frame = 0, x = 0, y = 0;
const paint = () => {
  frame = 0;
  scene.style.setProperty('--px', x.toFixed(3));
  scene.style.setProperty('--py', y.toFixed(3));
};
scene.addEventListener('pointermove', event => {
  if (!depth.matches) return;
  const bounds = scene.getBoundingClientRect();
  x = (event.clientX - bounds.left) / bounds.width - .5;
  y = (event.clientY - bounds.top) / bounds.height - .5;
  if (!frame) frame = requestAnimationFrame(paint);
}, {passive:true});
scene.addEventListener('pointerleave', () => {
  x = y = 0;
  if (!frame) frame = requestAnimationFrame(paint);
});
depth.addEventListener('change', () => {
  x = y = 0;
  if (!frame) frame = requestAnimationFrame(paint);
});
