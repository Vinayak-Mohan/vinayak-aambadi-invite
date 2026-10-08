// Typography entrances enhance the readable document; no scroll interception.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const active = new Set();
  const ease = 'cubic-bezier(.16,1,.3,1)';
  const observe = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting) return;
      observe.unobserve(target);
      const letters = target.matches('#couple-names');
      const pieces = [...target.querySelectorAll(letters ? '.type-letter' : '.type-word')];
      const units = pieces.length ? pieces : [target];
      units.forEach((unit, index) => {
        const animation = unit.animate([
          {opacity: 0, transform: letters ? 'translate3d(0,65%,0) rotate(7deg)' : 'translate3d(0,32%,0) rotate(2deg)'},
          {opacity: 1, transform: 'translate3d(0,0,0) rotate(0deg)'}
        ], {duration: letters ? 600 : 560, delay: Math.min(index * (letters ? 26 : 65), 340), easing: ease, fill: 'backwards'});
        active.add(animation);
        animation.finished.then(() => active.delete(animation)).catch(() => active.delete(animation));
      });
    });
  }, {threshold: .18, rootMargin: '0px 0px -20px 0px'});

  document.querySelectorAll('#couple-names, .locations-heading h2, .venue-details h4, #invite-title, #invitation-title, .story-copy h2, .event h3').forEach(element => {
    const copy = element.cloneNode(true);
    copy.querySelectorAll('br').forEach(br => br.replaceWith(' '));
    [...copy.children].filter(child => child.matches('.name-line') || element.matches('#invite-title')).forEach(child => child.append(' '));
    element.setAttribute('aria-label', copy.textContent.replace(/\s+/g, ' ').trim());
    const letters = element.matches('#couple-names');
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(token => {
        if (!token) return;
        if (/^\s+$/.test(token)) { fragment.append(document.createTextNode(token)); return; }
        const word = document.createElement('span');
        word.className = 'type-word';
        word.setAttribute('aria-hidden', 'true');
        if (letters) {
          [...token].forEach(character => {
            const letter = document.createElement('span');
            letter.className = 'type-letter'; letter.textContent = character; word.append(letter);
          });
        } else word.textContent = token;
        fragment.append(word);
      });
      node.replaceWith(fragment);
    });
    observe.observe(element);
  });
  // Supporting details follow the headings, as small individual beats.
  document.querySelectorAll('.opening-mark p, .wedding-date, .greeting, .welcome-note, .venue-type, .venue-details p, .directions, .invite-link, .ar-note, .art-caption, .story-signoff').forEach(element => observe.observe(element));
  preference.addEventListener('change', () => {
    if (!preference.matches) return;
    observe.disconnect();
    active.forEach(animation => animation.cancel());
    active.clear();
  });
})();
