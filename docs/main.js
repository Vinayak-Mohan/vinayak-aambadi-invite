const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

const reflectPageVisibility = () => document.documentElement.classList.toggle('page-hidden', document.hidden);
document.addEventListener('visibilitychange', reflectPageVisibility);
reflectPageVisibility();
if ('IntersectionObserver' in window) {
  const nearbyScenes = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('is-near', entry.isIntersecting));
  }, {rootMargin: '200px 0px'});
  document.querySelectorAll('.hero,.invitation,.story').forEach(scene => nearbyScenes.observe(scene));
}

document.querySelectorAll('[data-split]').forEach(element => {
  const accessibleCopy = element.cloneNode(true);
  accessibleCopy.querySelectorAll('br').forEach(lineBreak => lineBreak.replaceWith(' '));
  const label = accessibleCopy.textContent.replace(/\s+/g, ' ').trim();
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  element.setAttribute('aria-label', label);
  nodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    node.nodeValue.split(/(\s+)/).forEach(token => {
      if (!token) return;
      if (/^\s+$/.test(token)) {
        fragment.append(document.createTextNode(' '));
        return;
      }
      const word = document.createElement('span');
      word.className = 'split-word';
      word.setAttribute('aria-hidden', 'true');
      [...token].forEach(character => {
        const letter = document.createElement('span');
        letter.className = 'split-char';
        letter.textContent = character;
        word.append(letter);
      });
      fragment.append(word);
    });
    node.replaceWith(fragment);
  });
});

const swingSection = document.querySelector('.story');
if (swingSection && 'IntersectionObserver' in window) {
  const swingVisibility = new IntersectionObserver(([entry]) => {
    swingSection.classList.toggle('is-active', entry.isIntersecting);
  }, {rootMargin: '10% 0px'});
  swingVisibility.observe(swingSection);
} else if (swingSection) swingSection.classList.add('is-active');

// Prepare the story illustration while guests are still in the film section.
const storyIllustration = document.querySelector('.story-art img');
const cinemaForStory = document.querySelector('.cinema');
if (storyIllustration && cinemaForStory && 'IntersectionObserver' in window) {
  const storyPreload = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    storyIllustration.loading = 'eager';
    if (storyIllustration.decode) storyIllustration.decode().catch(() => {});
    storyPreload.disconnect();
  }, {rootMargin: '900px 0px'});
  storyPreload.observe(cinemaForStory);
}

