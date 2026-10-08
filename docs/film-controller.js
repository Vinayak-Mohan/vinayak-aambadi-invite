/* One decoder seek at a time; latest scroll position always wins. */
window.createScrollFilm = (section, video) => {
  const mobile = matchMedia('(max-width:700px)');
  let requested = false;
  let active = false;
  let ready = false;
  let progress = 0;
  let position = 0;
  let duration = 0;
  let raf = 0;
  let previousTick = 0;
  let seeking = false;
  let recovery = 0;
  let loader;

  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    previousTick = 0;
    clearTimeout(recovery);
    recovery = 0;
  };
  const schedule = () => {
    if (active && ready && !document.hidden && !raf) raf = requestAnimationFrame(tick);
  };
  const seekComplete = () => {
    seeking = false;
    clearTimeout(recovery);
    recovery = 0;
    if (ready) section.classList.add('is-ready');
    schedule();
  };
  const tick = now => {
    raf = 0;
    if (!active || !ready || document.hidden) return;
    const elapsed = previousTick ? Math.min(64, now - previousTick) : 16.7;
    previousTick = now;
    // Time-based easing behaves consistently on 60/90/120 Hz displays.
    position += (progress - position) * (1 - Math.exp(-elapsed / 70));
    if (Math.abs(progress - position) < .001) position = progress;
    const time = Math.min(Math.max(0, duration - 1 / 48), position * duration);
    if (!seeking && Math.abs(video.currentTime - time) >= 1 / 48) {
      seeking = true;
      // A single persistent listener prevents old seek callbacks flashing stale frames.
      video.currentTime = time;
      recovery = setTimeout(() => {
        recovery = 0;
        seeking = false;
        previousTick = 0;
        schedule();
      }, 1200);
      return;
    }
    if (!seeking && Math.abs(progress - position) > .001) schedule();
  };
  const initialise = () => {
    if (ready) return;
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.readyState < 2) return;
    duration = video.duration;
    ready = true;
    position = progress;
    video.pause();
    if (Math.abs(video.currentTime - position * duration) < 1 / 24) section.classList.add('is-ready');
    schedule();
  };
  const selectSource = () => {
    video.poster = mobile.matches ? video.dataset.mobilePoster : video.dataset.desktopPoster;
    if (!requested) return;
    stop();
    ready = false;
    seeking = false;
    position = progress;
    section.classList.remove('is-ready');
    video.preload = 'auto';
    video.src = mobile.matches ? video.dataset.mobileSrc : video.dataset.src;
    video.load();
  };
  const request = () => {
    if (requested) return;
    requested = true;
    selectSource();
    loader?.disconnect();
  };
  const visibility = () => {
    if (document.hidden) stop();
    else { seeking = false; schedule(); }
  };
  const failed = () => {
    ready = false;
    stop();
    section.classList.remove('is-ready');
  };
  video.addEventListener('loadeddata', initialise);
  video.addEventListener('canplay', initialise);
  video.addEventListener('seeked', seekComplete);
  video.addEventListener('error', failed);
  document.addEventListener('visibilitychange', visibility);
  mobile.addEventListener('change', selectSource);
  selectSource();
  if ('IntersectionObserver' in window) {
    loader = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) request();
    }, {rootMargin: '600px 0px'});
    loader.observe(section);
  } else request();

  return {
    setProgress(value) { progress = Math.min(1, Math.max(0, value)); schedule(); },
    setActive(value) {
      active = value;
      if (active) { request(); seeking = false; previousTick = 0; schedule(); }
      else stop();
    },
    destroy() {
      stop();
      loader?.disconnect();
      video.pause();
      video.removeEventListener('loadeddata', initialise);
      video.removeEventListener('canplay', initialise);
      video.removeEventListener('seeked', seekComplete);
      video.removeEventListener('error', failed);
      document.removeEventListener('visibilitychange', visibility);
      mobile.removeEventListener('change', selectSource);
      video.removeAttribute('src');
      video.load();
      section.classList.remove('is-ready');
    }
  };
};
