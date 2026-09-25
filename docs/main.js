const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  const motion = gsap.matchMedia();
  motion.add('(prefers-reduced-motion: no-preference)', () => {
    const entrance = gsap.timeline({defaults: {ease: 'power3.out'}});
    entrance
      .from('.hero-bg', {scale: 1.09, opacity: .55, duration: 2.1}, 0)
      .from('.hero-arch', {y: -85, opacity: 0, duration: 1.55}, .25)
      .from('.hero-figure', {y: 110, opacity: 0, duration: 1.6}, .55)
      .from('.hero-malayalam, .hero-prelude', {y: 22, opacity: 0, stagger: .12, duration: .8}, .4)
      .from('.name-inner', {yPercent: 112, stagger: .17, duration: 1.05}, .58)
      .from('.hero-amp', {scale: .65, opacity: 0, duration: .8}, .9)
      .from('.hero-details, .hero-cta, .hero-edge', {y: 22, opacity: 0, stagger: .13, duration: .8}, 1.25);

    gsap.to('.hero-bg-wrap', {yPercent: 13, ease: 'none', scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}});
    gsap.to('.hero-arch', {yPercent: 19, ease: 'none', scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}});
    gsap.to('.hero-figure-wrap', {yPercent: -10, ease: 'none', scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}});
    gsap.to('.hero-copy', {yPercent: -13, ease: 'none', scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}});

    gsap.from('.invitation-copy > *', {y: 34, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: {trigger: '.invitation-copy', start: 'top 82%', once: true}});
    gsap.from('.invitation-art', {y: 70, opacity: 0, duration: 1.35, ease: 'power3.out', scrollTrigger: {trigger: '.invitation-art', start: 'top 88%', once: true}});
    gsap.from('.story-copy > *', {y: 35, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: {trigger: '.story-copy', start: 'top 84%', once: true}});
    gsap.from('.story-art img', {y: 80, opacity: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: {trigger: '.story-art', start: 'top 86%', once: true}});
    gsap.from('.day-heading > *', {y: 32, opacity: 0, duration: .9, stagger: .11, ease: 'power3.out', scrollTrigger: {trigger: '.day-heading', start: 'top 82%', once: true}});
    gsap.utils.toArray('.event').forEach(event => {
      gsap.from(event, {y: 36, opacity: 0, duration: .85, ease: 'power3.out', scrollTrigger: {trigger: event, start: 'top 88%', once: true}});
    });

    const cinema = document.querySelector('.cinema');
    const cinemaVideo = document.querySelector('.cinema-video');
    if (cinema && cinemaVideo && cinemaVideo.dataset.src) {
      let cinemaInitialised = false;
      const sourceFrameRate = 24;

      const initialiseCinema = () => {
        if (cinemaInitialised) return;
        const duration = cinemaVideo.duration;
        if (!Number.isFinite(duration) || duration <= 0) return;
        cinemaInitialised = true;
        cinemaVideo.pause();

        const playhead = {time: 0};
        let displayedFrame = Math.round(cinemaVideo.currentTime * sourceFrameRate);
        let targetFrame = displayedFrame;
        let renderRequest = 0;

        const renderNextFrame = () => {
          renderRequest = 0;
          if (displayedFrame === targetFrame) return;
          displayedFrame += Math.sign(targetFrame - displayedFrame);
          cinemaVideo.currentTime = Math.min(duration, displayedFrame / sourceFrameRate);
          renderRequest = requestAnimationFrame(renderNextFrame);
        };

        const queueFrame = time => {
          targetFrame = Math.round(Math.min(duration, Math.max(0, time)) * sourceFrameRate);
          if (!renderRequest) renderRequest = requestAnimationFrame(renderNextFrame);
        };

        gsap.to(playhead, {
          time: duration,
          ease: 'none',
          onUpdate: () => queueFrame(playhead.time),
          scrollTrigger: {
            trigger: cinema,
            start: 'top top',
            end: 'bottom bottom',
            scrub: .38,
            onUpdate: self => cinema.style.setProperty('--cinema-progress', self.progress.toFixed(4))
          }
        });
        ScrollTrigger.refresh();
      };

      const prepareCinema = async () => {
        if (cinemaVideo.dataset.loaded) return;
        cinemaVideo.dataset.loaded = 'loading';
        cinemaVideo.preload = 'auto';
        try {
          const response = await fetch(cinemaVideo.dataset.src, {cache: 'force-cache'});
          if (!response.ok) throw new Error('Could not preload the cinema video.');
          cinemaVideo.src = URL.createObjectURL(await response.blob());
        } catch {
          cinemaVideo.src = cinemaVideo.dataset.src;
        }
        cinemaVideo.load();
        cinemaVideo.dataset.loaded = 'true';
        if (cinemaVideo.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) initialiseCinema();
        else cinemaVideo.addEventListener('canplaythrough', initialiseCinema, {once: true});
      };
      const preloader = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          void prepareCinema();
          preloader.disconnect();
        }
      }, {rootMargin: '1100px 0px'});
      preloader.observe(cinema);
    }

  });

  motion.add('(prefers-reduced-motion: no-preference) and (min-width: 701px) and (pointer: fine)', () => {
    const hero = document.querySelector('.hero');
    const backgroundX = gsap.quickTo('.hero-bg', 'x', {duration: .9, ease: 'power2.out'});
    const backgroundY = gsap.quickTo('.hero-bg', 'y', {duration: .9, ease: 'power2.out'});
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
    return () => {hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', reset);};
  });

  document.fonts.ready.then(() => ScrollTrigger.refresh());
  document.querySelector('.hero-bg')?.addEventListener('load', () => ScrollTrigger.refresh(), {once: true});
}
