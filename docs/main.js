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
    const story = document.querySelector('.story');
    if (story) {
      const storyEntrance = gsap.timeline({
        defaults: {ease: 'power3.out'},
        scrollTrigger: {trigger: story, start: 'top 74%', once: true}
      });
      storyEntrance
        .from('.story-aura', {scale: .68, opacity: 0, duration: 1.25}, 0)
        .from('.story-disc', {scale: .62, opacity: 0, duration: 1.15}, .04)
        .from('.story-orbit', {scale: .48, rotation: -18, opacity: 0, duration: 1.35}, .1)
        .from('.story-art img', {y: 78, scale: .92, opacity: 0, duration: 1.35}, .19)
        .from('.story-spark', {scale: 0, opacity: 0, duration: .52, stagger: .1}, .52)
        .from('.story-flower', {scale: .72, opacity: 0, duration: .55}, .22)
        .from('.story-copy h2', {y: 52, opacity: 0, duration: 1.05}, .3)
        .from('.story-copy > p:not(.story-signoff)', {y: 27, opacity: 0, duration: .72}, .57)
        .from('.story-rule', {scaleX: 0, duration: .62, transformOrigin: 'left center'}, .69)
        .from('.story-signoff', {y: 20, opacity: 0, duration: .7}, .79);

      const storyScroll = {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true};
      gsap.to('.story-aura', {yPercent: -9, xPercent: 3, ease: 'none', scrollTrigger: storyScroll});
      gsap.to('.story-disc', {yPercent: -5, xPercent: -2, ease: 'none', scrollTrigger: {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true}});
      gsap.to('.story-orbit', {yPercent: -14, xPercent: 4, ease: 'none', scrollTrigger: {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true}});
      gsap.to('.story-spark', {yPercent: -21, ease: 'none', scrollTrigger: {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true}});
      gsap.to('.story-art img', {yPercent: -6, ease: 'none', scrollTrigger: {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true}});
      gsap.to('.story-copy', {yPercent: -3, ease: 'none', scrollTrigger: {trigger: story, start: 'top bottom', end: 'bottom top', scrub: true}});
    }
    gsap.from('.day-heading > *', {y: 32, opacity: 0, duration: .9, stagger: .11, ease: 'power3.out', scrollTrigger: {trigger: '.day-heading', start: 'top 82%', once: true}});
    gsap.utils.toArray('.event').forEach(event => {
      gsap.from(event, {y: 36, opacity: 0, duration: .85, ease: 'power3.out', scrollTrigger: {trigger: event, start: 'top 88%', once: true}});
    });

    const cinema = document.querySelector('.cinema');
    const cinemaVideo = document.querySelector('.cinema-video');
    const cinemaCanvas = document.querySelector('.cinema-canvas');
    if (cinema && cinemaVideo && cinemaVideo.dataset.src) {
      const isMobileCinema = matchMedia('(max-width:700px)').matches;
      const cinemaSource = (isMobileCinema && cinemaVideo.dataset.mobileSrc) || cinemaVideo.dataset.src;
      const cinemaContext = cinemaCanvas?.getContext('2d', {alpha: false});
      if (cinemaContext) cinema.classList.add('cinema-canvas-mode');
      if (isMobileCinema) cinemaVideo.poster = cinemaVideo.dataset.mobilePoster;
      let cinemaInitialised = false;
      const sourceFrameRate = 24;

      const initialiseCinema = () => {
        if (cinemaInitialised) return;
        const duration = cinemaVideo.duration;
        if (!Number.isFinite(duration) || duration <= 0) return;
        cinemaInitialised = true;
        cinema.dataset.ready = 'true';
        cinemaVideo.pause();

        const finalFrame = Math.max(0, Math.floor(duration * sourceFrameRate) - 1);
        const frameDuration = 1 / sourceFrameRate;
        let targetFrame = Math.round(cinemaVideo.currentTime * sourceFrameRate);
        let displayedFrame = -1;
        let activeFrame = targetFrame;
        let seeking = false;
        let progressRaf = 0;
        let latestProgress = 0;

        const paintDecodedFrame = frame => {
          if (cinemaContext && cinemaCanvas && cinemaVideo.videoWidth && cinemaVideo.videoHeight) {
            if (cinemaCanvas.width !== cinemaVideo.videoWidth || cinemaCanvas.height !== cinemaVideo.videoHeight) {
              cinemaCanvas.width = cinemaVideo.videoWidth;
              cinemaCanvas.height = cinemaVideo.videoHeight;
              cinemaContext.imageSmoothingEnabled = true;
              cinemaContext.imageSmoothingQuality = 'high';
            }
            cinemaContext.drawImage(cinemaVideo, 0, 0, cinemaCanvas.width, cinemaCanvas.height);
            cinemaCanvas.classList.add('is-ready');
          }
          displayedFrame = frame;
        };

        const seekToTargetFrame = () => {
          if (seeking || displayedFrame === targetFrame) return;
          seeking = true;
          activeFrame = targetFrame;
          cinemaVideo.currentTime = Math.min(duration - frameDuration / 2, activeFrame * frameDuration);
        };

        const settleRenderedFrame = () => {
          let committed = false;
          const commit = () => {
            if (committed) return;
            committed = true;
            paintDecodedFrame(activeFrame);
            seeking = false;
            seekToTargetFrame();
          };

          if ('requestVideoFrameCallback' in cinemaVideo) cinemaVideo.requestVideoFrameCallback(commit);
          requestAnimationFrame(() => requestAnimationFrame(commit));
        };

        const applyProgress = () => {
          progressRaf = 0;
          cinema.style.setProperty('--cinema-progress', latestProgress.toFixed(4));
          targetFrame = Math.round(latestProgress * finalFrame);
          seekToTargetFrame();
        };

        const queueProgress = progress => {
          latestProgress = progress;
          if (!progressRaf) progressRaf = requestAnimationFrame(applyProgress);
        };

        cinemaVideo.addEventListener('seeked', settleRenderedFrame);
        paintDecodedFrame(targetFrame);
        ScrollTrigger.create({
          trigger: cinema,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onRefresh: self => queueProgress(self.progress),
          onUpdate: self => queueProgress(self.progress)
        });
        ScrollTrigger.refresh();
      };

      const prepareCinema = async () => {
        if (cinemaVideo.dataset.loaded) return;
        cinemaVideo.dataset.loaded = 'loading';
        cinemaVideo.preload = 'auto';
        try {
          const response = await fetch(cinemaSource, {cache: 'force-cache'});
          if (!response.ok) throw new Error('Could not preload the cinema video.');
          cinemaVideo.src = URL.createObjectURL(await response.blob());
        } catch {
          cinemaVideo.src = cinemaSource;
        }
        cinemaVideo.load();
        cinemaVideo.dataset.loaded = 'true';
        if (cinemaVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) initialiseCinema();
        else cinemaVideo.addEventListener('loadeddata', initialiseCinema, {once: true});
      };
      const preloader = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          void prepareCinema();
          preloader.disconnect();
        }
      }, {rootMargin: '2400px 0px'});
      preloader.observe(cinema);
      void prepareCinema();
    }

  });

  motion.add('(prefers-reduced-motion: no-preference)', () => {
    const hero = document.querySelector('.hero');
    const finePointer = matchMedia('(pointer: fine)').matches;
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
    if (finePointer) {
      hero.addEventListener('pointermove', move, {passive: true});
      hero.addEventListener('pointerleave', reset);
    }

    const invitation = document.querySelector('.invitation');
    const cinema = document.querySelector('.cinema');
    const story = document.querySelector('.story');
    const celebration = document.querySelector('.celebration');
    const closing = document.querySelector('.closing');
    const chapterTargets = [hero, invitation, cinema, story, celebration, closing];
    const root = document.documentElement;
    let chapterLocked = false;
    let cinemaFrame = 0;
    let cinemaStartTimer = 0;
    let releaseTimer = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchGesture = false;

    const topOf = element => element.getBoundingClientRect().top + window.scrollY;
    const releaseChapter = () => {
      chapterLocked = false;
      clearTimeout(releaseTimer);
    };
    const lockForScroll = () => {
      chapterLocked = true;
      clearTimeout(releaseTimer);
      releaseTimer = window.setTimeout(releaseChapter, 1100);
      if ('onscrollend' in window) window.addEventListener('scrollend', releaseChapter, {once: true});
    };
    const scrollToPoint = point => {
      lockForScroll();
      window.scrollTo({top: point, behavior: 'smooth'});
    };
    const stopCinemaTravel = () => {
      if (cinemaFrame) cancelAnimationFrame(cinemaFrame);
      cinemaFrame = 0;
      clearTimeout(cinemaStartTimer);
      root.classList.remove('is-cinema-auto-scroll');
    };
    const travelCinema = direction => {
      const cinemaTop = topOf(cinema);
      const cinemaEnd = cinemaTop + cinema.offsetHeight - window.innerHeight;
      const start = Math.max(cinemaTop, Math.min(window.scrollY, cinemaEnd));
      const end = direction > 0 ? cinemaEnd : cinemaTop;
      const distance = Math.abs(end - start);
      const fullDistance = Math.max(1, cinemaEnd - cinemaTop);
      const videoDuration = cinema.querySelector('.cinema-video')?.duration || 8;
      const duration = Math.max(1100, videoDuration * 1000 * distance / fullDistance);
      const run = () => {
        root.classList.add('is-cinema-auto-scroll');
        const startedAt = performance.now();
        const advance = now => {
          const progress = Math.min(1, (now - startedAt) / duration);
          window.scrollTo(0, start + (end - start) * progress);
          if (progress < 1) cinemaFrame = requestAnimationFrame(advance);
          else {
            cinemaFrame = 0;
            root.classList.remove('is-cinema-auto-scroll');
            releaseChapter();
          }
        };
        cinemaFrame = requestAnimationFrame(advance);
      };

      chapterLocked = true;
      if (direction > 0 && window.scrollY < cinemaTop - 24) {
        const transitionStart = window.scrollY;
        const transitionDistance = cinemaTop - transitionStart;
        const transitionDuration = Math.min(760, Math.max(340, transitionDistance * .28));
        const transitionedAt = performance.now();
        root.classList.add('is-cinema-auto-scroll');
        const enterCinema = now => {
          const progress = Math.min(1, (now - transitionedAt) / transitionDuration);
          const eased = 1 - Math.pow(1 - progress, 3);
          window.scrollTo(0, transitionStart + transitionDistance * eased);
          if (progress < 1) cinemaFrame = requestAnimationFrame(enterCinema);
          else {
            cinemaFrame = 0;
            root.classList.remove('is-cinema-auto-scroll');
            run();
          }
        };
        cinemaFrame = requestAnimationFrame(enterCinema);
      } else run();
    };
    const moveChapter = direction => {
      if (chapterLocked || chapterTargets.some(target => !target)) return chapterLocked;
      const invitationTop = topOf(invitation);
      const cinemaTop = topOf(cinema);
      const cinemaEnd = cinemaTop + cinema.offsetHeight - window.innerHeight;
      const storyTop = topOf(story);
      const celebrationTop = topOf(celebration);
      const closingTop = topOf(closing);
      const current = window.scrollY;
      let handled = false;

      if (direction > 0) {
        if (current < invitationTop - 40) {
          scrollToPoint(invitationTop);
          handled = true;
        } else if (current < cinemaEnd - 40) {
          travelCinema(1);
          handled = true;
        } else if (current < storyTop - 40) {
          scrollToPoint(storyTop);
          handled = true;
        } else if (current < celebrationTop - 40) {
          scrollToPoint(celebrationTop);
          handled = true;
        } else if (current < closingTop - 40) {
          scrollToPoint(closingTop);
          handled = true;
        }
      } else if (direction < 0) {
        if (current <= invitationTop + 40) {
          scrollToPoint(topOf(hero));
          handled = true;
        } else if (current <= cinemaTop + 40) {
          scrollToPoint(invitationTop);
          handled = true;
        } else if (current <= cinemaEnd + 40) {
          travelCinema(-1);
          handled = true;
        } else if (current <= storyTop + 40) {
          scrollToPoint(cinemaEnd);
          handled = true;
        } else if (current <= celebrationTop + 40) {
          scrollToPoint(storyTop);
          handled = true;
        } else if (current <= closingTop + 40) {
          scrollToPoint(celebrationTop);
          handled = true;
        }
      }

      return handled;
    };
    const onWheel = event => {
      if (Math.abs(event.deltaY) < 12 || event.ctrlKey) return;
      if (moveChapter(Math.sign(event.deltaY))) event.preventDefault();
    };
    const onTouchStart = event => {
      if (event.touches.length !== 1) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchGesture = true;
    };
    const onTouchMove = event => {
      if (!touchGesture || event.touches.length !== 1) return;
      const deltaY = touchStartY - event.touches[0].clientY;
      const deltaX = touchStartX - event.touches[0].clientX;
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) event.preventDefault();
    };
    const onTouchEnd = event => {
      if (!touchGesture) return;
      touchGesture = false;
      const touch = event.changedTouches[0];
      const deltaY = touchStartY - touch.clientY;
      const deltaX = touchStartX - touch.clientX;
      if (Math.abs(deltaY) < 34 || Math.abs(deltaY) <= Math.abs(deltaX)) return;
      if (moveChapter(Math.sign(deltaY))) event.preventDefault();
    };

    root.classList.add('guided-chapters');
    window.addEventListener('wheel', onWheel, {passive: false});
    window.addEventListener('touchstart', onTouchStart, {passive: true});
    window.addEventListener('touchmove', onTouchMove, {passive: false});
    window.addEventListener('touchend', onTouchEnd, {passive: false});
    return () => {
      if (finePointer) {
        hero.removeEventListener('pointermove', move);
        hero.removeEventListener('pointerleave', reset);
      }
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      stopCinemaTravel();
      clearTimeout(releaseTimer);
      root.classList.remove('guided-chapters');
    };
  });

  document.fonts.ready.then(() => ScrollTrigger.refresh());
  document.querySelector('.hero-bg')?.addEventListener('load', () => ScrollTrigger.refresh(), {once: true});
}
