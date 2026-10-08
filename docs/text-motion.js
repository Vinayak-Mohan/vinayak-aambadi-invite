// Intact typography reveals: no letter splitting, rotation or layout changes.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const active = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting) return;
      observer.unobserve(target);
      const lines = target.matches('#couple-names, #invite-title') ? [...target.children] : [target];
      lines.forEach((line, index) => {
        const animation = line.animate([
          {clipPath: 'inset(-20% -8% 105% -8%)', opacity: .65, transform: 'translate3d(0,10px,0)'},
          {clipPath: 'inset(-20% -8% -25% -8%)', opacity: 1, transform: 'translate3d(0,0,0)'}
        ], {duration: 600, delay: index * 110, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'});
        active.add(animation);
        animation.finished.then(() => active.delete(animation)).catch(() => active.delete(animation));
      });
    });
  }, {threshold: .2, rootMargin: '0px 0px -24px 0px'});
  document.querySelectorAll('#couple-names, #invite-title, .locations-heading h2, .venue-details h4, #invitation-title, .story-copy h2').forEach(element => observer.observe(element));
  preference.addEventListener('change', () => {
    if (!preference.matches) return;
    observer.disconnect();
    active.forEach(animation => animation.cancel());
    active.clear();
  });
})();