if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  const motion = gsap.matchMedia();
  motion.add('(prefers-reduced-motion: no-preference)', () => {
    const entrance = gsap.timeline({defaults: {ease: 'power3.out'}});
    entrance
      .from('.hero-bg', {scale: 1.09, opacity: .55, duration: 2.1}, 0)
      .from('.love-mark', {scale: .62, rotation: -14, opacity: 0, duration: 1.1}, .18)
      .from('.hero-arch', {y: -85, opacity: 0, duration: 1.55}, .25)
      .from('.hero-figure', {y: 110, opacity: 0, duration: 1.6}, .55)
      .from('.hero-malayalam, .hero-prelude', {y: 22, opacity: 0, stagger: .12, duration: .8}, .4)
      .from('.name-inner', {yPercent: 112, stagger: .17, duration: 1.05}, .58)
      .from('.hero-amp', {scale: .65, opacity: 0, duration: .8}, .9)
      .from('.hero-details, .hero-edge', {y: 22, opacity: 0, stagger: .13, duration: .8}, 1.25);

    const ambient = [];
    ambient.push(gsap.to('.hero-bg', {scale: 1.035, xPercent: -1.1, duration: 8, delay: 2.05, repeat: -1, yoyo: true, ease: 'sine.inOut'}));
    ambient.push(gsap.to('.hero-arch img', {yPercent: 1.8, rotation: .35, transformOrigin: '50% 0%', duration: 6.7, repeat: -1, yoyo: true, ease: 'sine.inOut'}));
    ambient.push(gsap.to('.hero-figure img', {y: -7, rotation: -.28, transformOrigin: '50% 100%', duration: 4.8, repeat: -1, yoyo: true, ease: 'sine.inOut'}));
    ambient.push(gsap.to('.hero-light', {scale: 1.09, opacity: .72, duration: 5.4, repeat: -1, yoyo: true, ease: 'sine.inOut'}));
    ambient.push(gsap.to('.love-mark img', {y: -3, rotation: 1.8, duration: 4.2, repeat: -1, yoyo: true, ease: 'sine.inOut'}));

    gsap.to('.hero-bg-wrap', {yPercent: 13, ease: 'none', scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}});
    gsap.to('.hero-arch', {yPercent: 19, ease: 'none', scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}});
    gsap.to('.hero-figure-wrap', {
      // Keep the feet inside the clipped hero as the foreground figure rises.
      // The copy still travels farther, preserving the slower front plane.
      yPercent: () => matchMedia('(max-width:700px)').matches ? -16 : -12,
      xPercent: () => matchMedia('(max-width:700px)').matches ? -8 : -5,
      scale: () => matchMedia('(max-width:700px)').matches ? 1.18 : 1.1,
      transformOrigin: '50% 100%', ease: 'none',
      scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true}
    });
    gsap.to('.hero-copy', {yPercent: -29, ease: 'none', scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}});

    const invitation = document.querySelector('.invitation');
    if (invitation) {
      const invitationEntrance = gsap.timeline({
        defaults: {ease: 'power3.out'},
        scrollTrigger: {trigger: invitation, start: 'top 72%', once: true}
      });
      invitationEntrance
        .from('.invitation-backdrop', {scale: 1.08, opacity: .45, duration: 1.5}, 0)
        .from('.invitation-haze', {y: 38, opacity: 0, duration: 1.2}, .12)
        .from('.section-emblem span', {scaleX: 0, transformOrigin: 'center', duration: .55, stagger: .08}, .16)
        .from('.section-emblem i, .script-note', {y: 18, opacity: 0, duration: .65, stagger: .1}, .2)
        .from('.invitation-copy h2', {clipPath: 'inset(0 100% 0 0)', opacity: .3, duration: 1.08, ease: 'power2.inOut'}, .28)
        .from('.invitation-copy > p:not(.script-note)', {y: 28, opacity: 0, duration: .78}, .68)
        .from('.invitation-signature', {y: 22, opacity: 0, duration: .72}, .82)
        .from('.invitation-glow', {scale: .65, opacity: 0, duration: 1.1}, .2)
        .from('.invitation-portrait', {y: 65, scale: .96, opacity: 0, duration: 1.35}, .36)
        .from('.invitation-embers i', {scale: .25, opacity: 0, duration: .8, stagger: .15}, .4);

      const invitationScroll = () => ({trigger: invitation, start: 'top bottom', end: 'bottom top', scrub: true});
      gsap.fromTo('.invitation-backdrop', {y: -66}, {y: 66, ease: 'none', scrollTrigger: invitationScroll()});
      gsap.fromTo('.invitation-haze', {y: 38, x: -20}, {y: -54, x: 28, ease: 'none', scrollTrigger: invitationScroll()});
      gsap.fromTo('.invitation-floral', {y: 94, rotation: -3}, {y: -94, rotation: 3, ease: 'none', scrollTrigger: invitationScroll()});
      gsap.fromTo('.invitation-glow', {y: 45}, {y: -55, ease: 'none', scrollTrigger: invitationScroll()});
      gsap.fromTo('.invitation-art', {y: 42, scale: .96}, {y: -52, scale: 1.07, ease: 'none', scrollTrigger: invitationScroll()});
      gsap.fromTo('.invitation-portrait', {x: 13}, {x: -13, ease: 'none', scrollTrigger: invitationScroll()});
      gsap.fromTo('.invitation-copy', {y: -26}, {y: 22, ease: 'none', scrollTrigger: invitationScroll()});
      gsap.utils.toArray('.invitation-embers i').forEach((ember, index) => {
        gsap.fromTo(ember, {y: [55, -20, 42][index], x: [-24, 18, -12][index]}, {y: [-82, 67, -74][index], x: [25, -22, 19][index], ease: 'none', scrollTrigger: invitationScroll()});
      });
      gsap.fromTo('.invitation-light', {xPercent: -32, opacity: .14}, {xPercent: 30, opacity: .6, ease: 'none', scrollTrigger: invitationScroll()});
      gsap.to('.invitation-copy, .invitation-art, .invitation-embers, .invitation-floral', {opacity: 0, ease: 'none', scrollTrigger: {trigger: invitation, start: 'bottom 42%', end: 'bottom top', scrub: true}});
    }

    const story = document.querySelector('.story');
    if (story) {
      const storyEntrance = gsap.timeline({
        defaults: {ease: 'power3.out'},
        scrollTrigger: {trigger: story, start: 'top bottom+=420', once: true}
      });
      storyEntrance
        .from('.story-landscape', {scale: 1.025, opacity: .8, duration: .8}, 0)
        .from('.story-mist, .story-light', {opacity: .5, duration: .7, stagger: .08}, 0)
        .from('.story-canopy', {opacity: .5, duration: .75}, .04)
        .from('.story-aura', {scale: .9, opacity: .55, duration: .85}, 0)
        .from('.story-art img', {y: 32, scale: .98, opacity: .7, duration: .85}, .08)
        .from('.story-flower', {y: 12, opacity: 0, duration: .45}, .08)
        .from('.story-copy h2', {y: 24, opacity: 0, duration: .7}, .12)
        .from('.story-copy > p:not(.story-signoff)', {y: 18, opacity: 0, duration: .58}, .24)
        .from('.story-rule', {scaleX: 0, duration: .52, transformOrigin: 'left center'}, .3)
        .from('.story-signoff', {y: 14, opacity: 0, duration: .58}, .36);

      const storyScroll = {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true};
      gsap.to('.story-landscape', {yPercent: -4, ease: 'none', scrollTrigger: storyScroll});
      gsap.to('.story-mist', {yPercent: -8, ease: 'none', scrollTrigger: {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true}});
      gsap.to('.story-canopy', {yPercent: 7, ease: 'none', scrollTrigger: {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true}});
      gsap.to('.story-light', {yPercent: -12, ease: 'none', scrollTrigger: {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true}});
      gsap.to('.story-ripple', {yPercent: -11, scale: 1.08, ease: 'none', scrollTrigger: {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true}});
      gsap.to('.story-aura', {yPercent: -9, xPercent: 3, ease: 'none', scrollTrigger: storyScroll});
      gsap.to('.story-art img', {yPercent: -6, ease: 'none', scrollTrigger: {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true}});
      gsap.to('.story-copy', {yPercent: -3, ease: 'none', scrollTrigger: {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true}});
    }
    const dayEntrance = gsap.timeline({scrollTrigger: {trigger: '.day-heading', start: 'top 82%', once: true}});
    dayEntrance
      .from('.day-heading > p', {y: 22, opacity: 0, duration: .65, ease: 'power3.out'}, 0)
      .from('.day-heading h2 > span', {y: 24, opacity: 0, duration: .76, stagger: .12, ease: 'power3.out'}, .12)
      .from('.day-line', {scaleX: 0, transformOrigin: 'left center', duration: .85, ease: 'power3.out'}, .58);
    gsap.utils.toArray('.event').forEach(event => {
      gsap.from(event, {y: 36, opacity: 0, duration: .85, ease: 'power3.out', scrollTrigger: {trigger: event, start: 'top 88%', once: true}});
    });
    gsap.to('.day-illumination', {yPercent: 55, ease: 'none', scrollTrigger: {trigger: '.celebration', start: 'top bottom', end: 'bottom top', scrub: true}});
    const closingEntrance = gsap.timeline({scrollTrigger: {trigger: '.closing', start: 'top 78%', once: true}});
    closingEntrance
      .from('.closing-glow', {scale: .7, opacity: 0, duration: 1.15, ease: 'power3.out'}, 0)
      .from('.closing > p', {y: 20, opacity: 0, duration: .65, ease: 'power3.out'}, .08)
      .from('.closing .split-char', {yPercent: 112, opacity: 0, duration: .72, stagger: .018, ease: 'power3.out'}, .18)
      .from('.closing small, .closing a', {y: 18, opacity: 0, duration: .62, stagger: .12, ease: 'power3.out'}, .58);

    const cinema = document.querySelector('.cinema');
    const cinemaVideo = document.querySelector('.cinema-video');
    let film;
    if (cinema && cinemaVideo && window.createScrollFilm) {
      film = window.createScrollFilm(cinema, cinemaVideo);
      const clamp = value => Math.min(1, Math.max(0, value));
      const beats = [...cinema.querySelectorAll('.cinema-beat')].map(element => ({
        element, start: Number(element.dataset.beatStart), end: Number(element.dataset.beatEnd)
      }));
      let lastProgress = -1;
      const update = self => {
        const progress = self.progress;
        film.setProgress(progress);
        if (Math.abs(progress - lastProgress) < .0002) return;
        lastProgress = progress;
        cinema.style.setProperty('--cinema-progress', progress.toFixed(4));
        cinema.style.setProperty('--cinema-exit', clamp((progress - .87) / .13).toFixed(4));
        beats.forEach(({element, start, end}) => {
          const opacity = Math.min(clamp((progress - start) / .055), clamp((end - progress) / .055));
          element.style.opacity = opacity.toFixed(4);
          element.style.transform = `translate3d(0, ${(1 - opacity) * 22}px, 0)`;
        });
      };
      ScrollTrigger.create({trigger: cinema, start: 'top top', end: 'bottom bottom',
        onRefresh: self => { update(self); film.setActive(self.isActive); },
        onEnter: self => { update(self); film.setActive(true); },
        onEnterBack: self => { update(self); film.setActive(true); },
        onLeave: () => film.setActive(false), onLeaveBack: () => film.setActive(false),
        onUpdate: update
      });
    }
    const hero = document.querySelector('.hero');
    let heroVisible = true;
    const syncAmbient = () => {
      const playing = heroVisible && !document.hidden;
      ambient.forEach(tween => tween.paused(!playing));
      hero.classList.toggle('is-ambient-active', playing);
    };
    const heroObserver = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      syncAmbient();
    });
    heroObserver.observe(hero);
    document.addEventListener('visibilitychange', syncAmbient);
    return () => {
      film?.destroy();
      heroObserver.disconnect();
      document.removeEventListener('visibilitychange', syncAmbient);
      ambient.forEach(tween => tween.kill());
      hero.classList.remove('is-ambient-active');
    };

  });

  motion.add('(prefers-reduced-motion: no-preference) and (pointer: fine)', () => {
    const hero = document.querySelector('.hero');
    const backgroundX = gsap.quickTo('.hero-bg-drift', 'x', {duration: .9, ease: 'power2.out'});
    const backgroundY = gsap.quickTo('.hero-bg-drift', 'y', {duration: .9, ease: 'power2.out'});
    const figureX = gsap.quickTo('.hero-figure', 'x', {duration: .7, ease: 'power2.out'});
    const figureY = gsap.quickTo('.hero-figure', 'y', {duration: .7, ease: 'power2.out'});
    const move = event => {
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      backgroundX(-x * 16); backgroundY(-y * 13);
      figureX(x * 24); figureY(y * 13);
    };
    const reset = () => {backgroundX(0); backgroundY(0); figureX(0); figureY(0);};
    hero.addEventListener('pointermove', move, {passive: true});
    hero.addEventListener('pointerleave', reset);
    return () => {
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', reset);
    };
  });
}
